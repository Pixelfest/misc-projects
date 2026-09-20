<script lang="ts">
  import { onMount } from 'svelte'
  import { stamp } from './draw'
  import { editor } from './editor.svelte'
  import { clamp, referenceFor } from './model'

  let { onstagedown }: { onstagedown?: () => void } = $props()

  let stage: HTMLDivElement
  let checkerCanvas: HTMLCanvasElement
  let onionCanvas: HTMLCanvasElement
  let frameCanvas: HTMLCanvasElement

  let scale = $state(8)
  let tx = $state(0)
  let ty = $state(0)
  let hover = $state<{ x: number; y: number } | null>(null)
  let panning = $state(false)
  let spaceDown = $state(false)

  const MIN_SCALE = 0.5
  const MAX_SCALE = 96

  const w = $derived(editor.project.width)
  const h = $derived(editor.project.height)

  function fit() {
    const r = stage.getBoundingClientRect()
    const raw = Math.min((r.width - 32) / w, (r.height - 32) / h)
    scale = clamp(raw >= 1 ? Math.floor(raw) : raw, MIN_SCALE, MAX_SCALE)
    tx = (r.width - w * scale) / 2
    ty = (r.height - h * scale) / 2
  }

  function zoomAt(cx: number, cy: number, next: number) {
    next = clamp(next, MIN_SCALE, MAX_SCALE)
    tx = cx - ((cx - tx) * next) / scale
    ty = cy - ((cy - ty) * next) / scale
    scale = next
  }

  function zoomBy(factor: number) {
    const r = stage.getBoundingClientRect()
    zoomAt(r.width / 2, r.height / 2, scale * factor)
  }

  function actualPixels() {
    const r = stage.getBoundingClientRect()
    zoomAt(r.width / 2, r.height / 2, Math.max(1, Math.round(window.devicePixelRatio)) * 4)
  }

  // Draw the checkerboard once per canvas size: one light square per pixel.
  $effect(() => {
    checkerCanvas.width = w
    checkerCanvas.height = h
    const ctx = checkerCanvas.getContext('2d')!
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        ctx.fillStyle = (x + y) % 2 ? '#e9e9ec' : '#f5f5f7'
        ctx.fillRect(x, y, 1, 1)
      }
    }
  })

  function paint(canvas: HTMLCanvasElement, pixels: Uint8ClampedArray | null, floating?: { data: Uint8ClampedArray; x: number; y: number; w: number; h: number } | null) {
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    if (!pixels) return
    const copy = new Uint8ClampedArray(pixels)
    if (floating) stamp(copy, w, h, floating.data, floating.w, floating.h, floating.x, floating.y)
    ctx.putImageData(new ImageData(copy, w, h), 0, 0)
  }

  $effect(() => {
    void editor.rev
    const sel = editor.selection
    paint(frameCanvas, editor.frame.pixels, sel?.floating ? { data: sel.floating, x: sel.x, y: sel.y, w: sel.w, h: sel.h } : null)
    paint(onionCanvas, referenceFor(editor.project, editor.current)?.pixels ?? null)
  })

  // Refit when the canvas size changes (new project, resize).
  let fitted = ''
  $effect(() => {
    const key = `${w}x${h}`
    if (key !== fitted) {
      fitted = key
      fit()
    }
  })

  // --- pointer handling ------------------------------------------------------------------------

  const pointers = new Map<number, { x: number; y: number }>()
  let drawing = false
  let gesture: { d0: number; mx0: number; my0: number; scale0: number; tx0: number; ty0: number } | null = null
  let pan: { x: number; y: number; tx0: number; ty0: number } | null = null
  let blocked = false // a two-finger gesture happened; ignore the rest until all fingers lift

  const local = (e: PointerEvent) => {
    const r = stage.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const cell = (e: PointerEvent) => {
    const p = local(e)
    return { x: Math.floor((p.x - tx) / scale), y: Math.floor((p.y - ty) / scale) }
  }

  function startGesture() {
    const [a, b] = [...pointers.values()]
    gesture = {
      d0: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      mx0: (a.x + b.x) / 2,
      my0: (a.y + b.y) / 2,
      scale0: scale,
      tx0: tx,
      ty0: ty,
    }
  }

  function onPointerDown(e: PointerEvent) {
    onstagedown?.()
    stage.setPointerCapture(e.pointerId)
    pointers.set(e.pointerId, local(e))
    if (pointers.size === 2 && e.pointerType === 'touch') {
      if (drawing) editor.cancelStroke()
      drawing = false
      blocked = true
      startGesture()
      return
    }
    if (blocked || pointers.size > 1) return
    if (e.button === 1 || (e.button === 0 && spaceDown)) {
      const p = local(e)
      pan = { x: p.x, y: p.y, tx0: tx, ty0: ty }
      panning = true
      return
    }
    if (e.button !== 0) return
    drawing = true
    const c = cell(e)
    editor.pointerDown(c.x, c.y)
  }

  function onPointerMove(e: PointerEvent) {
    if (e.pointerType === 'mouse') hover = cell(e)
    if (!pointers.has(e.pointerId)) return
    pointers.set(e.pointerId, local(e))
    if (gesture && pointers.size >= 2) {
      const [a, b] = [...pointers.values()]
      const next = clamp((gesture.scale0 * (Math.hypot(a.x - b.x, a.y - b.y) || 1)) / gesture.d0, MIN_SCALE, MAX_SCALE)
      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2
      // Keep the canvas point that was under the initial midpoint under the current midpoint.
      tx = mx - ((gesture.mx0 - gesture.tx0) * next) / gesture.scale0
      ty = my - ((gesture.my0 - gesture.ty0) * next) / gesture.scale0
      scale = next
    } else if (pan) {
      const p = local(e)
      tx = pan.tx0 + p.x - pan.x
      ty = pan.ty0 + p.y - pan.y
    } else if (drawing) {
      const c = cell(e)
      editor.pointerMove(c.x, c.y)
    }
  }

  function onPointerEnd(e: PointerEvent) {
    if (!pointers.delete(e.pointerId)) return
    if (drawing) {
      if (e.type === 'pointercancel') editor.cancelStroke()
      else editor.pointerUp()
      drawing = false
    }
    if (pointers.size < 2) gesture = null
    if (pointers.size === 0) {
      blocked = false
      pan = null
      panning = false
    }
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    const p = { x: e.clientX - stage.getBoundingClientRect().left, y: e.clientY - stage.getBoundingClientRect().top }
    const speed = e.ctrlKey ? 0.01 : 0.0018
    zoomAt(p.x, p.y, scale * Math.exp(-e.deltaY * speed))
  }

  function isTyping(e: KeyboardEvent) {
    const t = e.target as HTMLElement
    return t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.code === 'Space' && !isTyping(e)) {
      spaceDown = true
      e.preventDefault()
    }
  }

  onMount(() => {
    stage.addEventListener('wheel', onWheel, { passive: false })
    fit()
    const ro = new ResizeObserver(() => {
      // keep the canvas from drifting out of view when the stage shrinks
      const r = stage.getBoundingClientRect()
      tx = clamp(tx, 32 - w * scale, r.width - 32)
      ty = clamp(ty, 32 - h * scale, r.height - 32)
    })
    ro.observe(stage)
    return () => {
      stage.removeEventListener('wheel', onWheel)
      ro.disconnect()
    }
  })
