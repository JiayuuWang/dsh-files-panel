# Usage

This plugin adds an interactive **Terminal**, a workspace **file browser**, and **tmux-style split panes** to the DeepSeek Harness web GUI.

## Prerequisites

- A [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) checkout at base commit `47f943859b`
- Node `^22.19 || >=24` and pnpm

## Install

**One command (recommended)** — from this plugin checkout, pass your `deepseek-harness` checkout:

```powershell
# Windows PowerShell
.\install.ps1 <path-to-deepseek-harness-checkout>
```

```bash
# Linux / macOS / Git Bash
./install.sh <path-to-deepseek-harness-checkout>
```

The installer validates the checkout, applies the patch (skipped when already applied), then runs `pnpm install` and `pnpm run build`.

**Or manually**, from the `deepseek-harness` repo root:

```bash
git apply path/to/dsh-files-panel.patch
pnpm install
pnpm run build
```

Start the web GUI from the workspace (never `npx`):

```bash
pnpm dsh --profile web
```

Open the printed URL (default `http://127.0.0.1:3080`) and hard-refresh `Ctrl+F5`. Restart the server if you upgraded an already-running instance.

## Terminal

1. Open a session, then click the **Terminal** tab (beside Chat / Trajectory).
2. A live shell starts immediately — PowerShell on Windows, bash on Linux/macOS.
3. The toolbar has:
   - a **shell picker** — segmented buttons (`默认` / `pwsh` / `cmd` / `bash` / `zsh` / `sh`); the active one is highlighted; picking another restarts the terminal with that shell;
   - a **restart** button that closes and reopens the shell.
4. Switching tabs away and back re-attaches to the same shell. A split Terminal pane owns its own independent shell.

## File browser

1. Click the **folder icon** in the session header (top right).
2. The right panel shows the workspace file tree, each row with a type icon.
3. Click a file to open it with syntax highlighting; edit and press **Save** (`Ctrl/Cmd+S`). A version conflict prompts you to reload. Keymaps can switch between Default / Vim / Emacs.
4. Drag the **6px divider** between the tree and the editor to resize the two halves (each side keeps ≥ 20%).

## Split panes

Each pane has a thin toolbar:

| Button | Action |
|---|---|
| **⫞** | split right (side by side) |
| **⫟** | split down (stacked) |
| **⛶** | fullscreen this pane (toggle) |
| **✕** | close this pane |

- Splitting inherits the source view: a **Trajectory** pane duplicates the trajectory; a **Terminal** pane opens a **new terminal**; a **Chat** pane starts a **new session** shown in the new pane — two sessions side by side, each independently usable.
- **Each chat pane has its own input box** at its bottom, bound to that pane's session and sized with the pane. The shared bottom composer hides while a split is active.
- Closing a pane re-flows the remaining panes to fill the whole grid.
- Cross-session panes show their session title in the pane toolbar (e.g. `My session · Chat`).
- Focus a pane, then click the top tab (Chat / Trajectory / Terminal) to switch that pane's view.
- Drag the dividers to resize (each side keeps ≥ 10%); panes track the window size.
- Splits are recursive and the layout persists across reloads; the title bar and composer follow the focused pane.
