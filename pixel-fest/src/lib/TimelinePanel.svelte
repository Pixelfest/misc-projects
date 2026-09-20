<script lang="ts">
  import { editor } from './editor.svelte'
  import { MAX_DURATION, MIN_DURATION, type Frame } from './model'

  const project = $derived(editor.project)

  // --- thumbnails ---------------------------------------------------------------------------------

  function thumb(canvas: HTMLCanvasElement, frame: Frame) {
    const draw = (f: Frame) => {
      const { width, height } = editor.project
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(f.pixels), width, height), 0, 0)
    }
    draw(frame)
    return { update: draw }
  }



  // --- preview player ------------------------------------------------------------------------------

  let preview: HTMLCanvasElement
  let playing = $state(false)
  let previewScale = $state<2 | 4 | 8>(2)

  $effect(() => {
    if (!playing) return
    let index = 0
    let loops = 0
    let timer: ReturnType<typeof setTimeout>
    const step = () => {
      const p = editor.project
      if (index >= p.frames.length) {
        index = 0
        loops++
        if (p.loop > 0 && loops >= p.loop) {
          playing = false
          return
        }
      }
      const f = p.frames[index]
      preview.width = p.width
      preview.height = p.height
      preview.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(f.pixels), p.width, p.height), 0, 0)
      index++
      timer = setTimeout(step, f.duration)
    }
    step()
    return () => clearTimeout(timer)
  })

  $effect(() => {
    if (playing) return
    void editor.settledRev
    void editor.current
    const p = editor.project
    preview.width = p.width
    preview.height = p.height
    preview.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(editor.frame.pixels), p.width, p.height), 0, 0)
  })

  // --- drag & drop reorder -------------------------------------------------------------------------

  let dragFrom = $state<number | null>(null)
  let dragOver = $state<number | null>(null)

  function refValue(f: Frame): string {
    return f.reference === undefined ? 'auto' : f.reference === null ? 'none' : String(f.reference)
  }

  function onRef(e: Event & { currentTarget: HTMLSelectElement }) {
    const v = e.currentTarget.value
    editor.setReference(editor.current, v === 'auto' ? undefined : v === 'none' ? null : Number(v))
  }
</script>

