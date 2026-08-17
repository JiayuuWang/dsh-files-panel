/**
 * Filesystem-capability backend of the workspace-files seam: registers
 * `ctx.workspaceFiles` with directory listing and text reads over `ctx.fs`,
 * so the browser panel observes the same backend, typed errors, and freshness
 * versions the tool layer sees. Nothing renders on the host display; the
 * backend serves the API gateway only. Policy decisions (hidden entries
 * flagged but returned, whole-filesystem scope, dot-prefix hidden convention)
 * follow the directory-picker seam's stance.
 * @module @deepseek-ai/dsh-host-workspace-files-fs
 */

import { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { FsError, FsVersion } from '@deepseek-ai/dsh-fs'
import { WorkspaceFiles, WorkspaceFilesError } from '@deepseek-ai/dsh-host-workspace-files'
import type { FileContent, FileEntry, FileListing, FileWriteOutcome } from '@deepseek-ai/dsh-host-workspace-files'

/** Validated plugin configuration. */
export interface Config {
  /** Complete-result bound of one listing level; see {@link FsWorkspaceFiles.Config}. */
  maxEntries: number
  /** Byte bound on a whole `read`; see {@link FsWorkspaceFiles.Config}. */
  maxReadBytes: number
}

const DEFAULT_MAX_ENTRIES = 1000
const DEFAULT_MAX_READ_BYTES = 1024 * 1024

/** Map an fs-capability failure onto the seam's closed vocabulary (unknown throws stay io-error). */
function mapFsError(error: unknown, path: string, notFileCode: 'files-not-directory' | 'files-not-file'): WorkspaceFilesError {
  if (error instanceof FsError) {
    switch (error.code) {
      case 'FS_NOT_FOUND':
        return new WorkspaceFilesError('files-not-found', path, error.message)
      case 'FS_NOT_DIRECTORY':
      case 'FS_NOT_REGULAR_FILE':
        return new WorkspaceFilesError(notFileCode, path, error.message)
      case 'FS_PERMISSION_DENIED':
      case 'FS_SANDBOX_DENIED':
        return new WorkspaceFilesError('files-permission-denied', path, error.message)
      case 'FS_STALE_VERSION':
        return new WorkspaceFilesError('files-stale-version', path, error.message)
      case 'FS_TOO_LARGE':
        return new WorkspaceFilesError('files-too-large', path, error.message)
      default:
        return new WorkspaceFilesError('files-io-error', path, error.message)
    }
  }
  return new WorkspaceFilesError('files-io-error', path, error instanceof Error ? error.message : String(error))
}

/** The `ctx.workspaceFiles` implementation over the filesystem capability. */
export default class FsWorkspaceFiles extends WorkspaceFiles {
  static inject = ['fs']

  /**
   * `maxEntries` bounds the complete listing level a single `list` call may
   * materialize and put on the wire (hidden rows included), with `truncated`
   * flagging a cut level; the default follows GitHub's web UI (1,000 rows).
   * `maxReadBytes` bounds a single `read` — a file at or above the limit
   * fails with `files-too-large` instead of returning truncated content.
   */
  static Config: z<Config> = z.object({
    maxEntries: z.natural().min(1).default(DEFAULT_MAX_ENTRIES),
    maxReadBytes: z.natural().min(1).default(DEFAULT_MAX_READ_BYTES),
  })

  constructor(ctx: Context, private readonly config: Config) {
    super(ctx)
  }

  async list(path: string, signal?: AbortSignal): Promise<FileListing> {
    try {
      const target = await this.ctx.fs.resolve(path, signal === undefined ? undefined : { signal })
      const info = await this.ctx.fs.stat(target, signal)
      if (info === undefined) {
        throw new WorkspaceFilesError('files-not-found', path, `cannot list "${path}": no such directory`)
      }
      if (info.type !== 'directory') {
        throw new WorkspaceFilesError('files-not-directory', path, `cannot list "${path}": not a directory`)
      }
      const children = await this.ctx.fs.listDir(target, signal)
      const entries: FileEntry[] = children.slice(0, this.config.maxEntries).map(entry => ({
        name: entry.name,
        path: entry.target.displayPath,
        type: entry.type,
        ...(entry.size === undefined ? {} : { size: entry.size }),
        ...(entry.version === undefined ? {} : { version: String(entry.version) }),
        // POSIX hidden convention; Windows' hidden attribute is not exposed by
        // dirents (same Known Limitation as the directory-picker browse backend).
        hidden: entry.name.startsWith('.'),
      }))
      return { path: target.displayPath, entries, truncated: children.length > this.config.maxEntries }
    } catch (error: unknown) {
      if (error instanceof WorkspaceFilesError) throw error
      throw mapFsError(error, path, 'files-not-directory')
    }
  }

  async read(path: string, signal?: AbortSignal): Promise<FileContent> {
    try {
      const target = await this.ctx.fs.resolve(path, signal === undefined ? undefined : { signal })
      const info = await this.ctx.fs.stat(target, signal)
      if (info === undefined) {
        throw new WorkspaceFilesError('files-not-found', path, `cannot read "${path}": no such file`)
      }
      if (info.type !== 'file') {
        throw new WorkspaceFilesError('files-not-file', path, `cannot read "${path}": not a regular file`)
      }
      if (info.size !== undefined && info.size > this.config.maxReadBytes) {
        throw new WorkspaceFilesError(
          'files-too-large',
          path,
          `cannot read "${path}": exceeds the ${this.config.maxReadBytes}-byte read bound`,
        )
      }
      const content = await this.ctx.fs.readText(target, signal)
      return {
        path: target.displayPath,
        size: info.size ?? Buffer.byteLength(content, 'utf8'),
        version: String(info.version),
        content,
      }
    } catch (error: unknown) {
      if (error instanceof WorkspaceFilesError) throw error
      throw mapFsError(error, path, 'files-not-file')
    }
  }

  async write(
    path: string,
    content: string,
    expectedVersion?: string,
    signal?: AbortSignal,
  ): Promise<FileWriteOutcome> {
    try {
      const target = await this.ctx.fs.resolve(path, signal === undefined ? undefined : { signal })
      const existing = await this.ctx.fs.stat(target, signal)
      if (existing !== undefined && existing.type !== 'file') {
        throw new WorkspaceFilesError('files-not-file', path, `cannot write "${path}": not a regular file`)
      }
      // A supplied version guards the write against concurrent edits
      // (FS_STALE_VERSION); omission is an unconditional overwrite.
      const expected = expectedVersion === undefined
        ? undefined
        : { kind: 'replaceIfVersion' as const, version: FsVersion(expectedVersion) }
      const outcome = await this.ctx.fs.writeText(target, content, expected, signal)
      return {
        path: target.displayPath,
        operation: outcome.operation,
        size: Buffer.byteLength(content, 'utf8'),
        version: String(outcome.version),
      }
    } catch (error: unknown) {
      if (error instanceof WorkspaceFilesError) throw error
      throw mapFsError(error, path, 'files-not-file')
    }
  }
}
