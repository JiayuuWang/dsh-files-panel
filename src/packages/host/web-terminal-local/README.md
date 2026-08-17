# @deepseek-ai/dsh-host-web-terminal-local

Local subprocess backend of the [`web-terminal`](../web-terminal/README.md) seam: one interactive PTY per session over the subprocess terminal primitive, with the shell selected by host platform (PowerShell on Windows, bash elsewhere). Output streams raw — ANSI escapes intact — into a bounded scrollback the browser Terminal view reads by cursor; the backend retains only a scrollback tail.

Nothing renders on the host display; the backend serves the API gateway only. Each session's terminal is closed when its session is disposed, and every live terminal is closed on service teardown.

## Model Experience

None, as the backend serves the GUI host's Terminal view; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **TERM is fixed to `dumb`** by the subprocess terminal primitive, so the shell does not emit color or run full-screen programs; unblocking this needs a `termName` option on the subprocess seam.
- **No PTY resize** — the shell runs at the configured fixed rows/cols.
