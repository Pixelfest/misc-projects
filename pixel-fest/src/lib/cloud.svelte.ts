import { editor } from './editor.svelte'
import type { Project } from './model'
import { serializeProject } from './storage'

/** See docs/adr/0002-library-link-is-the-only-credential.md and docs/adr/0003-dotnet-api-and-postgres-for-cloud-storage.md */

const STORE_KEY = 'pixelfest.library'
const SYNC_INTERVAL = 10_000
const THUMB_SIZE = 64
const THUMB_MAX_CHARS = 32_000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface ProjectSummary {
  id: string
  name: string
  width: number
  height: number
  frameCount: number
  thumbnail: string
  revision: number
  createdAt: string
  updatedAt: string
}

export type SyncStatus = 'local' | 'saved' | 'saving' | 'offline' | 'error' | 'conflict'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body: any,
  ) {
    super(message)
  }
}

interface CallOptions {
  body?: unknown
  ifMatch?: number
}

async function call<T>(secret: string | null, method: string, path: string, opt: CallOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (secret) headers.Authorization = `Bearer ${secret}`
  if (opt.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opt.ifMatch !== undefined) headers['If-Match'] = String(opt.ifMatch)
  let res: Response
  try {
    // Relative, so the app also works when it is served below a path by the outer reverse proxy.
    res = await fetch(`api${path}`, { method, headers, body: opt.body === undefined ? undefined : JSON.stringify(opt.body) })
  } catch {
    throw new ApiError(0, 'Cannot reach the server.', null)
  }
  const body = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    const fallback = res.status === 429 ? 'Too many requests. Wait a little and try again.' : `The server answered with an error (${res.status}).`
    throw new ApiError(res.status, body?.error ?? fallback, body)
  }
  return body as T
}

function thumbnail(p: Project): string {
  try {
    const src = document.createElement('canvas')
    src.width = p.width
    src.height = p.height
    src.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(p.frames[0].pixels), p.width, p.height), 0, 0)
    let out = src
    const k = Math.min(1, THUMB_SIZE / Math.max(p.width, p.height))
    if (k < 1) {
      out = document.createElement('canvas')
      out.width = Math.max(1, Math.round(p.width * k))
      out.height = Math.max(1, Math.round(p.height * k))
      const ctx = out.getContext('2d')!
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(src, 0, 0, out.width, out.height)
    }
    const url = out.toDataURL('image/png')
    return url.length <= THUMB_MAX_CHARS ? url : ''
  } catch {
    return ''
  }
}

const readStored = () => {
  try {
    return localStorage.getItem(STORE_KEY)
  } catch {
    return null
  }
}
const writeStored = (secret: string | null) => {
  try {
    if (secret) localStorage.setItem(STORE_KEY, secret)
    else localStorage.removeItem(STORE_KEY)
  } catch {
    /* private mode: the link in the address bar still works */
  }
}

class Cloud {
  /** The secret of the open Library; null while working locally. */
  secret = $state<string | null>(null)
  projects = $state<ProjectSummary[]>([])
  maxProjects = $state(250)
  status = $state<SyncStatus>('local')
  message = $state('')
  /** Cloud Project the editor is bound to; null until the first upload. */
  projectId = $state<string | null>(null)
  /** Set when a Library was just created, so the UI shows the link before anything else. */
  justCreated = $state(false)
  /** Set when a Library has just been opened from the address bar or the remembered link. */
  pendingOpen = $state(false)
  /** A problem opening a Library link, shown once. */
  notice = $state('')

  private syncedVersion = $state(0)
  private revision = 0
  private boundKey = 0
  private busy = false
  private conflictRevision = 0
  /** After a rejected save (too big, Library full) retrying is pointless until the user edits again. */
  private blockedVersion = -2

  get link(): string {
    return this.secret ? `${location.origin}${location.pathname}#/l/${this.secret}` : ''
  }

  /** True when the editor holds changes that exist nowhere else. */
  get unsynced(): boolean {
    return !!this.secret && editor.editVersion !== this.syncedVersion
  }

  /** True when leaving the page would lose work. */
  get atRisk(): boolean {
    return this.secret ? this.unsynced : editor.dirty
  }

