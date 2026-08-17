# @deepseek-ai/dsh-host-workspace-files-fs

[English](README.md) | 中文

[workspace-files 缝](../workspace-files/README.md)的文件系统能力后端:在 `ctx.fs` 之上注册 `ctx.workspaceFiles`,提供单层目录列举、整文件文本读取与受保护的全文件写入。主机显示器上不渲染任何内容,因此该后端同样可服务远程客户端。

行为要点:列举返回**文件与目录**,并携带主机侧判定的 `hidden` 标记(POSIX 点号约定)交由客户端决定是否展示;每个条目路径都是绝对主机路径——客户端从不自行拼接路径段。单次 `list` 最多返回 `maxEntries` 行(配置项,默认 1000——GitHub Web UI 对目录列举采用的界限),名称排序尾部被截断时报告 `truncated: true`。单次 `read` 对达到或超过 `maxReadBytes`(配置项,默认 1 MiB)的文件以 `files-too-large` 拒绝而非返回截断内容,并以 `files-io-error` 拒绝非 UTF-8 内容(fs 后端自身的二进制拒绝)。单次 `write` 原子提交完整内容;提供 `expectedVersion` 时对并发编辑进行守卫(不匹配即 `files-stale-version`),目录目标以 `files-not-file` 失败。失败抛出缝的类型化 `WorkspaceFilesError`。因为读写都经由 `ctx.fs`,面板与智能体自身文件工具看到同一后端、同一沙箱立场与同一新鲜度版本;`FileContent.version` 是受保护写入所用的令牌。

## Model Experience

无——该后端服务于 GUI 主机的文件面板,任何内容都不会进入模型请求。

#### KV Cache 效果

无;本包既不组装也不发送 provider 请求。

## Known Limitations and Deferred Work

- **不读取 Windows 隐藏属性**——Node dirents 不暴露 `FILE_ATTRIBUTE_HIDDEN`,因此在所有平台上 `hidden` 都表示点号前缀,直到原生探测值得其成本。
- **全文件系统范围**——没有按部署划分的浏览根限制;此处的根只是 UX 范围而非安全边界。
- **仅全文件写入**——没有行级编辑或局部替换;面板编辑器保存完整文件。