<section class="panel">
  <h2>Timeline</h2>

  <div class="screen">
    <canvas bind:this={preview} style="width:{project.width * previewScale}px;height:{project.height * previewScale}px"></canvas>
  </div>
  <div class="preview">
    <button class="primary play" onclick={() => (playing = !playing)} aria-label={playing ? 'Stop' : 'Play'} title={playing ? 'Stop' : 'Play'}>{playing ? '■' : '▶'}</button>
    <div class="zoom" role="group" aria-label="Preview size">
      {#each [2, 4, 8] as const as k}
        <button class:on={previewScale === k} onclick={() => (previewScale = k)}>{k}×</button>
      {/each}
    </div>
  </div>

  <div class="actions">
    <button onclick={() => editor.addFrame()} title="Add a blank frame after this one">+ Blank</button>
    <button onclick={() => editor.duplicateFrame()} title="Duplicate this frame">Duplicate</button>
    <button onclick={() => editor.deleteFrame()} disabled={project.frames.length < 2} title="Delete this frame">Delete</button>
  </div>

  <ol class="frames">
    {#each project.frames as f, i (f.id)}
      <li
        class:current={i === editor.current}
        class:over={dragOver === i && dragFrom !== i}
        draggable="true"
        ondragstart={() => (dragFrom = i)}
        ondragover={(e) => {
          e.preventDefault()
          dragOver = i
        }}
        ondragleave={() => (dragOver = null)}
        ondrop={(e) => {
          e.preventDefault()
          if (dragFrom !== null) editor.moveFrame(dragFrom, i)
          dragFrom = dragOver = null
        }}
        ondragend={() => (dragFrom = dragOver = null)}
      >
        <button class="select" onclick={() => editor.selectFrame(i)} aria-label="Edit frame {i + 1}">
          <span class="num">{i + 1}</span>
          {#key editor.settledRev}
            <span class="thumb"><canvas use:thumb={f}></canvas></span>
          {/key}
        </button>
        <label class="ms">
          <input
            type="number"
            min={MIN_DURATION}
            max={MAX_DURATION}
            step="10"
            value={f.duration}
            onchange={(e) => {
              editor.setDuration(i, +e.currentTarget.value)
              e.currentTarget.value = String(editor.project.frames[i].duration)
            }}
            aria-label="Duration of frame {i + 1} in milliseconds"
          />
          <span>ms</span>
        </label>
        <span class="move">
          <button onclick={() => editor.moveFrame(i, i - 1)} disabled={i === 0} aria-label="Move frame up">▲</button>
          <button onclick={() => editor.moveFrame(i, i + 1)} disabled={i === project.frames.length - 1} aria-label="Move frame down">▼</button>
        </span>
      </li>
    {/each}
  </ol>

  <h3>Frame {editor.current + 1}</h3>
  <label class="field">
    <span>Reference frame (drawn beneath)</span>
    <select value={refValue(editor.frame)} onchange={onRef}>
      <option value="auto">Previous frame</option>
      <option value="none">None</option>
      {#each project.frames as f, i (f.id)}
        {#if i !== editor.current}<option value={f.id}>Frame {i + 1}</option>{/if}
      {/each}
    </select>
  </label>
  <label class="field">
    <span>Reference opacity <b>{Math.round(editor.onionOpacity * 100)}%</b></span>
    <input type="range" min="0" max="100" value={editor.onionOpacity * 100} oninput={(e) => (editor.onionOpacity = +e.currentTarget.value / 100)} />
  </label>

  <h3>Animation</h3>
  <div class="two">
    <label class="field">
      <span>Set all frames to</span>
      <span class="inline">
        <input
          type="number"
          min={MIN_DURATION}
          max={MAX_DURATION}
          step="10"
          placeholder="100"
          onchange={(e) => {
            if (e.currentTarget.value) editor.setAllDurations(+e.currentTarget.value)
            e.currentTarget.value = ''
          }}
        />
        <span class="unit">ms</span>
      </span>
    </label>
    <label class="field">
      <span>Loops (0 = forever)</span>
      <input type="number" min="0" max="65535" value={project.loop} onchange={(e) => editor.setLoop(+e.currentTarget.value)} />
    </label>
  </div>
</section>

<style>
  .panel {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font-size: 15px;
  }
  h3 {
    margin: 4px 0 0;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
  }
  .preview {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .screen {
    align-self: flex-start;
    max-width: 100%;
    max-height: 60vh;
    overflow: auto;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: repeating-conic-gradient(#e9e9ec 0 25%, #f8f8fa 0 50%) 0 0 / 12px 12px;
  }
  .screen canvas {
    display: block;
    image-rendering: pixelated;
  }
  .play {
    width: 56px;
    height: 40px;
    font-size: 16px;
  }
  .zoom {
    display: flex;
    gap: 4px;
  }
  .zoom button {
    min-width: 44px;
  }
  .zoom button.on {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .actions {
    display: flex;
    gap: 6px;
  }
  .actions button {
    flex: 1;
    padding: 0 6px;
  }
  .frames {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 40vh;
    overflow: auto;
  }
  .frames li {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px;
    border: 2px solid var(--border);
    border-radius: 10px;
    background: var(--panel-2);
  }
  .frames li.current {
    border-color: var(--accent);
  }
  .frames li.over {
    border-style: dashed;
    border-color: var(--accent);
  }
  .select {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 52px;
    padding: 0 4px;
    background: none;
    border: none;
    justify-content: flex-start;
    min-width: 0;
  }
  .num {
    width: 18px;
    text-align: right;
    font-size: 12px;
    color: var(--muted);
  }
  .thumb {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 6px;
    background: repeating-conic-gradient(#e9e9ec 0 25%, #f8f8fa 0 50%) 0 0 / 10px 10px;
    overflow: hidden;
  }
  .thumb canvas {
    max-width: 100%;
    max-height: 100%;
    image-rendering: pixelated;
  }
  .ms {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--muted);
  }
  .ms input {
    width: 64px;
  }
  .move {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .move button {
    height: 22px;
    min-width: 26px;
    font-size: 9px;
    padding: 0;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    color: var(--muted);
    min-width: 0;
  }
  .field b {
    color: var(--text);
    font-weight: 600;
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .inline {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .inline input {
    min-width: 0;
    width: 100%;
  }
  .unit {
    font-size: 12px;
  }
</style>