  get pill(): { text: string; tone: 'ok' | 'busy' | 'bad' } {
    if (this.status === 'conflict') return { text: 'Conflict', tone: 'bad' }
    if (this.status === 'offline') return { text: 'Not saved · offline', tone: 'bad' }
    if (this.status === 'error') return { text: 'Not saved', tone: 'bad' }
    if (this.status === 'saving') return { text: 'Saving…', tone: 'busy' }
    if (this.unsynced) return { text: 'Unsaved', tone: 'busy' }
    return { text: 'Saved', tone: 'ok' }
  }

  init() {
    void this.connectFromLocation()
    setInterval(() => void this.tick(), SYNC_INTERVAL)
    // Hiding the tab is the last moment we reliably get to run async work.
    document.addEventListener('visibilitychange', () => document.hidden && void this.tick())
    addEventListener('hashchange', () => void this.connectFromLocation())
  }

  private secretFromHash(): string | null {
    const m = location.hash.match(/^#\/l\/([0-9a-f-]{36})$/i)
    return m && UUID.test(m[1]) ? m[1].toLowerCase() : null
  }

  private async connectFromLocation() {
    const fromHash = this.secretFromHash()
    const secret = fromHash ?? readStored()
    if (!secret || secret === this.secret || !UUID.test(secret)) return
    if (await this.connect(secret)) this.pendingOpen = true
    else if (fromHash) history.replaceState(null, '', location.pathname + location.search)
  }

  /** Opens a Library. Returns false, with `notice` set, when it cannot be opened. */
  async connect(secret: string): Promise<boolean> {
    try {
      const list = await call<{ maxProjects: number; projects: ProjectSummary[] }>(secret, 'GET', '/library')
      this.projects = list.projects
      this.maxProjects = list.maxProjects
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        if (readStored() === secret) writeStored(null)
        this.notice = 'That Library link was not found. It may have been erased or expired.'
      } else this.notice = (e as Error).message
      return false
    }
    this.secret = secret
    writeStored(secret)
    history.replaceState(null, '', `${location.pathname}${location.search}#/l/${secret}`)
    this.status = 'saved'
    this.message = ''
    this.projectId = null
    this.revision = 0
    this.boundKey = editor.projectKey
    this.blockedVersion = -2
    this.syncedVersion = 0
    return true
  }

  async createLibrary() {
    const { secret } = await call<{ secret: string }>(null, 'POST', '/libraries', {})
    if (!(await this.connect(secret))) throw new Error(this.notice || 'The new Library could not be opened.')
    this.justCreated = true
    // Whatever is open now becomes the Library's first Project, even if it is still untouched.
    this.syncedVersion = -1
    await this.tick()
  }

  /** Stops using the Library on this device. The Library itself stays in the cloud. */
  forget() {
    writeStored(null)
    history.replaceState(null, '', location.pathname + location.search)
    this.secret = null
    this.projects = []
    this.projectId = null
    this.status = 'local'
    this.justCreated = false
    // The open project is now only in this tab.
    editor.dirty = true
  }

  async eraseLibrary() {
    await call(this.secret, 'DELETE', '/library')
    this.forget()
  }

  // --- syncing ------------------------------------------------------------------

  private async idle() {
    while (this.busy) await new Promise((r) => setTimeout(r, 100))
  }

  /** Uploads pending changes now and waits for the result. */
  async flush() {
    await this.idle()
    await this.tick()
    await this.idle()
  }

  async tick() {
    if (!this.secret || this.busy || this.status === 'conflict') return
    if (editor.projectKey !== this.boundKey) {
      // A different project was opened or created; it is a new Project in the Library.
      this.projectId = null
      this.revision = 0
      this.boundKey = editor.projectKey
    }
    if (editor.editVersion === this.syncedVersion || editor.editVersion === this.blockedVersion) return

    this.busy = true
    this.status = 'saving'
    const key = editor.projectKey
    const secret = this.secret
    try {
      editor.commitSelection()
      const version = editor.editVersion
      const project = editor.project
      const body = {
        name: project.name || 'Untitled',
        width: project.width,
        height: project.height,
        frameCount: project.frames.length,
        thumbnail: thumbnail(project),
        data: await serializeProject(project),
      }
      let saved: { id?: string; revision: number; updatedAt: string }
      const creating = this.projectId === null
      if (creating) saved = await call(secret, 'POST', '/projects', { body })
      else saved = await call(secret, 'PUT', `/projects/${this.projectId}`, { body, ifMatch: this.revision })
      const id = creating ? saved.id! : this.projectId!
      this.upsert({ id, ...body, revision: saved.revision, createdAt: '', updatedAt: saved.updatedAt })
      if (secret === this.secret && key === editor.projectKey) {
        this.projectId = id
        this.revision = saved.revision
        this.syncedVersion = version
        this.status = 'saved'
        this.message = ''
      }
    } catch (e) {
      this.fail(e)
    } finally {
      this.busy = false
    }
  }

