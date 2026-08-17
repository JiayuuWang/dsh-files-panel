# @deepseek-ai/dsh-host-workspace-files

[English](README.md) | 中文

`ctx.workspaceFiles` 能力缝的 Service Definition:为 Web GUI 的文件面板提供工作区文件访问。该缝只有一种交互形态,因此服务以方法而非能力联合暴露:`list` 报告一层目录(仅元数据),`read` 返回一个普通文本文件的完整内容,`write` 提交一次全文件写入。

每次调用都接收绝对主机路径(客户端从不自行拼接路径段),并返回面向 UI 的展示路径。失败走封闭的 `WorkspaceFilesError` 词汇表(`files-not-found` / `files-not-directory` / `files-not-file` / `files-too-large` / `files-stale-version` / `files-permission-denied` / `files-io-error`),API 网关将其 1:1 镜像为 wire 错误码。[`-fs`](../workspace-files-fs/README.md) 后端在文件系统能力(`ctx.fs`)之上实现本包,因此读写都能看到与工具层相同的类型化错误与新鲜度版本;`FileContent.version` 是受保护写入用作期望版本的新鲜度令牌,守卫不匹配时以 `files-stale-version` 失败,而不是覆盖并发编辑。

## Model Experience

无——该缝服务于 GUI 主机的文件面板,任何内容都不会进入模型请求。

#### KV Cache 效果

无;本包既不组装也不发送 provider 请求。

## Known Limitations and Deferred Work

- **全文件系统范围**——没有按部署划分的浏览根限制;此处的根只是 UX 范围而非安全边界(与 directory-picker 缝立场一致)。
- **仅全文件写入**——没有行级编辑或局部替换;面板编辑器保存完整文件。
