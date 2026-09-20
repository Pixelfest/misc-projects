import { encodeAnimation } from 'wasm-webp'
import type { Project } from './model'

function scaled(pixels: Uint8ClampedArray, w: number, h: number, k: number): Uint8Array {
  if (k === 1) return new Uint8Array(pixels)
  const src = new Uint32Array(pixels.buffer, pixels.byteOffset, w * h)
  const out = new Uint32Array(w * k * h * k)
  for (let y = 0; y < h * k; y++) {
    const row = Math.floor(y / k) * w
    for (let x = 0; x < w * k; x++) out[y * w * k + x] = src[row + Math.floor(x / k)]
  }
  return new Uint8Array(out.buffer)
}

/** Lossless animated WebP with transparency; pixels are enlarged nearest-neighbor by an integer factor. */
export async function exportWebp(p: Project, scale: number): Promise<Uint8Array> {
  const frames = p.frames.map((f) => ({
    data: scaled(f.pixels, p.width, p.height, scale),
    duration: f.duration,
    config: { lossless: 1, quality: 100 },
  }))
  const out = await encodeAnimation(p.width * scale, p.height * scale, true, frames)
  if (!out) throw new Error('The WebP encoder failed.')
  return setAnimationHeader(out, p.loop)
}

/** The encoder always writes "loop forever" on a white background; set our loop count and a transparent background. */
function setAnimationHeader(webp: Uint8Array, loop: number): Uint8Array {
  const out = new Uint8Array(webp)
  for (let i = 12; i + 14 <= out.length; i++) {
    if (out[i] === 0x41 && out[i + 1] === 0x4e && out[i + 2] === 0x49 && out[i + 3] === 0x4d) {
      out.fill(0, i + 8, i + 12)
      out[i + 12] = loop & 255
      out[i + 13] = (loop >> 8) & 255
      break
    }
  }
  return out
}