  private fail(e: unknown) {
    const err = e as ApiError
    this.message = err.message
    if (err.status === 0) this.status = 'offline'
    else if (err.status === 409 && this.projectId) {
      this.conflictRevision = err.body?.revision ?? this.revision
      this.status = 'conflict'
    } else if (err.status === 404 && this.projectId) {
      // The Project was deleted elsewhere; the next save recreates it.
      this.projectId = null
      this.status = 'saved'
      this.syncedVersion = -1
    } else {
      this.status = 'error'
      if (err.status >= 400 && err.status < 500 && err.status !== 429) this.blockedVersion = editor.editVersion
    }
  }

  private upsert(s: ProjectSummary) {
    const old = this.projects.find((p) => p.id === s.id)
    const next = { ...s, createdAt: old?.createdAt || s.updatedAt }
    this.projects = [next, ...this.projects.filter((p) => p.id !== s.id)]
  }

  /** Conflict: overwrite the other change with what is in this tab. */
  async keepMine() {
    this.revision = this.conflictRevision
    this.status = 'saved'
    this.syncedVersion = -1
    await this.tick()
  }

  /** Conflict: drop this tab's changes and load the other version. */
  async loadTheirs() {
    const id = this.projectId
    this.status = 'saved'
    if (id) await this.openProject(id, false)
  }

  // --- Library actions ------------------------------------------------------------------

  async refresh() {
    if (!this.secret) return
    const list = await call<{ maxProjects: number; projects: ProjectSummary[] }>(this.secret, 'GET', '/library')
    this.projects = list.projects
    this.maxProjects = list.maxProjects
  }

  async openProject(id: string, saveFirst = true) {
    if (saveFirst) await this.flush()
    const p = await call<{ id: string; revision: number; data: string }>(this.secret, 'GET', `/projects/${id}`)
    await editor.openText(p.data)
    this.projectId = id
    this.revision = p.revision
    this.boundKey = editor.projectKey
    this.syncedVersion = editor.editVersion
    this.blockedVersion = -2
    this.status = 'saved'
    this.message = ''
    void this.refresh().catch(() => {})
  }

  async deleteProject(id: string) {
    await call(this.secret, 'DELETE', `/projects/${id}`)
    this.projects = this.projects.filter((p) => p.id !== id)
    if (id === this.projectId) {
      // The open project is gone from the Library; start over with a blank one that only syncs once it is edited.
      editor.newProject('Untitled', 32, 32)
      this.projectId = null
      this.revision = 0
      this.boundKey = editor.projectKey
      this.syncedVersion = editor.editVersion
      this.status = 'saved'
    }
  }

  async renameProject(id: string, name: string) {
    if (id === this.projectId) return editor.setName(name)
    const meta = this.projects.find((p) => p.id === id)
    if (!meta) return
    const p = await call<{ revision: number; data: string }>(this.secret, 'GET', `/projects/${id}`)
    const file = JSON.parse(p.data)
    file.name = name
    const saved = await call<{ revision: number; updatedAt: string }>(this.secret, 'PUT', `/projects/${id}`, {
      ifMatch: p.revision,
      body: { name, width: meta.width, height: meta.height, frameCount: meta.frameCount, thumbnail: meta.thumbnail, data: JSON.stringify(file) },
    })
    this.upsert({ ...meta, name, revision: saved.revision, updatedAt: saved.updatedAt })
  }

  async duplicateProject(id: string) {
    const meta = this.projects.find((p) => p.id === id)
    if (!meta) return
    const p = await call<{ data: string }>(this.secret, 'GET', `/projects/${id}`)
    const name = `${meta.name} copy`.slice(0, 100)
    const file = JSON.parse(p.data)
    file.name = name
    await call(this.secret, 'POST', '/projects', {
      body: { name, width: meta.width, height: meta.height, frameCount: meta.frameCount, thumbnail: meta.thumbnail, data: JSON.stringify(file) },
    })
    await this.refresh()
  }
}

export const cloud = new Cloud()
