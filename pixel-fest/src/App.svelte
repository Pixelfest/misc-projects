<script lang="ts">
  import { onMount } from 'svelte'
  import { cloud } from './lib/cloud.svelte'
  import CloudDialog from './lib/CloudDialog.svelte'
  import ColorPanel from './lib/ColorPanel.svelte'
  import Dialogs from './lib/Dialogs.svelte'
  import { editor, type Tool } from './lib/editor.svelte'
  import Stage from './lib/Stage.svelte'
  import { pickTextFile, saveProjectFile } from './lib/storage'
  import TimelinePanel from './lib/TimelinePanel.svelte'

  const tools: { id: Tool; label: string; key: string; hint: string }[] = [
    { id: 'pencil', label: 'Pencil', key: 'p', hint: 'Draw pixels (P)' },
    { id: 'line', label: 'Line', key: 'l', hint: 'Draw a straight line (L)' },
    { id: 'fill', label: 'Fill', key: 'f', hint: 'Fill an area of one color (F)' },
    { id: 'picker', label: 'Pick', key: 'i', hint: 'Pick a color from the image (I)' },
    { id: 'select', label: 'Select', key: 's', hint: 'Select, move, copy and paste a rectangle (S)' },
    { id: 'shift', label: 'Shift', key: 'm', hint: 'Move the whole frame (M)' },
  ]

  let leftOpen = $state(false)
  let rightOpen = $state(false)
  let menuOpen = $state(false)
  let dialog = $state<'new' | 'resize' | 'export' | 'cloud' | null>(null)
  let fileHandle: Parameters<typeof saveProjectFile>[2] = null
  let toast = $state('')
  let toastTimer: ReturnType<typeof setTimeout>

  function say(text: string) {
    toast = text
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (toast = ''), 3500)
  }

  async function save() {
    menuOpen = false
    try {
      fileHandle = await saveProjectFile(await editor.saveText(), editor.project.name, fileHandle)
      editor.dirty = false
      say('Saved')
    } catch (e) {
      if ((e as Error).name !== 'AbortError') say(`Could not save: ${(e as Error).message}`)
    }
  }

  async function open() {
    menuOpen = false
    if (!cloud.secret && editor.dirty && !confirm('Opening a file replaces your current project. Continue?')) return
    const file = await pickTextFile()
    if (!file) return
    try {
      await cloud.flush()
      await editor.openText(file.text)
      fileHandle = null
      void cloud.tick()
      say(`Opened ${file.name}`)
    } catch (e) {
      say((e as Error).message)
    }
  }

  function closePanels() {
    leftOpen = rightOpen = menuOpen = false
  }

  function onKeyDown(e: KeyboardEvent) {
    const t = e.target as HTMLElement
    if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) return
    if (dialog) return
    const mod = e.ctrlKey || e.metaKey
    const k = e.key.toLowerCase()
    if (mod && k === 'z') return (e.preventDefault(), e.shiftKey ? editor.redo() : editor.undo())
    if (mod && k === 'y') return (e.preventDefault(), editor.redo())
    if (mod && k === 's') return (e.preventDefault(), void save())
    if (mod && k === 'c') return (e.preventDefault(), editor.copySelection())
    if (mod && k === 'x') return (e.preventDefault(), editor.cutSelection())
    if (mod && k === 'v') return (e.preventDefault(), editor.pasteSelection())
    if (mod || e.altKey) return
    if (e.key === 'Delete' || e.key === 'Backspace') return (e.preventDefault(), editor.deleteSelection())
    if (e.key === 'Enter' || e.key === 'Escape') return editor.deselect()
    const tool = tools.find((x) => x.key === k)
    if (tool) editor.setTool(tool.id)
  }

  // A Library link opened from the address bar, or a conflict, needs the Library dialog straight away.
  $effect(() => {
    if (cloud.pendingOpen || cloud.status === 'conflict') {
      cloud.pendingOpen = false
      dialog = 'cloud'
    }
  })

  onMount(() => {
    cloud.init()
    const warn = (e: BeforeUnloadEvent) => cloud.atRisk && (e.preventDefault(), (e.returnValue = ''))
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  })
</script>

<svelte:window onkeydown={onKeyDown} />

