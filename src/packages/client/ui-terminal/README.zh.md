# @deepseek-ai/dsh-client-ui-terminal

[English](README.md) | 中文

向会话视图环贡献 Terminal 标签(与 Chat/Trajectory 并列)的浏览器插件。它用 xterm.js 渲染每会话一个的交互式 PTY,驱动 `terminal.*` wire 域:挂载时打开(或重挂载)会话终端、用保留 scrollback 播种模拟器、短周期轮询 `terminal.read`、经 `terminal.write` 转发按键。宿主终端跨视图切换保持存活——卸载只销毁模拟器,故切标签即重挂到同一 shell;重启按钮关闭再重开。

## Model Experience

None, as the terminal is a human-facing surface; its input and output never reach a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **轮询传输**——输出按短周期读取而非经 mux 流式推送;流式是后续升级。
- **固定尺寸**——模拟器匹配宿主终端固定 rows/cols;resize/refit 随 PTY resize 工作一并推迟。
