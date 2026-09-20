import { clearRect, floodFill, line, plot, readPixel, readRect, samePixels, shifted, stamp } from './draw'
import {
  blankFrame, clamp, cloneFrame, createProject, MAX_DURATION, MAX_SIZE, MIN_DURATION, resizeProject,
  type Frame, type Project, type RGBA,
} from './model'
import { computePalette } from './palette'
import { deserializeProject, serializeProject } from './storage'

export type Tool = 'pencil' | 'line' | 'fill' | 'picker' | 'select' | 'shift'

export interface Selection {
  x: number
  y: number
  w: number
  h: number
  /** Content lifted out of the frame and floating over it, if any. */
  floating: Uint8ClampedArray | null
  /** Frame pixels from before the content was lifted, for undo. */
  before: Uint8ClampedArray | null
}

interface HistoryEntry {
  undo(): void
  redo(): void
}

const HISTORY_LIMIT = 100
let clipboard: { w: number; h: number; data: Uint8ClampedArray } | null = null

type Drag =
  | { kind: 'pencil' | 'line' | 'fill' | 'shift'; pixels: Uint8ClampedArray; before: Uint8ClampedArray; sx: number; sy: number; lx: number; ly: number }
  | { kind: 'select-rect'; sx: number; sy: number; moved: boolean }
  | { kind: 'select-move'; lx: number; ly: number }

class Editor {
  project = $state.raw<Project>(createProject('Untitled', 32, 32))
  current = $state(0)
  /** Bumped on every visible change, including mid-stroke. */
  rev = $state(0)
  /** Bumped when a change is finished; thumbnails and the palette follow this. */
  settledRev = $state(0)
  color = $state<RGBA>({ r: 0, g: 0, b: 0, a: 255 })
  tool = $state<Tool>('pencil')
  onionOpacity = $state(0.35)
  palette = $state.raw<RGBA[]>([])
  selection = $state.raw<Selection | null>(null)
  /** True when there are changes not yet written to a file (or, in a Library, not yet marked as safe). */
  dirty = $state(false)
  /** Bumped on every change to the project's content or name; cloud sync compares it with what it last uploaded. */
  editVersion = $state(0)
  /** Bumped whenever a different project replaces the open one (new / open). */
  projectKey = $state(0)
  canUndo = $state(false)
  canRedo = $state(false)
  error = $state('')

  private done: HistoryEntry[] = []
  private undone: HistoryEntry[] = []
  private drag: Drag | null = null

  get frame(): Frame {
    return this.project.frames[this.current]
  }

  constructor() {
    this.palette = computePalette(this.project)
  }

  // --- change tracking -----------------------------------------------------

  private touch() {
    this.rev++
  }

  private changed() {
    this.rev++
    this.settledRev++
    this.dirty = true
    this.editVersion++
    this.palette = computePalette(this.project)
  }

  private pushHistory(entry: HistoryEntry) {
    this.done.push(entry)
    if (this.done.length > HISTORY_LIMIT) this.done.shift()
    this.undone = []
    this.syncHistory()
  }

  private syncHistory() {
    this.canUndo = this.done.length > 0
    this.canRedo = this.undone.length > 0
  }

  undo() {
    this.cancelFloating()
    const e = this.done.pop()
    if (!e) return
    e.undo()
    this.undone.push(e)
    this.syncHistory()
  }

  redo() {
    this.cancelFloating()
    const e = this.undone.pop()
    if (!e) return
    e.redo()
    this.done.push(e)
    this.syncHistory()
  }

  // --- project level -----------------------------------------------------------

  /** Replaces the whole project and forgets undo history (new / open). */
  replaceProject(p: Project, markDirty = true) {
    this.projectKey++
    this.project = p
    this.current = 0
    this.selection = null
    this.drag = null
    this.done = []
    this.undone = []
    this.syncHistory()
    this.changed()
    this.dirty = markDirty
  }

  newProject(name: string, w: number, h: number) {
    this.replaceProject(createProject(name || 'Untitled', clamp(w, 1, MAX_SIZE), clamp(h, 1, MAX_SIZE)))
  }

  async openText(text: string) {
    this.replaceProject(await deserializeProject(text), false)
  }

  async saveText(): Promise<string> {
    this.commitSelection()
    return serializeProject(this.project)
  }

  /** Swaps in a new project shape (frames, size, metadata) as one undoable step. */
  private setProject(next: Project, current: number) {
    this.commitSelection()
    const prev = { project: this.project, current: this.current }
    const apply = (project: Project, current: number) => {
      this.project = project
      this.current = clamp(current, 0, project.frames.length - 1)
      this.selection = null
      this.changed()
    }
    apply(next, current)
    this.pushHistory({ undo: () => apply(prev.project, prev.current), redo: () => apply(next, current) })
  }

  private withFrames(frames: Frame[], current: number) {
    this.setProject({ ...this.project, frames }, current)
  }

  setName(name: string) {
    this.project = { ...this.project, name }
    this.dirty = true
    this.editVersion++
  }

