import { packColor, unpackColor, type Project, type RGBA } from './model'

export const PALETTE_SIZE = 8

/** The most-used exact RGBA colors across all frames. Transparent pixels never count. */
export function computePalette(p: Project, size = PALETTE_SIZE): RGBA[] {
  const counts = new Map<number, number>()
  for (const f of p.frames) {
    const words = new Uint32Array(f.pixels.buffer, f.pixels.byteOffset, p.width * p.height)
    for (let i = 0; i < words.length; i++) {
      const v = words[i]
      if (v >>> 24 === 0) continue
      counts.set(v, (counts.get(v) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, size)
    .map(([v]) => unpackColor(v))
}

export const sameColor = (a: RGBA, b: RGBA) => packColor(a) === packColor(b)
