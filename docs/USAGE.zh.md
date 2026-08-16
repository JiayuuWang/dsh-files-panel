# dsh-files-panel — 使用指南

本插件给 DeepSeek Harness 的 Web GUI(`dsh web` 页面)加了三项能力:

1. **Terminal 标签**——每会话一个交互式 shell(Windows 用 PowerShell,其余用 bash),与 Chat、Trajectory 并列。
2. **文件资源管理器**——右上角开关,打开工作区文件树,带类型图标和语法高亮编辑器。
3. **分屏**——tmux 式布局:Chat / Trajectory / Terminal 可向右/向下分割、单窗格全屏、拖动分隔条调整大小。

插件**不是**独立可 npm 安装的包,而是 `deepseek-harness` 单仓库里的一组包,这里以**累积 git 补丁**的形式分发(每个里程碑一个,每个都包含之前所有里程碑)。在干净的 `deepseek-harness` checkout 上应用**最新**补丁,然后构建即可。

---

## 1. 前置条件

- Node.js `^22.19` 或 `>=24`,以及 `pnpm`(v11)。
- 一份 [`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness) 的 checkout,checkout 到固定的 base commit **`47f943859b`**。
- (可选)`DEEPSEEK_API_KEY`,用于真正运行 agent;UI 和上面三项功能不依赖它也能用。

## 2. 安装(应用补丁)

在 `deepseek-harness` 仓库根目录、base commit `47f943859b` 上:

```bash
git apply ../dsh-files-panel/patch/c10-persist-key-fix.dsh.diff
pnpm install
pnpm run build
```

> 用**最新**检查点补丁(`c10-…`)即可。它是累积的:已含 C1–C9,无需逐个应用早期补丁。(早期 `c1…c9` 文件仅作为里程碑历史保留。)

## 3. 运行

在 `deepseek-harness` 仓库根目录:

```bash
pnpm dsh --profile web
```

打开打印出的 URL(通常是 `http://127.0.0.1:3080`),然后**硬刷新**(`Ctrl+F5`)。

> **重点:** 用工作区启动器 `pnpm dsh --profile web`,**不要**用 `npx @deepseek-ai/dsh web`。`npx` 形式服务的是 npm 缓存里的**已发布**快照,不含本插件的改动。

## 4. 使用各项功能

### 4.1 Terminal 标签

1. 打开(或新建)一个会话。
2. 在头部点击 **终端 / Terminal** 标签(在 对话/Chat 和 Trajectory 旁边)。
3. 直接输入 shell 命令。Windows 上是 PowerShell,Linux/macOS 上是 bash。
4. 切到别的标签再切回来会**保留同一个 shell**(重挂载);**重启终端 / Restart terminal** 按钮关闭并重开一个新 shell。

### 4.2 文件资源管理器

1. 点击会话头部右上角的 **文件夹图标**(「Toggle file explorer」按钮)。
2. 右侧 details 列打开到 **文件 / Files** 标签,显示当前工作区的文件树。
3. 点目录展开,点文件打开。文件带**语法高亮**;每行有类型图标(code / json / markdown / image / …)。
4. 在编辑器里改文件后点 **保存 / Save**(或 `Ctrl/Cmd+S`)。若文件在别处被改过,会出现冲突横幅,提供 **重新载入 / Reload**。键位下拉可切换 默认 / Vim / Emacs。

### 4.3 分屏

1. 每个窗格有一条细的 chrome 栏,四个按钮:
   - **⫞** —— 向右分割(并排)
   - **⫟** —— 向下分割(堆叠)
   - **⛶** —— 全屏此窗格(再点一次退出)
   - **✕** —— 关闭此窗格
2. 分割会新建一个窗格(默认从 Chat 开始)。切换某窗格的视图:先点它(聚焦),再点头部标签(Chat / Trajectory / Terminal)——头部标签作用于**聚焦**的窗格。
3. 拖动两个窗格之间的分隔条来调整大小;每边至少保留 10%。
4. 分割是**递归**的——任何窗格都能再分,每个窗格都能独立全屏。布局按会话持久化。

---

## 5. 已知限制

- 终端是轮询式输出(约 60ms)而非流式;尺寸固定,并继承 subprocess 层的 `TERM=dumb`(无彩色/全屏程序)。
- 每会话一个终端。
- 同一视图的多个分屏共享该视图状态(例如两个 Chat 窗格共享草稿/选中)。
- 文件树与终端仅面向人:它们显示的内容不会注入到模型中。

## 6. 里程碑(检查点)

| 检查点 | 内容 |
|---|---|
| C1 | `workspace-files` 能力缝 + `files` wire 域 |
| C2 | 文件面板(details「工具 / 文件」tab、文件树、只读预览) |
| C3 | CodeMirror 编辑保存 + 冲突检测 + `user/file-edit` 会话事件 |
| C4 | vim / emacs 键位 |
| C5 | 详情面板打开入口(工具行「详情」药丸) |
| C6 | Terminal 标签(`web-terminal` 缝 + `terminal` wire + xterm.js) |
| C7 | 资源管理器开关 + 文件图标 + 语法高亮 |
| C8 | tmux 式分屏 |
| C9 | 分屏布局修复(视图自持滚动) |

每个补丁都从 base commit 累积;只需应用最新的那个。
