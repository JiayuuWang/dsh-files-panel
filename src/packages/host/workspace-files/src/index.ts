/**
 * Service Definition for the `ctx.workspaceFiles` capability seam: read-only
 * workspace-file access for the web GUI's file panel. The seam has one
 * interaction shape, so the service exposes methods rather than a capability
 * union: `list` reports one directory level (metadata only) and `read`
 * returns one regular text file whole. Every call takes an absolute host path
 * — clients never join path segments themselves — and returns UI-facing
 * display paths. The `-fs` backend implements this over the filesystem
 * capability (`ctx.fs`), so reads observe the same typed errors and freshness
 * versions the tool layer sees, and a later guarded write can reuse the
 * version token from {@link FileContent.version}.
 * @module @deepseek-ai/dsh-host-workspace-files
 */

import { Context, Service } from '@deepseek-ai/cordis'

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

/** One directory level: the listing `files.list` returns. */
export interface FileListing {
  /** Absolute path of the listed directory. */
  path: string
  /** Direct children, name-sorted. */
  entries: FileEntry[]
  /** True when the backend cut `entries` at its complete-result bound (the name-sorted tail is absent). */
  truncated: boolean
}

/** One regular text file: the whole content `files.read` returns. */
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

/** Outcome of a full-file write: `files.write`'s return. */
export interface FileWriteOutcome {
  /** Absolute host path of the written file. */
  path: string
  /** Whether the write created a new file or replaced an existing one. */
  operation: 'create' | 'update'
  /** Byte size of the written content. */
  size: number
  /** Opaque freshness version after the write (the next read's expected-version token). */
  version: string
}

/** Closed failure vocabulary of the seam (mirrored onto the wire by consumers). */
export type WorkspaceFilesErrorCode =
  | 'files-not-found'
  | 'files-not-directory'
  | 'files-not-file'
  | 'files-too-large'
  | 'files-stale-version'
  | 'files-permission-denied'
  | 'files-io-error'

/** Typed failure thrown by service methods so consumers can map business codes without string matching. */
export class WorkspaceFilesError extends Error {
  /**
   * @param code - closed business code of the failure.
   * @param path - the absolute path the failure is about.
   * @param message - operator-facing description; bound details (for example a
   *   read size limit) belong here, not in extra fields.
   */
  constructor(readonly code: WorkspaceFilesErrorCode, readonly path: string, message: string) {
    super(message)
    this.name = 'WorkspaceFilesError'
  }
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    workspaceFiles: WorkspaceFiles
  }
}

/**
 * Abstract workspace-file access service for the web GUI host. Subclass,
 * implement `list` and `read`, and load the subclass as a plugin — it
 * registers as `ctx.workspaceFiles` (one implementation per context; loading a
 * second throws, cordis' standard duplicate-service behavior).
 */
export abstract class WorkspaceFiles extends Service {
  constructor(ctx: Context) {
    super(ctx, 'workspaceFiles')
  }

  /**
   * List one directory level.
   * @param path - absolute directory to list.
   * @param signal - caller lifetime; abort stops the scan.
   * @returns the bounded level with metadata only, never file contents.
   * @throws {WorkspaceFilesError} `files-not-found` for an absent target,
   *   `files-not-directory` for a non-directory target, and
   *   `files-permission-denied` / `files-io-error` for backend failures.
   */
  abstract list(path: string, signal?: AbortSignal): Promise<FileListing>

  /**
   * Read one regular text file whole.
   * @param path - absolute file to read.
   * @param signal - caller lifetime; abort stops the read.
   * @returns the decoded content with its freshness version.
   * @throws {WorkspaceFilesError} `files-not-found` for an absent target,
   *   `files-not-file` for a non-regular-file target, `files-too-large` for a
   *   file at or above the backend's read bound, and
   *   `files-permission-denied` / `files-io-error` for backend failures.
   */
  abstract read(path: string, signal?: AbortSignal): Promise<FileContent>

  /**
   * Atomically create or replace one text file whole.
   * @param path - absolute file to write.
   * @param content - the full new file content.
   * @param expectedVersion - the freshness version the caller observed
   *   (typically from {@link FileContent.version}); omitted for an
   *   unconditional overwrite. A mismatch fails with `files-stale-version`
   *   instead of clobbering a concurrent edit.
   * @param signal - caller lifetime; abort stops the write.
   * @returns the write outcome with the version the write produced.
   * @throws {WorkspaceFilesError} `files-stale-version` for a version
   *   mismatch, `files-not-file` for a non-regular-file target, and
   *   `files-permission-denied` / `files-io-error` for backend failures.
   */
  abstract write(
    path: string,
    content: string,
    expectedVersion?: string,
    signal?: AbortSignal,
  ): Promise<FileWriteOutcome>
}

export default WorkspaceFiles
