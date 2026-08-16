# dsh-files-panel

DeepSeek Harness Web GUI 插件:给 `dsh web` 页面加三项能力——**交互式 Terminal 标签页**、**文件资源管理器(树 + 图标 + 语法高亮编辑)**、**tmux 式分屏**。

**私有开发仓库。** v1 开发基于 deepseek-harness 仓库内插件体系(需随 dsh 构建)。

> **使用说明(重点):** 详细的中英文安装/使用步骤见 **[docs/USAGE.md](docs/USAGE.md)**(中文见 [docs/USAGE.zh.md](docs/USAGE.zh.md))。

## 仓库结构

```
patch/      每个检查点的完整 dsh.diff(相对 pinned 的 dsh base commit,含新包;最新一个即全部)
docs/       中英文使用指南(USAGE.md / USAGE.zh.md)与设计记录
```

## 如何套用(给别人用)

1. 准备一个 deepseek-harness checkout,checkout 到 `patch/` 中标注的 base commit(`47f943859b`);
2. 在仓库根执行 `git apply patch/<最新检查点>.dsh.diff`(新包文件也包含在 diff 中);
3. `pnpm install && pnpm run build`,然后用 `pnpm dsh --profile web` 启动并刷新页面(**不要**用 `npx @deepseek-ai/dsh web`)。

详细步骤见 [docs/USAGE.zh.md](docs/USAGE.zh.md)。

## 检查点

| 检查点 | base commit | 补丁 | 内容 |
|---|---|---|---|
| C1 | `47f943859b` (master) | [patch/c1-workspace-files-seam.dsh.diff](patch/c1-workspace-files-seam.dsh.diff) | workspace-files 能力缝 + files wire 域 + 测试与门禁 |
| C2 | `47f943859b` (master) | [patch/c2-files-panel-and-wire.dsh.diff](patch/c2-files-panel-and-wire.dsh.diff) | ui-files 文件面板(details 双 tab + 文件树 + 只读预览) |
| C3 | `47f943859b` (master) | [patch/c3-edit-save-and-session-event.dsh.diff](patch/c3-edit-save-and-session-event.dsh.diff) | CodeMirror 编辑保存 + 冲突检测 + `user/file-edit` 会话事件 |
| C4 | `47f943859b` (master) | [patch/c4-vim-emacs-keymaps.dsh.diff](patch/c4-vim-emacs-keymaps.dsh.diff) | vim / emacs 键位切换 |
| C5 | `47f943859b` (master) | [patch/c5-details-open-affordance.dsh.diff](patch/c5-details-open-affordance.dsh.diff) | **最终累积补丁(含 C1~C4)**:补上详情面板打开入口(工具行「详情」药丸 → 面板) |
| C6 | `47f943859b` (master) | [patch/c6-terminal.dsh.diff](patch/c6-terminal.dsh.diff) | **累积补丁(含 C1~C5)**:Terminal 标签页(web-terminal 能力缝 + `terminal.*` wire 域 + xterm.js 客户端,平台自适应 pwsh/bash) |
| C7 | `47f943859b` (master) | [patch/c7-explorer-toggle-icons-highlight.dsh.diff](patch/c7-explorer-toggle-icons-highlight.dsh.diff) | **累积补丁(含 C1~C6)**:右上角 Toggle explorer 按钮 + 文件树单色图标 + CodeMirror 语法高亮 |
| C8 | `47f943859b` (master) | [patch/c8-split-pane-view-layout.dsh.diff](patch/c8-split-pane-view-layout.dsh.diff) | **累积补丁(含 C1~C7)**:tmux 式分屏——递归 pane 树(split right/down)、每 pane 全屏、可拖分隔条 |
| C9 | `47f943859b` (master) | [patch/c9-pane-layout-fix.dsh.diff](patch/c9-pane-layout-fix.dsh.diff) | **累积补丁(含 C1~C8)**:修复分屏下对话被压缩/输入框置顶——视图改为自持滚动 | 
| C10 | `47f943859b` (master) | [patch/c10-persist-key-fix.dsh.diff](patch/c10-persist-key-fix.dsh.diff) | **累积补丁(含 C1~C9)**:真正的根因修复——本地持久化 key 从 `dsh.conversation.chat` 升到 `.v2`,丢弃旧结构坏数据,修复「硬刷新/重启仍不生效」 |
| C11 | `47f943859b` (master) | [patch/c11-pane-terminal-fixes.dsh.diff](patch/c11-pane-terminal-fixes.dsh.diff) | **累积补丁(含 C1~C10)**:分屏自适应+可拖拽(flex 修复)、终端 Shell 选择(pwsh/cmd/bash/zsh/sh)、每窗格独立终端、分屏继承源视图(Trajectory/终端) |
| C12 | `47f943859b` (master) | [patch/c12-cross-session-panes.dsh.diff](patch/c12-cross-session-panes.dsh.diff) | **累积补丁(含 C1~C11,最新)**:跨会话分屏——Chat 窗格 split 等同于 New Session,两会话并排,分屏布局全局持久化,标题/输入框跟随聚焦窗格 |

## 状态

- [x] 规划完成(阶段一~三)
- [x] 阶段一(主机侧 C1):workspace-files 能力缝 + files wire(`files.list` / `files.read`)
- [x] 阶段一(客户端 C2):ui-files 面板(details 面板「工具 | 文件」tab)+ 文件树 + 只读预览
- [x] 阶段二(C3):`files.write` + CodeMirror 编辑保存 + 冲突检测 + `user/file-edit` 会话事件与模型通知
- [x] 阶段三(C4):vim / emacs 键位(CodeMirror keymap,工具栏切换,保留缓冲)
- [x] 修复(C5):详情面板打开入口——工具行展开后点「详情」药丸打开面板(修复面板无入口无法体验的问题)
- [x] Terminal(C6):交互式终端标签页(与 Chat/Trajectory 并列)——web-terminal 能力缝 + `terminal.*` wire 域 + xterm.js 客户端;平台自适应 pwsh/bash;轮询式读取、切标签重挂载、重启按钮
- [x] Explorer(C7):右上角 Toggle explorer 按钮 + 文件树单色图标 + CodeMirror 语法高亮(按文件名探测语言)
- [x] 分屏(C8):tmux 式分屏——递归 pane 树(split right/down)、每 pane 全屏/关闭、分隔条可拖动;头部标签环作用于聚焦 pane;布局按会话持久化
- [x] 修复(C9):分屏布局——对话被压缩、输入框置顶的问题(视图改为自持滚动,复用「composer overlay」模型)
- [x] 修复(C10):真正的根因——本地持久化 key 升到 `.v2` 丢弃旧结构坏数据(旧状态缺 `panes` 字段导致 PaneTree 崩溃,只剩输入框)
- [x] 修复(C11):分屏自适应+可拖拽(flex-basis 修复)、终端 Shell 选择、每窗格独立终端(terminalId 键控)、分屏继承源视图(Trajectory→trajectory、Terminal→新终端)
- [x] 跨会话分屏(C12):Chat 窗格 split → New Session(新建会话并排),分屏布局全局持久化,标题/输入框跟随聚焦窗格(框架新增 `provideInfoOf` + `SessionBoundary`)
