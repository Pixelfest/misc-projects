import { MAX_SIZE, newId, packColor, toHex, parseHex, type Frame, type Project } from './model'

/** See docs/adr/0001-json-project-format.md */
const FORMAT = 'pixelfest'
const VERSION = 1

interface FileFrame {
  duration: number
  /** Index of the reference frame; omitted = previous frame, null = none. */
  reference?: number | null
  /** Base64 of deflate-raw compressed palette indices, one or two (LE) bytes per pixel. */
  data: string
}

interface FileFormat {
  format: typeof FORMAT
  version: number
  name: string
  width: number
  height: number
  loop: number
  /** Index 0 is always fully transparent. */
  colors: string[]
  frames: FileFrame[]
}

async function pipe(bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream) {
  const out = new Blob([bytes]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(out).arrayBuffer())
}

function toBase64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const s = atob(text)
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

export async function serializeProject(p: Project): Promise<string> {
  const index = new Map<number, number>([[0, 0]])
  const colors = ['#00000000']
  const words = p.frames.map((f) => new Uint32Array(f.pixels.buffer, f.pixels.byteOffset, p.width * p.height))
  for (const w of words) {
    for (const v of w) {
      const key = v >>> 24 === 0 ? 0 : v
      if (index.has(key)) continue
      index.set(key, colors.length)
      colors.push(toHex({ r: v & 255, g: (v >>> 8) & 255, b: (v >>> 16) & 255, a: v >>> 24 }, true))
    }
  }
  const wide = colors.length > 256
  const frames: FileFrame[] = []
  for (let n = 0; n < p.frames.length; n++) {
    const src = p.frames[n]
    const w = words[n]
    const raw = new Uint8Array(w.length * (wide ? 2 : 1))
    for (let i = 0; i < w.length; i++) {
      const idx = index.get(w[i] >>> 24 === 0 ? 0 : w[i])!
      if (wide) {
        raw[i * 2] = idx & 255
        raw[i * 2 + 1] = idx >> 8
      } else raw[i] = idx
    }
    const frame: FileFrame = { duration: src.duration, data: toBase64(await pipe(raw, new CompressionStream('deflate-raw'))) }
    if (src.reference === null) frame.reference = null
    else if (src.reference !== undefined) {
      const at = p.frames.findIndex((f) => f.id === src.reference)
      if (at >= 0) frame.reference = at
    }
    frames.push(frame)
  }
  const file: FileFormat = { format: FORMAT, version: VERSION, name: p.name, width: p.width, height: p.height, loop: p.loop, colors, frames }
  return JSON.stringify(file)
}

export async function deserializeProject(text: string): Promise<Project> {
  let file: FileFormat
  try {
    file = JSON.parse(text)
  } catch {
    throw new Error('This is not a valid Pixel Fest file.')
  }
  if (file?.format !== FORMAT) throw new Error('This is not a Pixel Fest project.')
  if (typeof file.version !== 'number' || file.version > VERSION) throw new Error('This project was made with a newer version of Pixel Fest.')
  const { width, height } = file
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > MAX_SIZE || height > MAX_SIZE)
    throw new Error('The project has an invalid canvas size.')
  if (!Array.isArray(file.colors) || !Array.isArray(file.frames) || file.frames.length === 0) throw new Error('The project is empty or damaged.')

  const colors = file.colors.map((c) => {
    const parsed = parseHex(c)
    if (!parsed) throw new Error('The project has an invalid color.')
    return packColor(parsed)
  })
  const wide = colors.length > 256
  const frames: Frame[] = []
  for (const ff of file.frames) {
    const raw = await pipe(fromBase64(ff.data), new DecompressionStream('deflate-raw'))
    if (raw.length !== width * height * (wide ? 2 : 1)) throw new Error('A frame has the wrong size.')
    const pixels = new Uint8ClampedArray(width * height * 4)
    const words = new Uint32Array(pixels.buffer)
    for (let i = 0; i < words.length; i++) {
      const idx = wide ? raw[i * 2] | (raw[i * 2 + 1] << 8) : raw[i]
      if (idx >= colors.length) throw new Error('A frame refers to a missing color.')
      words[i] = colors[idx]
    }
    frames.push({ id: newId(), duration: Number(ff.duration) || 100, reference: undefined, pixels })
  }
  file.frames.forEach((ff, i) => {
    if (ff.reference === null) frames[i].reference = null
    else if (typeof ff.reference === 'number' && frames[ff.reference]) frames[i].reference = frames[ff.reference].id
  })
  return { name: String(file.name ?? 'Untitled'), width, height, loop: Math.max(0, Math.floor(Number(file.loop) || 0)), frames }
}

// --- Files on disk -------------------------------------------------------

type FileHandle = { createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>; name: string }

export const canSaveInPlace = () => 'showSaveFilePicker' in window

/** Saves to disk. Returns the handle (when the browser supports it) so the next save can overwrite in place. */
export async function saveProjectFile(text: string, name: string, handle: FileHandle | null): Promise<FileHandle | null> {
  const fileName = `${name.replace(/[\\/:*?"<>|]+/g, '_') || 'project'}.pixelfest.json`
  if (canSaveInPlace()) {
    const target: FileHandle =
      handle ?? (await (window as any).showSaveFilePicker({ suggestedName: fileName, types: [{ description: 'Pixel Fest project', accept: { 'application/json': ['.json'] } }] }))
    const w = await target.createWritable()
    await w.write(text)
    await w.close()
    return target
  }
  downloadBlob(new Blob([text], { type: 'application/json' }), fileName)
  return null
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function pickTextFile(): Promise<{ text: string; name: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      resolve(file ? { text: await file.text(), name: file.name } : null)
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}

// --- Autosave (IndexedDB) ---------------------------------------------------

const DB = 'pixelfest'
const STORE = 'kv'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function kv<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = run(db.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

export const writeAutosave = (text: string) => kv('readwrite', (s) => s.put(text, 'autosave')).then(() => undefined)
export const readAutosave = () => kv<string | undefined>('readonly', (s) => s.get('autosave'))
