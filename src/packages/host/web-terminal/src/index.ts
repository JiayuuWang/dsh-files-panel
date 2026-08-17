/**
 * Service Definition for the `ctx.webTerminals` capability seam: interactive
 * terminals for the web GUI's Terminal view. The seam is polling-oriented
 * rather than send/wait — the human types freely, so output is retained in a
 * bounded scrollback and read by an opaque cursor, while input is
 * fire-and-forget. A session may run several terminals at once (one per
 * terminal pane), each keyed by a client-minted `terminalId` scoped to its
 * {@link SessionId}; the `-local` backend implements the seam over the
 * subprocess terminal primitive, selecting the shell by host platform and an
 * optional explicit shell name.
 * @module @deepseek-ai/dsh-host-web-terminal
 */

import { Context, Service } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-session/types'

/** Allowed signals delivered to a terminal's foreground process group. */
export type WebTerminalSignal = 'SIGINT' | 'SIGTERM' | 'SIGKILL' | 'SIGTSTP' | 'SIGHUP'

/** One bounded read of retained terminal output, addressed by an opaque cursor. */
export interface WebTerminalRead {
  /** Retained output produced since `cursor`, in delivery order (raw, ANSI escapes intact). */
  output: string
  /** Opaque cursor to pass back for the next read. */
  cursor: number
  /** True when output older than `cursor` was evicted from the bounded scrollback. */
  truncated: boolean
  /** True when the terminal's top-level shell process has exited. */
  exited: boolean
}

/** One live interactive terminal owned by one session. */
export interface WebTerminalSession {
  /** The owning session's identity. */
  readonly id: SessionId
  /** The client-minted terminal key within the owning session. */
  readonly terminalId: string
  /** Top-level shell process id, when the backend has one. */
  readonly pid: number
  /** Terminal column count the shell was started with. */
  readonly cols: number
  /** Terminal row count the shell was started with. */
  readonly rows: number
  /**
   * Read retained output produced since an opaque cursor (0 reads from the
   * retained start). The returned cursor is opaque: pass it back verbatim.
   * @param cursor - prior read's cursor, or 0 for the retained start.
   * @returns the bounded delta plus the next cursor and exit/truncation facts.
   */
  read(cursor: number): WebTerminalRead
  /**
   * Write raw input bytes to the shell's stdin without an implicit newline.
   * @param data - UTF-8 text to deliver.
   */
  write(data: string): Promise<void>
  /**
   * Deliver an allowed signal to the current foreground process group.
   * @param signal - the signal to deliver.
   */
  signal(signal: WebTerminalSignal): Promise<void>
  /**
   * Close the captured process tree and await quiescence. Idempotent.
   */
  close(): Promise<void>
}

/**
 * Abstract interactive-terminal service for the web GUI host.
 * Subclass, implement `open`, `get`, `shells`, and `disposeSession`, and load
 * the subclass as a plugin — it registers as `ctx.webTerminals` (one
 * implementation per context; loading a second throws, cordis' standard
 * duplicate-service behavior).
 */
export abstract class WebTerminalService extends Service {
  constructor(ctx: Context) {
    super(ctx, 'webTerminals')
  }

  /**
   * Open (or return the already-live) terminal for a session, spawning the
   * selected shell at `cwd` when none exists. The same (session, terminalId)
   * re-attaches to the same shell; a distinct `terminalId` opens a distinct
   * terminal.
   * @param sessionId - owning session.
   * @param terminalId - client-minted terminal key within the session.
   * @param cwd - initial working directory; the backend's default when omitted.
   * @param shell - shell name; the platform default when omitted.
   * @returns the live terminal handle (fresh or reused).
   */
  abstract open(sessionId: SessionId, terminalId: string, cwd?: string, shell?: string): Promise<WebTerminalSession>

  /**
   * Resolve the live terminal for a (session, terminalId), if one exists.
   * @param sessionId - owning session.
   * @param terminalId - terminal key within the session.
   * @returns the handle, or undefined when no such terminal is open.
   */
  abstract get(sessionId: SessionId, terminalId: string): WebTerminalSession | undefined

  /**
   * Shell names this backend can spawn (platform-dependent).
   * @returns the selectable shell names.
   */
  abstract shells(): readonly string[]

  /**
   * Close every terminal owned by a session and await quiescence. Idempotent;
   * a session with no terminals resolves immediately.
   * @param sessionId - owning session.
   */
  abstract disposeSession(sessionId: SessionId): Promise<void>
}

export default WebTerminalService

declare module '@deepseek-ai/cordis' {
  interface Context {
    webTerminals: WebTerminalService
  }
}
