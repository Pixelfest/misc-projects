<script lang="ts">
  import { cloud, type ProjectSummary } from './cloud.svelte'
  import { editor } from './editor.svelte'
  import { saveProjectFile } from './storage'

  let { onclose, onnew }: { onclose: () => void; onnew: () => void } = $props()

  let busy = $state(false)
  let error = $state('')
  let copied = $state(false)

  async function run(fn: () => Promise<unknown>) {
    busy = true
    error = ''
    try {
      await fn()
    } catch (e) {
      error = (e as Error).message
    } finally {
      busy = false
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(cloud.link)
      copied = true
      setTimeout(() => (copied = false), 2000)
    } catch {
      error = 'Could not copy automatically. Select the link and copy it by hand.'
    }
  }

  const downloadCopy = () =>
    run(async () => {
      try {
        await saveProjectFile(await editor.saveText(), editor.project.name, null)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') throw e
      }
    })

  const open = (p: ProjectSummary) =>
    run(async () => {
      await cloud.openProject(p.id)
      onclose()
    })

  const rename = (p: ProjectSummary) => {
    const name = prompt('Rename project', p.name)?.trim()
    if (name && name !== p.name) void run(() => cloud.renameProject(p.id, name.slice(0, 100)))
  }

  const remove = (p: ProjectSummary) => {
    if (confirm(`Delete "${p.name}" from the Library? This cannot be undone.`)) void run(() => cloud.deleteProject(p.id))
  }

  const forget = () => {
    if (confirm('Forget this Library on this device? It stays in the cloud, but you will need the Library link to open it again.')) {
      cloud.forget()
      onclose()
    }
  }

  const erase = () => {
    if (confirm('Erase this Library and every Project in it? This cannot be undone.')) {
      void run(async () => {
        await cloud.eraseLibrary()
        onclose()
      })
    }
  }

  const when = (iso: string) => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
</script>

