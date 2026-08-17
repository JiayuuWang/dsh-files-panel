# @deepseek-ai/dsh-host-web-terminal

Service Definition for the `ctx.webTerminals` capability seam: one interactive, per-session terminal for the web GUI's Terminal view. Each session owns at most one terminal, keyed by its `SessionId`. The seam is polling-oriented — output is retained in a bounded scrollback and read by an opaque cursor, while input is fire-and-forget — unlike the model-facing `@deepseek-ai/dsh-terminal` registry whose `startSend` waits for a prompt.

The [`-local`](../web-terminal-local/README.md) backend implements this package over the subprocess terminal primitive, selecting the shell by host platform (PowerShell on Windows, bash elsewhere). The API gateway mirrors the seam vocabulary onto the `terminal.*` wire domain and closes each terminal when its session is disposed.

## Model Experience

None, as the seam serves the GUI host's Terminal view; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **Fixed terminal size** — no PTY resize; the shell starts at a fixed rows/cols and the browser emulator matches that size.
- **One terminal per session** — multiple terminals per session (for split-pane views) are deferred.