</script>

<svelte:window onkeydown={onKeyDown} onkeyup={(e) => e.code === 'Space' && (spaceDown = false)} />

<div class="stage-wrap">
  <div
    class="stage"
    class:panning
    class:grab={spaceDown}
    bind:this={stage}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerEnd}
    onpointercancel={onPointerEnd}
    onpointerleave={() => (hover = null)}
    oncontextmenu={(e) => e.preventDefault()}
    role="application"
    aria-label="Drawing canvas"
  >
    <div class="world" style="width:{w}px;height:{h}px;transform:translate({tx}px,{ty}px) scale({scale});--z:{scale}">
      <canvas bind:this={checkerCanvas}></canvas>
      <canvas bind:this={onionCanvas} style="opacity:{editor.onionOpacity}"></canvas>
      <canvas bind:this={frameCanvas}></canvas>
    </div>

    <!-- Outlines live outside the scaled layer so they stay a constant 2 screen pixels wide. -->
    {#if hover && hover.x >= 0 && hover.y >= 0 && hover.x < w && hover.y < h}
      <div class="hover" style="left:{tx + hover.x * scale}px;top:{ty + hover.y * scale}px;width:{scale}px;height:{scale}px"></div>
    {/if}
    {#if editor.selection}
      {@const s = editor.selection}
      <div class="sel" style="left:{tx + s.x * scale}px;top:{ty + s.y * scale}px;width:{s.w * scale}px;height:{s.h * scale}px"></div>
    {/if}
  </div>

  <div class="zoom">
    <button onclick={() => zoomBy(1 / 1.5)} aria-label="Zoom out" title="Zoom out">−</button>
    <span class="level">{Math.round(scale * 100)}%</span>
    <button onclick={() => zoomBy(1.5)} aria-label="Zoom in" title="Zoom in">+</button>
    <button onclick={fit} title="Fit canvas to the screen">Fit</button>
    <button onclick={actualPixels} class="wide" title="Zoom to a comfortable pixel size">4×</button>
  </div>
  {#if hover && hover.x >= 0 && hover.y >= 0 && hover.x < w && hover.y < h}
    <div class="coords">{hover.x}, {hover.y}</div>
  {/if}
</div>

<style>
  .stage-wrap {
    position: relative;
    flex: 1;
    min-height: 0;
    min-width: 0;
  }
  .stage {
    position: absolute;
    inset: 0;
    overflow: hidden;
    touch-action: none;
    cursor: crosshair;
    background: var(--stage-bg);
    user-select: none;
    -webkit-user-select: none;
  }
  .stage.grab {
    cursor: grab;
  }
  .stage.panning {
    cursor: grabbing;
  }
  .world {
    position: absolute;
    left: 0;
    top: 0;
    transform-origin: 0 0;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
  }
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
    pointer-events: none;
  }
  .hover {
    position: absolute;
    pointer-events: none;
    /* 4 screen pixels wide: 2px dark outside, 2px light inside */
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.85), inset 0 0 0 2px rgba(255, 255, 255, 0.95);
  }
  .sel {
    position: absolute;
    pointer-events: none;
    outline: 2px dashed #3aa0ff;
    background: rgba(58, 160, 255, 0.08);
  }
  .zoom {
    position: absolute;
    right: 10px;
    bottom: 10px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    background: var(--panel-bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    opacity: 0.95;
  }
  .zoom button {
    min-width: 34px;
    height: 34px;
  }
  .level {
    min-width: 44px;
    text-align: center;
    font-size: 12px;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .coords {
    position: absolute;
    left: 10px;
    bottom: 10px;
    font-size: 12px;
    color: var(--muted);
    background: var(--panel-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 4px 8px;
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }
  @media (max-width: 1199px) {
    .coords,
    .wide {
      display: none;
    }
  }
</style>
