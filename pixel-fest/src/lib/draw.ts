import { packColor, type RGBA } from './model'

export function plot(px: Uint8ClampedArray, w: number, h: number, x: number, y: number, c: RGBA) {
  if (x < 0 || y < 0 || x >= w || y >= h) return
  const i = (y * w + x) * 4
  if (c.a === 0) {
    px[i] = px[i + 1] = px[i + 2] = px[i + 3] = 0
  } else {
    px[i] = c.r
    px[i + 1] = c.g
    px[i + 2] = c.b
    px[i + 3] = c.a
  }
}

export function readPixel(px: Uint8ClampedArray, w: number, h: number, x: number, y: number): RGBA | null {
  if (x < 0 || y < 0 || x >= w || y >= h) return null
  const i = (y * w + x) * 4
  return { r: px[i], g: px[i + 1], b: px[i + 2], a: px[i + 3] }
}

/** Bresenham; calls `fn` for every cell on the line including both ends. */
export function line(x0: number, y0: number, x1: number, y1: number, fn: (x: number, y: number) => void) {
  const dx = Math.abs(x1 - x0)
  const dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  for (;;) {
    fn(x0, y0)
    if (x0 === x1 && y0 === y1) return
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x0 += sx
    }
    if (e2 <= dx) {
      err += dx
      y0 += sy
    }
  }
}

/** 4-connected flood fill of the exact color under (x, y). */
export function floodFill(px: Uint8ClampedArray, w: number, h: number, x: number, y: number, c: RGBA) {
  if (x < 0 || y < 0 || x >= w || y >= h) return
  const words = new Uint32Array(px.buffer, px.byteOffset, w * h)
  const target = words[y * w + x]
  const value = packColor(c)
  if (target === value) return
  const stack = [y * w + x]
  while (stack.length) {
    const start = stack.pop()!
    if (words[start] !== target) continue
    const row = Math.floor(start / w) * w
    let left = start
    let right = start
    while (left > row && words[left - 1] === target) left--
    while (right < row + w - 1 && words[right + 1] === target) right++
    for (let i = left; i <= right; i++) {
      words[i] = value
      if (row > 0 && words[i - w] === target) stack.push(i - w)
      if (row + w < w * h && words[i + w] === target) stack.push(i + w)
    }
  }
}

/** A copy of `src` moved by (dx, dy); pixels pushed past an edge are cut off. */
export function shifted(src: Uint8ClampedArray, w: number, h: number, dx: number, dy: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(src.length)
  for (let y = 0; y < h; y++) {
    const ny = y + dy
    if (ny < 0 || ny >= h) continue
    for (let x = 0; x < w; x++) {
      const nx = x + dx
      if (nx < 0 || nx >= w) continue
      const s = (y * w + x) * 4
      out.set(src.subarray(s, s + 4), (ny * w + nx) * 4)
    }
  }
  return out
}

export function readRect(px: Uint8ClampedArray, w: number, x: number, y: number, rw: number, rh: number) {
  const out = new Uint8ClampedArray(rw * rh * 4)
  for (let row = 0; row < rh; row++) {
    const s = ((y + row) * w + x) * 4
    out.set(px.subarray(s, s + rw * 4), row * rw * 4)
  }
  return out
}

export function clearRect(px: Uint8ClampedArray, w: number, x: number, y: number, rw: number, rh: number) {
  for (let row = 0; row < rh; row++) {
    const s = ((y + row) * w + x) * 4
    px.fill(0, s, s + rw * 4)
  }
}

/** Copies the non-transparent pixels of `data` onto `px` at (x, y), clipped to the canvas. */
export function stamp(
  px: Uint8ClampedArray, w: number, h: number,
  data: Uint8ClampedArray, dw: number, dh: number, x: number, y: number,
) {
  for (let row = 0; row < dh; row++) {
    const ty = y + row
    if (ty < 0 || ty >= h) continue
    for (let col = 0; col < dw; col++) {
      const tx = x + col
      if (tx < 0 || tx >= w) continue
      const s = (row * dw + col) * 4
      if (data[s + 3] === 0) continue
      px.set(data.subarray(s, s + 4), (ty * w + tx) * 4)
    }
  }
}

export function samePixels(a: Uint8ClampedArray, b: Uint8ClampedArray): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}
