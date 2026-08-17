# @deepseek-ai/dsh-host-workspace-files-fs

English | [中文](README.zh.md)

Filesystem-capability backend of the [workspace-files seam](../workspace-files/README.md): registers `ctx.workspaceFiles` with one-level directory listing, whole-file text reads, and guarded whole-file writes over `ctx.fs`. Nothing renders on the host display, so this backend serves remote clients too.

Behavior facts: listings return **files and directories** with a host-owned `hidden` flag (POSIX dot convention) left for the client to act on; every entry path is absolute and host-joined — clients never join path segments themselves. One `list` call returns at most `maxEntries` rows (config, default 1000 — the bound GitHub's web UI applies to directory listings) and reports `truncated: true` when the name-sorted tail is absent. One `read` call refuses a file at or above `maxReadBytes` (config, default 1 MiB) with `files-too-large` instead of returning truncated content, and rejects non-UTF-8 content with `files-io-error` (the fs backend's own binary rejection). One `write` call commits the full content atomically; a supplied `expectedVersion` guards it against concurrent edits (`files-stale-version` on mismatch), and a directory target fails with `files-not-file`. Failures throw the seam's typed `WorkspaceFilesError`. Because reads and writes flow through `ctx.fs`, the panel observes the same backend, sandbox stance, and freshness versions as the agent's own file tools; `FileContent.version` is the token a guarded write uses.

## Model Experience

None, as the backend serves the GUI host's file panel; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **Windows hidden attribute is not read** — Node dirents do not expose `FILE_ATTRIBUTE_HIDDEN`, so `hidden` means dot-prefixed on every platform until a native probe is worth its cost.
- **Whole-filesystem scope** — there is no per-deployment browse-root restriction; a root here would be UX scoping rather than a security boundary.
- **Whole-file writes only** — no line-level edits or partial replacement; the panel's editor saves complete files.
