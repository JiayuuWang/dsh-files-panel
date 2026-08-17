/**
 * Registrant-side contract of the conversation view's Terminal tab.
 * @module @deepseek-ai/dsh-client-ui-terminal/client
 */

import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls ui-conversation's SlotMap merge (the view ring) into every
// program that sees this contract, so PropsRuntime<'conversation.view'> resolves.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {
  RpcResponse, SessionId, TerminalOpenValue, TerminalReadValue, TerminalShellsValue, TerminalSignal,
} from '@deepseek-ai/dsh-api-remotes/client'

/**
 * Registrant-private injected share: the six terminal.* wire calls, delivered
 * as raw RpcResponses — the view owns unwrapping success and error branches.
 */
export interface TerminalInjected {
  /**
   * Open (or re-attach to) the session's terminal for a pane key.
   * @param payload - session attribution, the pane's terminal key, optional starting directory, and optional shell name.
   * @param signal - optional caller cancellation.
   */
  openTerminal: (payload: {
    sessionId: SessionId
    terminalId: string
    cwd?: string
    shell?: string
  }, signal?: AbortSignal) => Promise<RpcResponse<TerminalOpenValue>>
  /** Write raw input bytes to the shell's stdin. */
  writeTerminal: (payload: { sessionId: SessionId; terminalId: string; data: string }, signal?: AbortSignal) => Promise<RpcResponse<{ delivered: true }>>
  /** Read retained output produced since an opaque cursor. */
  readTerminal: (payload: { sessionId: SessionId; terminalId: string; cursor: number }, signal?: AbortSignal) => Promise<RpcResponse<TerminalReadValue>>
  /** Deliver an allowed signal to the foreground process group. */
  signalTerminal: (payload: { sessionId: SessionId; terminalId: string; signal: TerminalSignal }, signal?: AbortSignal) => Promise<RpcResponse<{ delivered: true }>>
  /** Close the terminal and await its process-tree quiescence. */
  closeTerminal: (payload: { sessionId: SessionId; terminalId: string }, signal?: AbortSignal) => Promise<RpcResponse<{ closed: true }>>
  /** List the shell names this host can spawn. */
  listTerminalShells: (payload: Record<never, never>, signal?: AbortSignal) => Promise<RpcResponse<TerminalShellsValue>>
}

/** Full component props: the conversation-view runtime seats, the injected wire calls, and the locale seat. */
export type TerminalViewProps = PropsRuntime<'conversation.view'> & TerminalInjected & PropsLocale<'terminal'>
