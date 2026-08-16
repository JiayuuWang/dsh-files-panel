# dsh-files-panel

DeepSeek Harness Web GUI 文件面板插件:在页面右侧(可伸缩)显示当前工作区文件树,支持审阅与手动编辑文件;编辑器计划支持 Monaco(类似 VS Code)以及 vim/emacs 键位。

**私有开发仓库。** v1 开发基于 deepseek-harness 仓库内插件体系(需随 dsh 构建),设计说明与阶段计划见 [PLAN.md](PLAN.md)。

## 仓库结构

```
packages/   插件包源码,与 dsh checkout 内同名目录同步
  workspace-files/   (规划) 主机能力缝:文件列表 / 读取 / 写入
  ui-files/          (规划) 客户端面板:文件树 + 编辑器
patch/      每个检查点的 dsh.diff(相对 pinned 的 dsh base commit)
docs/       设计记录
```

## 如何套用(给别人用)

1. 准备一个 deepseek-harness checkout,checkout 到 `patch/` 中标注的 base commit;
2. 把 `packages/` 下各包放到 dsh 对应位置(`packages/fs/workspace-files`、`packages/client/ui-files`);
3. 应用 `patch/` 里的 diff(仓库内三注册面、session 事件等改动);
4. `pnpm install && pnpm run build`,`dsh web` 后刷新页面。

详细步骤随开发推进补充。

## 状态

- [x] 规划完成(阶段一~三)
- [ ] 阶段一:workspace-files 主机能力缝 + wire
- [ ] 阶段一:ui-files 面板 + 文件树 + 只读预览
- [ ] 阶段二:Monaco 编辑 + 保存 + `user/file-edit` 会话事件
- [ ] 阶段三:vim/emacs 键位(CodeMirror keymap);真交互式终端(可选,独立评估)
