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
| C3 | `47f943859b` (master) | [patch/c3-edit-save-and-session-event.dsh.diff](patch/c3-edit-save-and-session-event.dsh.diff) | **累积补丁(含 C1+C2)**:CodeMirror 编辑保存 + 冲突检测 + `user/file-edit` 会话事件 |

## 状态

- [x] 规划完成(阶段一~三)
- [x] 阶段一(主机侧 C1):workspace-files 能力缝 + files wire(`files.list` / `files.read`)
- [x] 阶段一(客户端 C2):ui-files 面板(details 面板「工具 | 文件」tab)+ 文件树 + 只读预览
- [x] 阶段二(C3):`files.write` + CodeMirror 编辑保存(按钮 / Ctrl+S)+ 版本守卫冲突检测 + `user/file-edit` 会话事件与模型通知(agent.inject)
- [ ] 阶段三:vim/emacs 键位(CodeMirror keymap);真交互式终端(可选,独立评估)
