# @deepseek-ai/dsh-client-ui-files

English | [中文](README.zh.md)

Details-panel files tab plugin: fills the `conversation.details.files` seat that ui-conversation's details panel declares with the current session workspace's file tree plus an editable CodeMirror preview. The tree loads levels lazily over the [`files.list`](../../host/apiproxy/README.md) wire domain (directories first, `hidden` rows included, truncation flagged), the preview reads one text file through `files.read`, and Save (button or Ctrl/Cmd+S) commits through `files.write` with the version the panel read — a concurrent edit fails the write with `files-stale-version`, which the panel surfaces as a conflict banner with a reload affordance. The editor binds three keymaps through a toolbar selector: the default CodeMirror bindings, vim modal keys (`@replit/codemirror-vim`), and emacs keys (`@replit/codemirror-emacs`); switching keymaps remounts the editor and keeps the current buffer. Every save the host logs as a `user/file-edit` session event and queues a model-facing notice into the session's agent, so the model learns about the human edit at its next step. All calls ride the shared connection client, so the panel observes the same backend, bounds, and error vocabulary as the agent's file tools. The workspace root resolves from the standard workspace feed (the workspace whose `sessionIds` include the current session); a session without a workspace shows an empty state. All wire errors render as `code: message` text — the panel owns no policy, it only displays.

The panel registers no store: expanded levels, selection, and editor state are component-private viewing state, reset with the panel's per-session remount (the details panel closes on session switch).

## Model Experience

Indirectly, through the host-side edit notice: a save queues an `agent.inject()` context message the gateway owns and the agent loop logs as an ordinary user/message; this package registers nothing model-facing itself.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **CodeMirror, not Monaco** — the vscode-style Monaco editor needs a worker pipeline the single-file client-bundle architecture does not carry; CodeMirror bundles workerless. See the workspace-files Agent Note.
- **Keymap choice resets per session** — the keymap selector is panel-private viewing state, not a persisted preference.
- **Unsaved edits are discarded on file switch** — switching the tree selection replaces the editor buffer without a confirmation prompt.
- **No directory state refresh** — levels load on expand and via the root Refresh button only; file watcher-backed invalidation is deferred.
- **Hidden files always shown** — no show/hide toggle yet (the host flags `hidden`; the client simply renders it).
- **Every save queues a model notice** — repeated saves each inject a context message; deduplication is deferred.
