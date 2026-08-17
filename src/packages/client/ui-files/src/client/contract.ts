/**
 * Registrant-side contract of the details panel's files tab.
 * @module @deepseek-ai/dsh-client-ui-files/client
 */

import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls ui-conversation's SlotMap merge (the files seat) into every
// program that sees this contract, so PropsRuntime<'conversation.details.files'>
// resolves.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { FileContent, FileListing, FileWrite, RpcResponse, SessionId } from '@deepseek-ai/dsh-api-remotes/client'

/**
 * Registrant-private injected share: the three files.* wire calls, delivered
 * as raw RpcResponses — the panel owns unwrapping success and error branches.
 */
export interface FilesInjected {
  /**
   * List one directory level.
   * @param path - absolute directory to list.
   * @param signal - optional caller cancellation.
   * @returns the wire response; the panel renders either branch.
   */
  listDirectory: (path: string, signal?: AbortSignal) => Promise<RpcResponse<FileListing>>
  /**
   * Read one text file whole.
   * @param path - absolute file to read.
   * @param signal - optional caller cancellation.
   * @returns the wire response; the panel renders either branch.
   */
  readFile: (path: string, signal?: AbortSignal) => Promise<RpcResponse<FileContent>>
  /**
   * Commit one full-file write for the panel's session.
   * @param payload - session attribution, target path, content, and the
   *   freshness version the panel read (a concurrent edit fails the write
   *   with `files-stale-version`).
   * @param signal - optional caller cancellation.
   * @returns the wire response; the panel renders either branch.
   */
  writeFile: (
    payload: { sessionId: SessionId; path: string; content: string; expectedVersion: string },
    signal?: AbortSignal,
  ) => Promise<RpcResponse<FileWrite>>
}

/**
 * Full component props: the session-scoped runtime seats (sessionId plus the
 * global workspace feed), the injected wire callbacks, and the locale seat.
 * No store is registered — the panel's expanded/selected state is
 * component-private viewing state, and the details panel closes on session
 * switch, so nothing must survive a remount.
 */
export type FilesPanelProps = PropsRuntime<'conversation.details.files'> & FilesInjected & PropsLocale<'files'>
