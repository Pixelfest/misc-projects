<script lang="ts">
  import { untrack } from 'svelte'
  import { cloud } from './cloud.svelte'
  import { editor } from './editor.svelte'
  import { MAX_SIZE } from './model'
  import { downloadBlob } from './storage'
  import { exportWebp } from './webp'

  let { kind, onclose }: { kind: 'new' | 'resize' | 'export'; onclose: () => void } = $props()

  // new / resize
  let name = $state('Untitled')
  let width = $state(editor.project.width)
  let height = $state(editor.project.height)
  let ax = $state<0 | 1 | 2>(1)
  let ay = $state<0 | 1 | 2>(1)

  const validSize = $derived(
    Number.isInteger(width) && Number.isInteger(height) && width >= 1 && height >= 1 && width <= MAX_SIZE && height <= MAX_SIZE,
  )

  if (untrack(() => kind) === 'new') {
    width = 32
    height = 32
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    if (!validSize) return
    if (kind === 'new') {
      await cloud.flush()
      editor.newProject(name, width, height)
      onclose()
      // A new project is saved to the Library straight away rather than at the next 10 second tick.
      void cloud.tick()
      return
    }
    editor.resize(width, height, ax, ay)
    onclose()
  }

  // export
  let scale = $state(4)
  let encoded = $state<Uint8Array | null>(null)
  let status = $state<'idle' | 'working' | 'error'>('idle')
  let message = $state('')
  let run = 0

  $effect(() => {
    if (kind !== 'export') return
    const s = scale
    const ticket = ++run
    encoded = null
    if (!Number.isInteger(s) || s < 1 || s * MAX_SIZE > 16000) {
      status = 'idle'
      return
    }
    status = 'working'
    const timer = setTimeout(async () => {
      try {
        editor.commitSelection()
        const bytes = await exportWebp(editor.project, s)
        if (ticket !== run) return
        encoded = bytes
        status = 'idle'
      } catch (err) {
        if (ticket !== run) return
        status = 'error'
        message = err instanceof Error ? err.message : String(err)
      }
    }, 250)
    return () => clearTimeout(timer)
  })

  const outW = $derived(editor.project.width * scale)
  const outH = $derived(editor.project.height * scale)
  const kb = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`)

  function save() {
    if (!encoded) return
    downloadBlob(new Blob([encoded as Uint8Array<ArrayBuffer>], { type: 'image/webp' }), `${editor.project.name || 'animation'}.webp`)
  }
</script>

<div class="backdrop" role="presentation" onpointerdown={(e) => e.target === e.currentTarget && onclose()}>
  <div class="dialog" role="dialog" aria-modal="true">
    {#if kind === 'export'}
      <h2>Export animated WebP</h2>
      <p class="note">Lossless, with transparency. Pixels are enlarged without smoothing.</p>
      <label class="field">
        <span>Scale</span>
        <span class="scale">
          {#each [1, 2, 4, 8, 16] as s}
            <button class:on={scale === s} onclick={() => (scale = s)}>{s}×</button>
          {/each}
          <input type="number" min="1" step="1" bind:value={scale} aria-label="Custom scale" />
        </span>
      </label>
      <p class="size">
        {outW} × {outH} px, {editor.project.frames.length} frame{editor.project.frames.length === 1 ? '' : 's'},
        {editor.project.loop === 0 ? 'loops forever' : `${editor.project.loop} loop${editor.project.loop === 1 ? '' : 's'}`}
      </p>
      <p class="size">
        {#if status === 'working'}Encoding…
        {:else if status === 'error'}<span class="err">{message}</span>
        {:else if encoded}File size: <b>{kb(encoded.length)}</b>
        {:else}Choose a whole-number scale (up to {Math.floor(16000 / MAX_SIZE)}×).{/if}
      </p>
      <div class="buttons">
        <button onclick={onclose}>Close</button>
        <button class="primary" disabled={!encoded} onclick={save}>Download .webp</button>
      </div>
    {:else}
      <form onsubmit={submit}>
        <h2>{kind === 'new' ? 'New project' : 'Resize canvas'}</h2>
        {#if kind === 'new'}
          <label class="field"><span>Name</span><input type="text" bind:value={name} /></label>
        {:else}
          <p class="note">Every frame is cropped or padded with transparent pixels. Choose where the existing drawing stays.</p>
        {/if}
        <div class="dims">
          <label class="field"><span>Width</span><input type="number" min="1" max={MAX_SIZE} bind:value={width} /></label>
          <label class="field"><span>Height</span><input type="number" min="1" max={MAX_SIZE} bind:value={height} /></label>
        </div>
        {#if kind === 'resize'}
          <div class="anchor" role="radiogroup" aria-label="Anchor">
            {#each [0, 1, 2] as y}
              {#each [0, 1, 2] as x}
                <button
                  type="button"
                  role="radio"
                  aria-checked={ax === x && ay === y}
                  class:on={ax === x && ay === y}
                  onclick={() => ((ax = x as 0 | 1 | 2), (ay = y as 0 | 1 | 2))}
                  aria-label="Anchor {y === 0 ? 'top' : y === 1 ? 'middle' : 'bottom'} {x === 0 ? 'left' : x === 1 ? 'center' : 'right'}"
                ></button>
              {/each}
            {/each}
          </div>
        {/if}
        {#if !validSize}<p class="err">Size must be whole numbers from 1 to {MAX_SIZE}.</p>{/if}
        {#if kind === 'new' && !cloud.secret && editor.dirty}<p class="note">Your current project will be replaced. Save it first if you want to keep it.</p>{/if}
        <div class="buttons">
          <button type="button" onclick={onclose}>Cancel</button>
          <button class="primary" type="submit" disabled={!validSize}>{kind === 'new' ? 'Create' : 'Resize'}</button>
        </div>
      </form>
    {/if}
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: grid;
    place-items: center;
    padding: 16px;
    background: rgba(0, 0, 0, 0.55);
  }
  .dialog {
    width: min(420px, 100%);
    max-height: 100%;
    overflow: auto;
    padding: 18px;
    border-radius: 14px;
    background: var(--panel-bg);
    border: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font-size: 17px;
  }
  .note,
  .size {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
  }
  .size b {
    color: var(--text);
  }
  .err {
    color: #ff7b72;
    font-size: 13px;
    margin: 0;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    color: var(--muted);
  }
  .dims {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .scale {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .scale input {
    width: 72px;
  }
  .scale button.on {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .anchor {
    display: grid;
    grid-template-columns: repeat(3, 36px);
    gap: 4px;
    justify-content: center;
  }
  .anchor button {
    height: 36px;
    min-width: 0;
    padding: 0;
  }
  .anchor button.on {
    background: var(--accent);
    border-color: var(--accent);
  }
  .buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
