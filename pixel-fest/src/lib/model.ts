export interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

/** `reference`: undefined = previous frame (default), null = none, number = id of another frame. */
export interface Frame {
  id: number
  duration: number
  reference: number | null | undefined
  /** RGBA, width*height*4. Fully transparent pixels are always 0,0,0,0. */
  pixels: Uint8ClampedArray
}

export interface Project {
  name: string
  width: number
  height: number
  /** Loop count for the exported animation; 0 = forever. */
  loop: number
  frames: Frame[]
}

export const MAX_SIZE = 128
export const DEFAULT_DURATION = 100
export const MIN_DURATION = 10
export const MAX_DURATION = 60000

let idCounter = 0
export const newId = () => ++idCounter

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function blankFrame(width: number, height: number, duration = DEFAULT_DURATION): Frame {
  return { id: newId(), duration, reference: undefined, pixels: new Uint8ClampedArray(width * height * 4) }
}

export function cloneFrame(frame: Frame): Frame {
  return { ...frame, id: newId(), pixels: new Uint8ClampedArray(frame.pixels) }
}

export function createProject(name: string, width: number, height: number): Project {
  return { name, width, height, loop: 0, frames: [blankFrame(width, height)] }
}

/** Crop or pad every frame. Anchors: 0 = start, 1 = center, 2 = end, per axis. */
export function resizeProject(p: Project, width: number, height: number, ax: 0 | 1 | 2, ay: 0 | 1 | 2): Project {
  const place = (anchor: number, from: number, to: number) =>
    anchor === 0 ? 0 : anchor === 1 ? Math.floor((to - from) / 2) : to - from
  const ox = place(ax, p.width, width)
  const oy = place(ay, p.height, height)
  const frames = p.frames.map((f) => {
    const pixels = new Uint8ClampedArray(width * height * 4)
    for (let y = 0; y < p.height; y++) {
      const ny = y + oy
      if (ny < 0 || ny >= height) continue
      for (let x = 0; x < p.width; x++) {
        const nx = x + ox
        if (nx < 0 || nx >= width) continue
        const s = (y * p.width + x) * 4
        pixels.set(f.pixels.subarray(s, s + 4), (ny * width + nx) * 4)
      }
    }
    return { ...f, pixels }
  })
  return { ...p, width, height, frames }
}

export function packColor(c: RGBA): number {
  return c.a === 0 ? 0 : ((c.r | (c.g << 8) | (c.b << 16) | (c.a << 24)) >>> 0)
}

export function unpackColor(v: number): RGBA {
  return { r: v & 255, g: (v >>> 8) & 255, b: (v >>> 16) & 255, a: v >>> 24 }
}

const h2 = (n: number) => n.toString(16).padStart(2, '0')

export function toHex(c: RGBA, withAlpha = c.a < 255): string {
  return '#' + h2(c.r) + h2(c.g) + h2(c.b) + (withAlpha ? h2(c.a) : '')
}

/** Accepts #rgb, #rrggbb and #rrggbbaa, with or without the leading #. */
export function parseHex(text: string): RGBA | null {
  let s = text.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(s)) s = s.replace(/./g, (ch) => ch + ch)
  if (!/^([0-9a-f]{6}|[0-9a-f]{8})$/i.test(s)) return null
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
    a: s.length === 8 ? parseInt(s.slice(6, 8), 16) : 255,
  }
}

/** The frame shown beneath `frames[index]` as a drawing aid, if any. */
export function referenceFor(p: Project, index: number): Frame | null {
  const ref = p.frames[index]?.reference
  if (ref === null) return null
  if (ref !== undefined) {
    const found = p.frames.find((f) => f.id === ref)
    if (found && found !== p.frames[index]) return found
  }
  return index > 0 ? p.frames[index - 1] : null
}
