# @deepseek-ai/dsh-host-web-terminal-local

[English](README.md) | 中文

[`web-terminal`](../web-terminal/README.zh.md) 接缝的本地 subprocess 后端:每会话一个交互式 PTY,基于 subprocess 终端原语,shell 按宿主平台选择(Windows 用 PowerShell,其余用 bash)。输出以原始字节流进入有界 scrollback(ANSI 转义原样保留),由浏览器 Terminal 视图按游标读取;后端只保留 scrollback 尾部。

宿主显示器上不渲染任何内容;后端只服务 API 网关。每个会话的终端在会话销毁时关闭,服务拆卸时关闭所有活终端。

## Model Experience

None, as the backend serves the GUI host's Terminal view; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **TERM 被 subprocess 终端原语固定为 `dumb`**——shell 不输出彩色、不运行全屏程序;解除需要给 subprocess 接缝加 `termName` 选项。
- **无 PTY resize**——shell 以配置的固定 rows/cols 运行。
