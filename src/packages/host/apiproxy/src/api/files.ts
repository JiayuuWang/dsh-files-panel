/**
 * files domain contract: the web GUI's workspace file panel surface. No
 * protocol version: client and host ship together; introduce protocolVersion
 * only when an independently released client appears.
 */

import type { RpcRequest, RpcResponse } from './rpc.ts'
import type { SessionId } from '@deepseek-ai/dsh-session/types'

/** One file row of a listing: a direct child of the listed directory. */
export interface FileEntry {
  /** Base name shown in a tree row. */
  name: string
  /** Absolute host path — the client never joins path segments itself. */
  path: string
  /** What the child is; `other` covers sockets, devices, and unknown types. */
  type: 'file' | 'directory' | 'other'
  /** Byte size of a regular file, when the backend reports it. */
  size?: number
  /** Opaque freshness token, when the backend reports it. */
  version?: string
  /** Hidden by the host platform's convention (dot-prefixed); the client owns whether to show it. */
  hidden: boolean
}

/** files.list response value: one directory level, bounded. */
export interface FileListing {
  /** Absolute path of the listed directory. */
  path: string
  /** Direct children, name-sorted. */
  entries: FileEntry[]
  /** True when the backend cut `entries` at its configured bound (the name-sorted tail is absent). */
  truncated: boolean
}

/** files.read response value: one regular text file, whole. */
export interface FileContent {
  /** Absolute host path of the read file. */
  path: string
  /** Byte size of the content. */
  size: number
  /** Opaque freshness token a later guarded write can use as its expected version. */
  version: string
  /** The full decoded UTF-8 content. */
  content: string
}

/** files.write response value: the committed full-file write. */
export interface FileWrite {
  /** Absolute host path of the written file. */
  path: string
  /** Whether the write created a new file or replaced an existing one. */
  operation: 'create' | 'update'
  /** Byte size of the written content. */
  size: number
  /** Opaque freshness version after the write. */
  version: string
}

/** Workspace-file unary methods for the browser file panel. */
export interface FilesApi {
  /**
   * List one directory level of a workspace file tree; the carrier's request
   * signal follows the caller, stopping the backend's scan on disconnect or
   * timeout. An absent or non-directory target fails with `files-not-found` /
   * `files-not-directory`.
   */
  list(
    request: RpcRequest<{ path: string }>,
    signal: AbortSignal,
  ): Promise<RpcResponse<FileListing>>

  /**
   * Read one regular text file whole; a non-regular target fails with
   * `files-not-file`, a file at or above the service's read bound with
   * `files-too-large`.
   */
  read(
    request: RpcRequest<{ path: string }>,
    signal: AbortSignal,
  ): Promise<RpcResponse<FileContent>>

  /**
   * Atomically create or replace one text file whole from the browser panel.
   * `expectedVersion` (typically the value the panel read) guards against
   * clobbering a concurrent edit: a mismatch fails with `files-stale-version`.
   * The host logs the edit as a `user/file-edit` session event and queues a
   * model-facing notice into the session's agent, so the model learns about
   * the human edit at its next step.
   */
  write(
    request: RpcRequest<{
      sessionId: SessionId
      path: string
      content: string
      expectedVersion?: string
    }>,
    signal: AbortSignal,
  ): Promise<RpcResponse<FileWrite>>
}
