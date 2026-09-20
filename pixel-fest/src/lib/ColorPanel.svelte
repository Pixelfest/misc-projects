<script lang="ts">
  import { editor } from './editor.svelte'
  import { parseHex, toHex, type RGBA } from './model'
  import { sameColor } from './palette'

  const css = (c: RGBA) => `rgba(${c.r},${c.g},${c.b},${c.a / 255})`
  const color = $derived(editor.color)
  const hex = $derived(toHex(color))

  function onHex(e: Event & { currentTarget: HTMLInputElement }) {
    const parsed = parseHex(e.currentTarget.value)
    if (parsed) editor.setColor(parsed)
    else e.currentTarget.value = hex
  }

  function onPicker(e: Event & { currentTarget: HTMLInputElement }) {
    const c = parseHex(e.currentTarget.value)
    if (c) editor.setColor({ ...c, a: color.a })
  }
</script>

<section class="panel">
  <h2>Color</h2>

  <div class="current">
    <div class="swatch big checker"><span style="background:{css(color)}"></span></div>
    <div class="fields">
      <label class="row">
        <span>Pick</span>
        <input type="color" value={toHex(color, false)} oninput={onPicker} />
      </label>
      <label class="row">
        <span>Hex</span>
        <input type="text" class="hex" value={hex} onchange={onHex} spellcheck="false" autocomplete="off" maxlength="9" />
      </label>
    </div>
  </div>

  <label class="alpha">
    <span>Opacity <b>{Math.round((color.a / 255) * 100)}%</b></span>
    <input type="range" min="0" max="255" value={color.a} oninput={(e) => editor.setColor({ ...color, a: +e.currentTarget.value })} />
  </label>

  <h3>Most used</h3>
  <div class="palette" role="list">
    {#each editor.palette as c, i (i)}
      <button
        class="swatch checker"
        class:active={sameColor(c, color)}
        onclick={() => editor.setColor(c)}
        title={toHex(c, true)}
        aria-label="Use {toHex(c, true)}"
      ><span style="background:{css(c)}"></span></button>
    {:else}
      <p class="hint">Colors you draw with appear here.</p>
    {/each}
  </div>

  <h3>Transparent</h3>
  <button class="clear" class:active={color.a === 0} onclick={() => editor.setColor({ ...color, a: 0 })}>
    <span class="swatch checker small"><span></span></span> Draw transparent (erase)
  </button>
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
  .current {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .fields {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 13px;
    color: var(--muted);
  }
  .hex {
    width: 96px;
    font-family: ui-monospace, monospace;
  }
  input[type='color'] {
    width: 48px;
    height: 30px;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: none;
  }
  .alpha {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    color: var(--muted);
  }
  .alpha b {
    color: var(--text);
    font-weight: 600;
  }
  .palette {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .swatch {
    position: relative;
    display: block;
    aspect-ratio: 1;
    width: 100%;
    padding: 0;
    border-radius: 8px;
    border: 2px solid var(--border);
    overflow: hidden;
  }
  .swatch > span {
    position: absolute;
    inset: 0;
  }
  .swatch.active,
  .clear.active {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-soft);
  }
  .swatch.big {
    width: 76px;
    flex: none;
  }
  .swatch.small {
    width: 22px;
    flex: none;
    border-radius: 5px;
    border-width: 1px;
  }
  .checker {
    background: repeating-conic-gradient(#e9e9ec 0 25%, #f8f8fa 0 50%) 0 0 / 12px 12px;
  }
  .clear {
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: flex-start;
    height: 40px;
    padding: 0 10px;
  }
  .hint {
    grid-column: 1 / -1;
    margin: 0;
    font-size: 13px;
    color: var(--muted);
  }
</style>
