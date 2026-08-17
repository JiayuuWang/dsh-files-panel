# @deepseek-ai/dsh-client-ui-terminal

Browser plugin contributing the Terminal tab to the conversation view ring (beside Chat and Trajectory). It renders one per-session interactive PTY with xterm.js and drives the `terminal.*` wire domain: on mount it opens (or re-attaches to) the session's terminal, seeds the emulator from the retained scrollback, then polls `terminal.read` on a short cadence while forwarding keystrokes through `terminal.write`. The host terminal stays alive across view switches — unmounting only disposes the emulator, so a tab switch re-attaches to the same shell — and a restart button closes and reopens it.

## Model Experience

None, as the terminal is a human-facing surface; its input and output never reach a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **Polling transport** — output is read on a short cadence rather than streamed over the mux; streaming is a deferred upgrade.
- **Fixed size** — the emulator matches the host terminal's fixed rows/cols; resize/refit is deferred with the PTY resize work.
