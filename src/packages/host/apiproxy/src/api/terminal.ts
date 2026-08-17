/**
 * terminal domain contract: the web GUI's interactive Terminal view.
 * Polling-oriented — the client reads output by an opaque cursor while input
 * is fire-and-forget — matching the host web-terminal seam. A session may run
 * several terminals at once (one per terminal pane), so every method is keyed
 * by a client-minted `terminalId` scoped to its session. No protocol version:
 * client and host ship together; introduce protocolVersion only when an
 * independently released client appears.
 */

import type { RpcRequest, RpcResponse } from './rpc.ts'
import type { SessionId } from '@deepseek-ai/dsh-session/types'

/** Allowed signals delivered to a terminal's foreground process group. */
export type TerminalSignal = 'SIGINT' | 'SIGTERM' | 'SIGKILL' | 'SIGTSTP' | 'SIGHUP'

/** terminal.open response value: the live terminal's identity, dimensions, and scrollback seed. */
export interface TerminalOpenValue {
  /** Top-level shell process id. */
  pid: number
  /** Terminal columns. */
  cols: number
  /** Terminal rows. */
  rows: number
  /** Retained scrollback tail present at open (raw, ANSI escapes intact). */
  output: string
  /** Opaque cursor after `output` — pass back to `terminal.read`. */
  cursor: number
}

/** terminal.read response value: one bounded read of retained output. */
export interface TerminalReadValue {
  /** Output produced since the request cursor. */
  output: string
  /** Opaque cursor for the next read. */
  cursor: number
  /** True when output older than the request cursor was evicted. */
  truncated: boolean
  /** True when the terminal's shell has exited. */
  exited: boolean
}

/** terminal.shells response value: the shell names this host can spawn. */
export interface TerminalShellsValue {
  /** Selectable shell names (e.g. `pwsh`, `cmd` on Windows; `bash`, `zsh` elsewhere). */
  shells: string[]
}

/** Interactive-terminal unary methods for the browser Terminal view. */
export interface TerminalApi {
  /**
   * Open (or return the already-live) terminal for a session, spawning the
   * selected shell at `cwd` when none exists. Re-opening the same
   * (session, terminalId) re-attaches to the same shell and re-seeds the
   * scrollback; a different `terminalId` opens a distinct terminal.
   */
  open(
    request: RpcRequest<{ sessionId: SessionId; terminalId: string; cwd?: string; shell?: string }>,
    signal: AbortSignal,
  ): Promise<RpcResponse<TerminalOpenValue>>

  /**
   * Write raw input bytes to the shell's stdin (no implicit newline).
   * Fire-and-forget: the echo arrives through subsequent `read` calls.
   */
  write(
    request: RpcRequest<{ sessionId: SessionId; terminalId: string; data: string }>,
    signal: AbortSignal,
  ): Promise<RpcResponse<{ delivered: true }>>

  /**
   * Read retained output produced since an opaque cursor (0 reads from the
   * retained start). The returned cursor is opaque: pass it back verbatim.
   */
  read(
    request: RpcRequest<{ sessionId: SessionId; terminalId: string; cursor: number }>,
    signal: AbortSignal,
  ): Promise<RpcResponse<TerminalReadValue>>

  /** Deliver an allowed signal to the current foreground process group. */
  signal(
    request: RpcRequest<{ sessionId: SessionId; terminalId: string; signal: TerminalSignal }>,
    signal: AbortSignal,
  ): Promise<RpcResponse<{ delivered: true }>>

  /** Close the terminal and await its captured process-tree quiescence. */
  close(
    request: RpcRequest<{ sessionId: SessionId; terminalId: string }>,
    signal: AbortSignal,
  ): Promise<RpcResponse<{ closed: true }>>

  /** List the shell names this host can spawn (no session attribution). */
  shells(
    request: RpcRequest<Record<never, never>>,
    signal: AbortSignal,
  ): Promise<RpcResponse<TerminalShellsValue>>
}
