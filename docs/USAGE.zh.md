# 使用说明

本插件给 DeepSeek Harness 的 Web 界面(`dsh web`)增加三项能力:**交互式终端**、**工作区文件浏览器**、**tmux 式分屏**。

## 环境要求

- [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 仓库,checkout 到 base commit `47f943859b`
- Node `^22.19 || >=24`,pnpm

## 安装

```bash
# 在 deepseek-harness 仓库根目录
git apply path/to/dsh-files-panel.patch
pnpm install
pnpm run build
```

从工作区启动(注意**不要**用 `npx`):

```bash
pnpm dsh --profile web
```

打开打印的地址(默认 `http://127.0.0.1:3080`),硬刷新 `Ctrl+F5`。如果之前有正在运行的服务,先重启一次。

## 终端

1. 打开一个会话,点顶部 **「终端 / Terminal」** 标签(在 对话/Chat、Trajectory 旁边)。
2. 会直接启动一个可用 shell——Windows 上是 PowerShell,Linux/macOS 上是 bash。
3. 工具栏提供:
   - **Shell 分段按钮**(默认 / pwsh / cmd / bash / zsh / sh),当前选中高亮;点其他 shell 会用该 shell 重启终端;
   - **重启终端** 按钮,关闭并重新打开 shell。
4. 切换标签再切回,会重连到同一个 shell。分屏出的 Terminal 窗格各自拥有独立的 shell。

## 文件浏览器

1. 点会话头部右上角的 **文件夹图标**。
2. 右侧面板显示工作区文件树,每行带类型图标。
3. 点文件打开,带语法高亮;可编辑,点 **保存 / Save**(或 `Ctrl/Cmd+S`)。版本冲突时会提示重新载入;键位可在 默认 / Vim / Emacs 间切换。
4. 拖动 **目录树与编辑器之间的分隔条**(6px)调整上下两半的大小(每边至少保留 20%)。

## 分屏

每个窗格顶部有一条细工具栏:

| 按钮 | 作用 |
|---|---|
| **⫞** | 向右分割(并排) |
| **⫟** | 向下分割(堆叠) |
| **⛶** | 全屏此窗格(再点退出) |
| **✕** | 关闭此窗格 |

- 分割继承源视图:Trajectory 窗格 → 复制 trajectory;Terminal 窗格 → **新建一个终端**;Chat 窗格 → **新建一个会话**并排显示,两会话可独立对话。
- **每个 Chat 窗格底部都有自己的输入框**,绑定该窗格的会话,大小随窗格动态变化;分屏激活时,底部公共输入框自动隐藏。
- 关闭某个窗格后,其余窗格自动重排、铺满整个网格。
- 跨会话窗格的工具栏会显示会话标题(如 `我的会话 · Chat`)。
- 先点窗格聚焦,再点顶部标签(Chat / Trajectory / Terminal)切换该窗格的视图。
- 拖动分隔条调整大小(每边至少保留 10%);窗格随窗口缩放自适应。
- 分割可递归,布局持久化;标题与输入框跟随当前聚焦的窗格。
