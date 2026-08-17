# @deepseek-ai/dsh-host-workspace-files

English | [中文](README.zh.md)

Service Definition for the `ctx.workspaceFiles` capability seam: workspace-file access for the web GUI's file panel. The seam has one interaction shape, so the service exposes methods rather than a capability union — `list` reports one directory level (metadata only), `read` returns one regular text file whole, and `write` commits one full-file write.

Every call takes an absolute host path (clients never join path segments themselves) and returns UI-facing display paths. Failures are the closed `WorkspaceFilesError` vocabulary (`files-not-found` / `files-not-directory` / `files-not-file` / `files-too-large` / `files-stale-version` / `files-permission-denied` / `files-io-error`), which the API gateway mirrors 1:1 onto wire error codes. The [`-fs`](../workspace-files-fs/README.md) backend implements this package over the filesystem capability (`ctx.fs`), so reads and writes observe the same typed errors and freshness versions the tool layer sees; `FileContent.version` is the freshness token a guarded write uses as its expected version, and a mismatched guard fails with `files-stale-version` instead of clobbering a concurrent edit.

## Model Experience

None, as the seam serves the GUI host's file panel; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **Whole-filesystem scope** — no per-deployment browse-root restriction; a root here would be UX scoping rather than a security boundary (same stance as the directory-picker seam).
- **Whole-file writes only** — no line-level edits or partial replacement; the panel's editor saves complete files.
