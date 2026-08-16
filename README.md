# dsh-files-panel

DeepSeek Harness Web GUI 文件面板插件:在页面右侧(可伸缩)显示当前工作区文件树,支持审阅与手动编辑文件;编辑器计划支持 Monaco(类似 VS Code)以及 vim/emacs 键位。

**私有开发仓库。** v1 开发基于 deepseek-harness 仓库内插件体系(需随 dsh 构建),设计说明与阶段计划见 [PLAN.md](PLAN.md)。

## 仓库结构

```
patch/      每个检查点的完整 dsh.diff(相对 pinned 的 dsh base commit,含新包)
docs/       设计记录
```

## 如何套用(给别人用)

1. 准备一个 deepseek-harness checkout,checkout 到 `patch/` 中标注的 base commit;
2. 在仓库根执行 `git apply patch/<checkpoint>.dsh.diff`(新包文件也包含在 diff 中);
3. `pnpm install && pnpm run build`,`dsh web` 后刷新页面。

详细步骤随开发推进补充。

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
