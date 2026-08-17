/**
 * Local subprocess backend of the web-terminal seam: interactive PTYs over the
 * subprocess terminal primitive, one per (session, terminalId), with the shell
 * selected by host platform and an optional explicit shell name. Output
 * streams raw — ANSI escapes intact — into a bounded scrollback the web
 * Terminal view reads by cursor; the backend only retains a scrollback tail.
 * Nothing renders on the host display; the backend serves the API gateway only.
 * @module @deepseek-ai/dsh-host-web-terminal-local
 */

import { Buffer } from 'node:buffer'
import { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type {
  SubprocessTerminalHandle,
  SubprocessTerminalSignal,
  SubprocessTerminalSpawnSpec,
} from '@deepseek-ai/dsh-subprocess'
import {
  WebTerminalService,
  type WebTerminalRead,
  type WebTerminalSession,
  type WebTerminalSignal,
} from '@deepseek-ai/dsh-host-web-terminal'
import { availableShells, shellArgv } from './resolve.ts'

/** Validated plugin configuration. */
export interface Config {
  /** Non-Windows shell executable. */
  shellPath: string
  /** Explicit Windows PowerShell executable (resolved when absent). */
  pwshPath?: string
  /** Terminal columns. */
  cols: number
  /** Terminal rows. */
  rows: number
  /** Retained scrollback byte bound. */
  scrollbackMaxBytes: number
  /** TERM-to-KILL cleanup grace for the complete terminal session. */
  disposeGraceMs: number
}

const DEFAULT_ROWS = 40
const DEFAULT_COLS = 120
const DEFAULT_SCROLLBACK_MAX_BYTES = 1024 * 1024
const DEFAULT_DISPOSE_GRACE_MS = 3000

/** Drop leading characters until the string fits `maxBytes` UTF-8 bytes. */
function trimFront(text: string, maxBytes: number): string {
  if (Buffer.byteLength(text) <= maxBytes) return text
  const chars = Array.from(text)
  let bytes = Buffer.byteLength(text)
  let start = 0
  while (start < chars.length && bytes > maxBytes) {
    bytes -= Buffer.byteLength(chars[start] as string)
    start += 1
  }
  return chars.slice(start).join('')
}

/** One live PTY wrapping a provider-owned terminal process. */
class LocalWebTerminalSession implements WebTerminalSession {
  readonly pid: number
  readonly cols: number
  readonly rows: number
  private scrollback = ''
  private totalChars = 0
  private evictedChars = 0
  private exited = false
  private closePromise: Promise<void> | undefined

  constructor(
    readonly id: SessionId,
    readonly terminalId: string,
    private readonly terminal: SubprocessTerminalHandle,
    cols: number,
    rows: number,
    private readonly scrollbackMaxBytes: number,
    private readonly onClosed: (session: LocalWebTerminalSession) => void,
  ) {
    this.pid = terminal.pid
    this.cols = cols
    this.rows = rows
    terminal.output.on('data', this.onData)
    void terminal.done.then(
      () => { this.exited = true },
      () => { this.exited = true },
    )
  }

  read(cursor: number): WebTerminalRead {
    if (cursor < 0 || !Number.isSafeInteger(cursor)) {
      throw new Error('web-terminal: read cursor must be a non-negative safe integer')
    }
    if (cursor >= this.totalChars) {
      return { output: '', cursor: this.totalChars, truncated: false, exited: this.exited }
    }
    const relative = cursor - this.evictedChars
    if (relative < 0) {
      return { output: this.scrollback, cursor: this.totalChars, truncated: true, exited: this.exited }
    }
    return { output: this.scrollback.slice(relative), cursor: this.totalChars, truncated: false, exited: this.exited }
  }

  write(data: string): Promise<void> {
    return this.terminal.write(data)
  }

  async signal(signal: WebTerminalSignal): Promise<void> {
    await this.terminal.signalForeground(signal as SubprocessTerminalSignal)
  }

  close(): Promise<void> {
    if (this.closePromise !== undefined) return this.closePromise
    const closing = this.terminal.terminate().then(() => {
      this.onClosed(this)
    }, (error: unknown) => {
      this.closePromise = undefined
      throw error
    })
    this.closePromise = closing
    return closing
  }

  private readonly onData = (chunk: Buffer | Uint8Array | string): void => {
    const text = typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8')
    if (text.length === 0) return
    this.totalChars += text.length
    this.scrollback = trimFront(this.scrollback + text, this.scrollbackMaxBytes)
    this.evictedChars = this.totalChars - this.scrollback.length
  }
}

/** Map key for one (session, terminalId) pair. */
function keyOf(sessionId: SessionId, terminalId: string): string {
  return `${sessionId}\u0000${terminalId}`
}

/** The `ctx.webTerminals` implementation over the subprocess terminal primitive. */
export default class LocalWebTerminalService extends WebTerminalService {
  static inject = ['subprocess']

  static Config: z<Config> = z.object({
    shellPath: z.string().default('/bin/bash'),
    pwshPath: z.string(),
    cols: z.natural().default(DEFAULT_COLS),
    rows: z.natural().default(DEFAULT_ROWS),
    scrollbackMaxBytes: z.natural().default(DEFAULT_SCROLLBACK_MAX_BYTES),
    disposeGraceMs: z.natural().default(DEFAULT_DISPOSE_GRACE_MS),
  })

  private readonly sessions = new Map<string, LocalWebTerminalSession>()

  constructor(ctx: Context, private readonly config: Config) {
    super(ctx)
    ctx.effect(() => () => this.disposeAll(), 'web-terminal: teardown')
  }

  async open(sessionId: SessionId, terminalId: string, cwd?: string, shell?: string): Promise<WebTerminalSession> {
    const key = keyOf(sessionId, terminalId)
    const existing = this.sessions.get(key)
    if (existing !== undefined) return existing
    const { argv } = shellArgv(process.platform, this.config.shellPath, this.config.pwshPath, shell)
    const spec: SubprocessTerminalSpawnSpec = {
      argv,
      cwd: cwd ?? process.cwd(),
      rows: this.config.rows,
      cols: this.config.cols,
      graceMs: this.config.disposeGraceMs,
    }
    const terminal = await this.ctx.subprocess.spawnTerminal(spec)
    const session = new LocalWebTerminalSession(
      sessionId,
      terminalId,
      terminal,
      spec.cols,
      spec.rows,
      this.config.scrollbackMaxBytes,
      closed => { this.sessions.delete(keyOf(closed.id, closed.terminalId)) },
    )
    this.sessions.set(key, session)
    return session
  }

  get(sessionId: SessionId, terminalId: string): WebTerminalSession | undefined {
    return this.sessions.get(keyOf(sessionId, terminalId))
  }

  shells(): readonly string[] {
    return availableShells(process.platform)
  }

  async disposeSession(sessionId: SessionId): Promise<void> {
    const owned = [...this.sessions.values()].filter(session => session.id === sessionId)
    await Promise.allSettled(owned.map(session => session.close()))
  }

  private async disposeAll(): Promise<void> {
    const sessions = [...this.sessions.values()]
    this.sessions.clear()
    await Promise.allSettled(sessions.map(session => session.close()))
  }
}