<div class="app">
  <header>
    <button class="toggle" class:on={leftOpen} onclick={() => ((leftOpen = !leftOpen), (rightOpen = false), (menuOpen = false))} aria-label="Colors">
      <span class="swatch" style="background:rgba({editor.color.r},{editor.color.g},{editor.color.b},{editor.color.a / 255})"></span>
      <span class="lbl colors">Colors</span>
    </button>

    <input class="title" value={editor.project.name} onchange={(e) => editor.setName(e.currentTarget.value)} aria-label="Project name" />

    {#if cloud.secret}
      <button class="sync {cloud.pill.tone}" onclick={() => (dialog = 'cloud')} aria-label="Library: {cloud.pill.text}" title="Open your Library">
        <span class="dot"></span><span class="txt">{cloud.pill.text}</span>
      </button>
    {/if}

    <div class="hist">
      <button onclick={() => editor.undo()} disabled={!editor.canUndo} aria-label="Undo" title="Undo (Ctrl+Z)">↶</button>
      <button onclick={() => editor.redo()} disabled={!editor.canRedo} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">↷</button>
    </div>

    <div class="menu">
      <button onclick={() => (menuOpen = !menuOpen)} aria-label="File menu" aria-expanded={menuOpen}>⋯</button>
      {#if menuOpen}
        <div class="drop">
          <button onclick={() => ((dialog = 'new'), (menuOpen = false))}>New…</button>
          <button onclick={open}>Open…</button>
          <button onclick={() => ((dialog = 'cloud'), (menuOpen = false))}>{cloud.secret ? 'My Library…' : 'Save to cloud…'}</button>
          <button onclick={save}>Save to file{editor.dirty ? ' •' : ''}</button>
          <button onclick={() => ((dialog = 'resize'), (menuOpen = false))}>Resize canvas…</button>
          <button onclick={() => ((dialog = 'export'), (menuOpen = false))}>Export WebP…</button>
        </div>
      {/if}
    </div>

    <button class="toggle" class:on={rightOpen} onclick={() => ((rightOpen = !rightOpen), (leftOpen = false), (menuOpen = false))} aria-label="Timeline">
      <span class="lbl">Frames</span>
      <span class="count">{editor.current + 1}/{editor.project.frames.length}</span>
    </button>
  </header>

  <div class="body">
    <aside class="left" class:open={leftOpen}><ColorPanel /></aside>

    <main>
      <Stage onstagedown={closePanels} />
      <nav class="tools" aria-label="Tools">
        {#each tools as t (t.id)}
          <button class:on={editor.tool === t.id} onclick={() => editor.setTool(t.id)} title={t.hint}>{t.label}</button>
        {/each}
      </nav>
    </main>

    <aside class="right" class:open={rightOpen}><TimelinePanel /></aside>
  </div>

  {#if toast}<div class="toast" role="status">{toast}</div>{/if}
  {#if dialog === 'cloud'}
    <CloudDialog onclose={() => (dialog = null)} onnew={() => (dialog = 'new')} />
  {:else if dialog}
    <Dialogs kind={dialog} onclose={() => (dialog = null)} />
  {/if}
</div>

<style>
  .app {
    height: 100dvh;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  header {
    flex: none;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 52px;
    padding: 0 10px;
    background: var(--panel-bg);
    border-bottom: 1px solid var(--border);
    z-index: 30;
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 12px;
  }
  .toggle.on {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .swatch {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.4);
  }
  .count {
    font-size: 12px;
    color: var(--muted);
  }
  .title {
    flex: 1;
    min-width: 0;
    text-align: center;
    background: transparent;
    border-color: transparent;
    font-weight: 600;
  }
  .title:hover,
  .title:focus {
    border-color: var(--border);
  }
  .sync {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 10px;
    font-size: 12px;
    white-space: nowrap;
  }
  .sync .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--muted);
  }
  .sync.ok .dot {
    background: #56d364;
  }
  .sync.bad .dot {
    background: #ff7b72;
  }
  .sync.bad {
    border-color: #ff7b72;
  }
  @media (max-width: 700px) {
    .sync .txt {
      display: none;
    }
    .sync {
      padding: 0 12px;
    }
  }
  .hist {
    display: flex;
    gap: 4px;
  }
  .hist button,
  .menu > button {
    width: 36px;
    height: 36px;
    padding: 0;
    font-size: 18px;
  }
  .menu {
    position: relative;
  }
  .drop {
    position: absolute;
    right: 0;
    top: 42px;
    min-width: 180px;
    display: flex;
    flex-direction: column;
    padding: 6px;
    gap: 2px;
    background: var(--panel-bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
  }
  .drop button {
    justify-content: flex-start;
    text-align: left;
    border-color: transparent;
    background: transparent;
  }
  .drop button:hover {
    background: var(--panel-2);
  }
  .body {
    flex: 1;
    min-height: 0;
    display: flex;
    position: relative;
  }
  main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .tools {
    flex: none;
    display: flex;
    gap: 6px;
    padding: 8px;
    overflow-x: auto;
    justify-content: center;
    background: var(--panel-bg);
    border-top: 1px solid var(--border);
  }
  .tools button {
    flex: 0 0 auto;
    min-width: 56px;
    height: 40px;
    padding: 0 12px;
  }
  .tools button.on {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }
  aside {
    background: var(--panel-bg);
    overflow-y: auto;
    z-index: 20;
  }
  .toast {
    position: fixed;
    left: 50%;
    bottom: 76px;
    transform: translateX(-50%);
    padding: 8px 14px;
    border-radius: 10px;
    background: var(--panel-2);
    border: 1px solid var(--border);
    font-size: 13px;
    z-index: 60;
  }

  /* Desktop: both panels are docked. */
  @media (min-width: 1200px) {
    aside {
      flex: none;
    }
    .left {
      width: 250px;
      border-right: 1px solid var(--border);
    }
    .right {
      width: 310px;
      border-left: 1px solid var(--border);
    }
    .toggle {
      display: none;
    }
    .title {
      text-align: left;
    }
  }

  /* Mobile: panels slide over the canvas. */
  @media (max-width: 1199px) {
    aside {
      position: absolute;
      top: 0;
      bottom: 0;
      width: min(310px, 86vw);
      transition: transform 0.2s ease;
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
    }
    .left {
      left: 0;
      transform: translateX(-105%);
      border-right: 1px solid var(--border);
    }
    .right {
      right: 0;
      transform: translateX(105%);
      border-left: 1px solid var(--border);
    }
    aside.open {
      transform: none;
    }
    .tools {
      gap: 4px;
      padding: 6px;
    }
    .tools button {
      flex: 1 1 0;
      min-width: 0;
      padding: 0 4px;
    }
    .toggle {
      padding: 0 9px;
    }
    .toggle .lbl.colors {
      display: none;
    }
    .title {
      min-width: 60px;
    }
  }
</style>
