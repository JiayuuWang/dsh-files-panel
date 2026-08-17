# @deepseek-ai/dsh-host-web-terminal

[English](README.md) | 中文

`ctx.webTerminals` 能力接缝的服务定义:面向 Web GUI Terminal 视图的、每会话一个的交互式终端。每个会话最多一个终端,以 `SessionId` 为键。接缝是轮询式——输出保留在有界 scrollback 中按不透明游标读取,输入即发即忘——区别于面向模型的 `@deepseek-ai/dsh-terminal` 注册表(其 `startSend` 要等提示符)。

[`-local`](../web-terminal-local/README.zh.md) 后端基于 subprocess 终端原语实现本包,按宿主平台选择 shell(Windows 用 PowerShell,其余用 bash)。API 网关把接缝词汇镜像到 `terminal.*` wire 域,并在会话销毁时关闭终端。

## Model Experience

None, as the seam serves the GUI host's Terminal view; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **固定终端尺寸**——不支持 PTY resize;shell 以固定 rows/cols 启动,浏览器模拟器与之匹配。
- **每会话一个终端**——每会话多终端(供分屏视图)留待后续。