  setLoop(loop: number) {
    this.setProject({ ...this.project, loop: clamp(Math.floor(loop) || 0, 0, 65535) }, this.current)
  }

  resize(w: number, h: number, ax: 0 | 1 | 2, ay: 0 | 1 | 2) {
    this.commitSelection()
    this.setProject(resizeProject(this.project, clamp(w, 1, MAX_SIZE), clamp(h, 1, MAX_SIZE), ax, ay), this.current)
  }

  // --- frames ------------------------------------------------------------------------

  selectFrame(i: number) {
    if (i === this.current || i < 0 || i >= this.project.frames.length) return
    this.commitSelection()
    this.selection = null
    this.current = i
    this.touch()
  }

  addFrame() {
    const f = blankFrame(this.project.width, this.project.height, this.frame.duration)
    const frames = this.project.frames.slice()
    frames.splice(this.current + 1, 0, f)
    this.withFrames(frames, this.current + 1)
  }

  duplicateFrame() {
    this.commitSelection()
    const frames = this.project.frames.slice()
    frames.splice(this.current + 1, 0, cloneFrame(this.frame))
    this.withFrames(frames, this.current + 1)
  }

  deleteFrame() {
    if (this.project.frames.length < 2) return
    const frames = this.project.frames.filter((_, i) => i !== this.current)
    this.withFrames(frames, Math.min(this.current, frames.length - 1))
  }

  moveFrame(from: number, to: number) {
    const n = this.project.frames.length
    if (from === to || from < 0 || to < 0 || from >= n || to >= n) return
    const frames = this.project.frames.slice()
    const [f] = frames.splice(from, 1)
    frames.splice(to, 0, f)
    this.withFrames(frames, to)
  }

  private updateFrame(i: number, patch: Partial<Pick<Frame, 'duration' | 'reference'>>) {
    const frames = this.project.frames.map((f, n) => (n === i ? { ...f, ...patch } : f))
    this.setProject({ ...this.project, frames }, this.current)
  }

  setDuration(i: number, ms: number) {
    const duration = clamp(Math.round(ms) || 0, MIN_DURATION, MAX_DURATION)
    if (duration !== this.project.frames[i].duration) this.updateFrame(i, { duration })
  }

  setAllDurations(ms: number) {
    const duration = clamp(Math.round(ms) || 0, MIN_DURATION, MAX_DURATION)
    this.setProject({ ...this.project, frames: this.project.frames.map((f) => ({ ...f, duration })) }, this.current)
  }

  setReference(i: number, reference: number | null | undefined) {
    if (this.project.frames[i].reference !== reference) this.updateFrame(i, { reference })
  }

  // --- tools ----------------------------------------------------------------------------

  setTool(tool: Tool) {
    if (tool !== 'select') this.commitSelection()
    if (tool !== 'select') this.selection = null
    this.tool = tool
    this.touch()
  }

  setColor(c: RGBA) {
    this.color = { r: c.r, g: c.g, b: c.b, a: c.a }
  }

  private pushPixels(pixels: Uint8ClampedArray, frameId: number, before: Uint8ClampedArray, after: Uint8ClampedArray) {
    const apply = (data: Uint8ClampedArray) => {
      pixels.set(data)
      const at = this.project.frames.findIndex((f) => f.id === frameId)
      if (at >= 0) this.current = at
      this.selection = null
      this.changed()
    }
    this.pushHistory({ undo: () => apply(before), redo: () => apply(after) })
  }

  pointerDown(x: number, y: number) {
    const { width: w, height: h } = this.project
    const f = this.frame
    const tool = this.tool
    if (tool === 'picker') {
      const c = readPixel(f.pixels, w, h, x, y)
      if (c) this.setColor(c)
      this.drag = null
      return
    }
    if (tool === 'select') return this.selectDown(x, y)
    const before = new Uint8ClampedArray(f.pixels)
    this.drag = { kind: tool, pixels: f.pixels, before, sx: x, sy: y, lx: x, ly: y }
    if (tool === 'pencil' || tool === 'line') plot(f.pixels, w, h, x, y, this.color)
    else if (tool === 'fill') {
      floodFill(f.pixels, w, h, x, y, this.color)
      this.pointerUp()
      return
    }
    this.touch()
  }

