# dsh-files-panel — Usage Guide

This plugin adds three capabilities to the DeepSeek Harness Web GUI (the `dsh web` page):

1. **Terminal tab** — an interactive per-session shell (PowerShell on Windows, bash elsewhere), beside Chat and Trajectory.
2. **File explorer** — a top-right toggle that opens the workspace file tree with type icons and a syntax-highlighting editor.
3. **Split panes** — a tmux-style layout: split Chat / Trajectory / Terminal right or down, fullscreen a pane, and drag the dividers.

The plugin is not a standalone npm install. It is a set of packages inside the `deepseek-harness` monorepo, distributed here as **cumulative git patches** (one per milestone, each containing every earlier milestone). Apply the *latest* patch to a clean `deepseek-harness` checkout, then build.

---

## 1. Prerequisites

- Node.js `^22.19` or `>=24`, and `pnpm` (v11).
- A checkout of [`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness) at the pinned base commit **`47f943859b`**.
- (Optional) a `DEEPSEEK_API_KEY` to actually run the agent; the UI and the three features above work without it.

## 2. Install (apply the patch)

In the `deepseek-harness` repository root, at base commit `47f943859b`:

```bash
git apply ../dsh-files-panel/patch/c12-cross-session-panes.dsh.diff
pnpm install
pnpm run build
```

> Use the **latest** checkpoint patch (`c12-…`). It is cumulative: it includes C1–C11, so there is no need to apply the earlier patches one by one. (The older `c1…c11` files are kept only as the milestone history.)

## 3. Run

From the `deepseek-harness` repository root:

```bash
pnpm dsh --profile web
```

Open the printed URL (normally `http://127.0.0.1:3080`) and **hard-refresh** (`Ctrl+F5`).

> **Important:** run it with the workspace launcher `pnpm dsh --profile web`, **not** `npx @deepseek-ai/dsh web`. The `npx` form serves the *published* snapshot from the npm cache and will not include this plugin's changes.

## 4. Use the features

### 4.1 Terminal tab

1. Open (or create) a session.
2. In the header, click the **终端 / Terminal** tab (beside 对话/Chat and Trajectory).
3. Type shell commands directly. The shell is PowerShell on Windows, bash on Linux/macOS.
4. Switching away to another tab and back **keeps the same shell** (it re-attaches). The **重启终端 / Restart terminal** button closes and reopens a fresh shell.

### 4.2 File explorer

1. Click the **folder icon** in the top-right of the session header (the "Toggle file explorer" button).
2. The right-hand details column opens on the **文件 / Files** tab, showing the current workspace's file tree.
3. Click a directory to expand, a file to open it. Files render with **syntax highlighting**; type icons (code / json / markdown / image / …) identify each row.
4. Edit the file in the editor and press **Save** (or `Ctrl/Cmd+S`). If the file changed elsewhere, a conflict banner offers **重新载入 / Reload**. The keymap selector switches between Default / Vim / Emacs.

### 4.3 Split panes

1. Every pane has a thin chrome bar with four buttons:
   - **⫞** — split right (side-by-side)
   - **⫟** — split down (stacked)
   - **⛶** — fullscreen this pane (click again to leave)
   - **✕** — close this pane
2. Splitting creates a new pane (starting on Chat). Switch a pane's view by clicking it (to focus it), then clicking a header tab (Chat / Trajectory / Terminal) — the tabs act on the **focused** pane.
3. Drag the divider between two panes to resize; each side keeps at least 10%.
4. Splits are **recursive** — any pane can be split again, and each pane can be fullscreened independently. The layout is persisted per session.

---

## 5. Known limitations

- The terminal polls output (~60 ms) rather than streaming; it runs at a fixed size and inherits `TERM=dumb` (no color/full-screen programs) from the subprocess layer.
- One terminal per session.
- Split panes of the **same** view share that view's state (e.g. two Chat panes share the draft/selection).
- The file tree and terminal are human-facing only: nothing they show is injected into the model.

## 6. Milestones (checkpoints)

| Checkpoint | Content |
|---|---|
| C1 | `workspace-files` capability seam + `files` wire domain |
| C2 | File panel (details "Tools / Files" tabs, tree, read-only preview) |
| C3 | CodeMirror edit/save + conflict detection + `user/file-edit` session event |
| C4 | vim / emacs keymaps |
| C5 | Details-panel open affordance (tool-row "详情" pill) |
| C6 | Terminal tab (`web-terminal` seam + `terminal` wire + xterm.js) |
| C7 | Explorer toggle + file icons + syntax highlighting |
| C8 | tmux-style split panes |
| C9 | Pane layout fix (view-owns-scroller) |

Each patch is cumulative from the base commit; apply only the latest.