<div class="backdrop" role="presentation" onpointerdown={(e) => e.target === e.currentTarget && !cloud.justCreated && cloud.status !== 'conflict' && onclose()}>
  <div class="dialog" role="dialog" aria-modal="true">
    {#if !cloud.secret}
      <h2>Save to the cloud</h2>
      <p class="note">
        Create a Library to keep all your projects online and save automatically every 10 seconds. There are no accounts and no email: you get a
        private link, and that link is the only way in.
      </p>
      <p class="note warn">Nobody can recover a lost link. Anyone who has the link can see, change and delete everything in the Library.</p>
      {#if cloud.notice}<p class="err">{cloud.notice}</p>{/if}
      {#if error}<p class="err">{error}</p>{/if}
      <div class="buttons">
        <button onclick={onclose}>Not now</button>
        <button class="primary" disabled={busy} onclick={() => run(() => cloud.createLibrary())}>{busy ? 'Creating…' : 'Create Library'}</button>
      </div>
    {:else if cloud.justCreated}
      <h2>Your Library link</h2>
      <p class="note warn">
        Copy this link and keep it somewhere safe, for example in a bookmark or a password manager. It is the only way back into your Library and it
        cannot be recovered.
      </p>
      <div class="link">
        <input readonly value={cloud.link} onfocus={(e) => e.currentTarget.select()} aria-label="Library link" />
        <button onclick={copy}>{copied ? 'Copied' : 'Copy'}</button>
      </div>
      {#if error}<p class="err">{error}</p>{/if}
      <div class="buttons">
        <button class="primary" onclick={() => (cloud.justCreated = false)}>I have saved the link</button>
      </div>
    {:else if cloud.status === 'conflict'}
      <h2>Changed somewhere else</h2>
      <p class="note">
        "{editor.project.name}" was saved from another tab or device since you opened it. Saving is paused so nothing is lost. Which version do you
        want to keep?
      </p>
      {#if error}<p class="err">{error}</p>{/if}
      <div class="buttons stack">
        <button disabled={busy} onclick={() => run(() => cloud.loadTheirs())}>Load the other version (discards your changes)</button>
        <button disabled={busy} onclick={() => run(() => cloud.keepMine())}>Keep mine (overwrites the other version)</button>
        <button disabled={busy} onclick={downloadCopy}>Download my version as a file</button>
      </div>
    {:else}
      <h2>Library</h2>
      <p class="status {cloud.pill.tone}">
        {cloud.pill.text}{cloud.message && cloud.pill.tone === 'bad' ? `: ${cloud.message}` : ''}
      </p>
      {#if cloud.status === 'offline' || cloud.status === 'error'}
        <p class="note">Your latest changes are only in this tab. Saving retries every 10 seconds, and you can keep a copy on your device meanwhile.</p>
        <div class="buttons"><button onclick={downloadCopy} disabled={busy}>Download a copy</button></div>
      {/if}

      <div class="link">
        <input readonly value={cloud.link} onfocus={(e) => e.currentTarget.select()} aria-label="Library link" />
        <button onclick={copy}>{copied ? 'Copied' : 'Copy link'}</button>
      </div>

      <div class="head">
        <span class="note">{cloud.projects.length} of {cloud.maxProjects} projects</span>
        <button onclick={onnew} disabled={cloud.projects.length >= cloud.maxProjects}>New project…</button>
      </div>

      {#if error}<p class="err">{error}</p>{/if}

      <ul>
        {#each cloud.projects as p (p.id)}
          {@const current = p.id === cloud.projectId}
          <li class:current>
            <div class="thumb">{#if p.thumbnail}<img src={p.thumbnail} alt="" />{/if}</div>
            <div class="info">
              <b>{p.name}{current ? ' (open)' : ''}</b>
              <span class="note">{p.width}×{p.height} · {p.frameCount} frame{p.frameCount === 1 ? '' : 's'} · {when(p.updatedAt)}</span>
              <span class="actions">
                <button disabled={busy || current} onclick={() => open(p)}>Open</button>
                <button disabled={busy} onclick={() => rename(p)}>Rename</button>
                <button disabled={busy || cloud.projects.length >= cloud.maxProjects} onclick={() => run(() => cloud.duplicateProject(p.id))}>Copy</button>
                <button disabled={busy} onclick={() => remove(p)}>Delete</button>
              </span>
            </div>
          </li>
        {:else}
          <li class="note empty">Nothing here yet. Start drawing and this project is added automatically.</li>
        {/each}
      </ul>

      <div class="foot">
        <button onclick={forget}>Forget on this device</button>
        <button class="danger" onclick={erase}>Erase Library…</button>
        <button class="primary" onclick={onclose}>Close</button>
      </div>
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
    width: min(520px, 100%);
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
  h2 {
    margin: 0;
    font-size: 17px;
  }
  .note {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
  }
  .warn {
    color: #e3b341;
  }
  .err {
    color: #ff7b72;
    font-size: 13px;
    margin: 0;
  }
  .status {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
  }
  .status.ok {
    color: #56d364;
  }
  .status.busy {
    color: var(--muted);
  }
  .status.bad {
    color: #ff7b72;
  }
  .link {
    display: flex;
    gap: 6px;
  }
  .link input {
    flex: 1;
    min-width: 0;
    font-size: 12px;
  }
  .buttons,
  .foot,
  .head {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .head {
    justify-content: space-between;
  }
  .buttons.stack {
    flex-direction: column;
    align-items: stretch;
  }
  .foot .danger {
    margin-right: auto;
    color: #ff7b72;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 40vh;
    overflow-y: auto;
  }
  li {
    display: flex;
    gap: 10px;
    padding: 8px;
    border: 1px solid var(--border);
    border-radius: 10px;
  }
  li.current {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  li.empty {
    display: block;
    border-style: dashed;
  }
  .thumb {
    flex: none;
    width: 64px;
    height: 64px;
    display: grid;
    place-items: center;
    border-radius: 6px;
    background: repeating-conic-gradient(#3a3f4b 0% 25%, #2b2f38 0% 50%) 0 0 / 12px 12px;
  }
  .thumb img {
    max-width: 64px;
    max-height: 64px;
    image-rendering: pixelated;
  }
  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .info b {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .actions {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .actions button {
    height: 28px;
    padding: 0 8px;
    font-size: 12px;
  }
</style>