  pointerMove(x: number, y: number) {
    const d = this.drag
    if (!d) return
    const { width: w, height: h } = this.project
    if (d.kind === 'pencil') {
      if (x === d.lx && y === d.ly) return
      line(d.lx, d.ly, x, y, (px, py) => plot(d.pixels, w, h, px, py, this.color))
      d.lx = x
      d.ly = y
    } else if (d.kind === 'line') {
      if (x === d.lx && y === d.ly) return
      d.pixels.set(d.before)
      line(d.sx, d.sy, x, y, (px, py) => plot(d.pixels, w, h, px, py, this.color))
      d.lx = x
      d.ly = y
    } else if (d.kind === 'shift') {
      if (x === d.lx && y === d.ly) return
      d.pixels.set(shifted(d.before, w, h, x - d.sx, y - d.sy))
      d.lx = x
      d.ly = y
    } else if (d.kind === 'select-rect') {
      const cx = clamp(x, 0, w - 1)
      const cy = clamp(y, 0, h - 1)
      const sx = clamp(d.sx, 0, w - 1)
      const sy = clamp(d.sy, 0, h - 1)
      if (cx !== sx || cy !== sy) d.moved = true
      this.selection = { x: Math.min(sx, cx), y: Math.min(sy, cy), w: Math.abs(cx - sx) + 1, h: Math.abs(cy - sy) + 1, floating: null, before: null }
    } else if (d.kind === 'select-move') {
      const s = this.selection
      if (!s || (x === d.lx && y === d.ly)) return
      this.selection = { ...s, x: s.x + x - d.lx, y: s.y + y - d.ly }
      d.lx = x
      d.ly = y
    }
    this.touch()
  }

  pointerUp() {
    const d = this.drag
    this.drag = null
    if (!d) return
    if (d.kind === 'select-rect') {
      if (!d.moved) this.selection = null
      this.touch()
      return
    }
    if (d.kind === 'select-move') return
    if (!samePixels(d.before, d.pixels)) this.pushPixels(d.pixels, this.frame.id, d.before, new Uint8ClampedArray(d.pixels))
    this.changed()
  }

  /** Aborts the gesture in progress (e.g. a second finger landed) and undoes what it drew. */
  cancelStroke() {
    const d = this.drag
    this.drag = null
    if (!d) return
    if (d.kind === 'pencil' || d.kind === 'line' || d.kind === 'fill' || d.kind === 'shift') d.pixels.set(d.before)
    this.touch()
  }

  // --- selection --------------------------------------------------------------------------------

  private selectDown(x: number, y: number) {
    const s = this.selection
    if (s && x >= s.x && y >= s.y && x < s.x + s.w && y < s.y + s.h) {
      if (!s.floating) this.lift(s)
      this.drag = { kind: 'select-move', lx: x, ly: y }
    } else {
      this.commitSelection()
      this.selection = null
      this.drag = { kind: 'select-rect', sx: x, sy: y, moved: false }
    }
    this.touch()
  }

  private lift(s: Selection) {
    const { width: w } = this.project
    const px = this.frame.pixels
    const before = new Uint8ClampedArray(px)
    const floating = readRect(px, w, s.x, s.y, s.w, s.h)
    clearRect(px, w, s.x, s.y, s.w, s.h)
    this.selection = { ...s, floating, before }
  }

  /** Puts floating content down on the frame and records one undo step. The selection rectangle stays. */
  commitSelection() {
    const s = this.selection
    if (!s?.floating || !s.before) return
    const { width: w, height: h } = this.project
    const px = this.frame.pixels
    stamp(px, w, h, s.floating, s.w, s.h, s.x, s.y)
    this.selection = { ...s, floating: null, before: null }
    if (!samePixels(s.before, px)) this.pushPixels(px, this.frame.id, s.before, new Uint8ClampedArray(px))
    this.changed()
  }

  /** Throws away floating content, restoring the frame as it was before it was lifted. */
  private cancelFloating() {
    const s = this.selection
    if (!s?.floating || !s.before) return
    this.frame.pixels.set(s.before)
    this.selection = null
    this.changed()
  }

  copySelection() {
    const s = this.selection
    if (!s) return
    const data = s.floating ?? readRect(this.frame.pixels, this.project.width, s.x, s.y, s.w, s.h)
    clipboard = { w: s.w, h: s.h, data: new Uint8ClampedArray(data) }
  }

  deleteSelection() {
    const s = this.selection
    if (!s) return
    if (s.floating && s.before) {
      // Dropping floating content leaves its source area cleared.
      const px = this.frame.pixels
      this.selection = { ...s, floating: null, before: null }
      if (!samePixels(s.before, px)) this.pushPixels(px, this.frame.id, s.before, new Uint8ClampedArray(px))
    } else {
      const px = this.frame.pixels
      const before = new Uint8ClampedArray(px)
      clearRect(px, this.project.width, s.x, s.y, s.w, s.h)
      if (!samePixels(before, px)) this.pushPixels(px, this.frame.id, before, new Uint8ClampedArray(px))
    }
    this.changed()
  }

  cutSelection() {
    this.copySelection()
    this.deleteSelection()
  }

  pasteSelection() {
    if (!clipboard) return
    this.commitSelection()
    this.tool = 'select'
    const before = new Uint8ClampedArray(this.frame.pixels)
    this.selection = { x: 0, y: 0, w: clipboard.w, h: clipboard.h, floating: new Uint8ClampedArray(clipboard.data), before }
    this.touch()
  }

  /** Commits any floating content and drops the selection rectangle. */
  deselect() {
    this.commitSelection()
    this.selection = null
    this.touch()
  }
}

export const editor = new Editor()
