# @deepseek-ai/dsh-client-ui-files

[English](README.md) | 中文

详情面板文件页插件:填充 ui-conversation 的详情面板声明的 `conversation.details.files` 席位,提供当前会话工作区的文件树与可编辑的 CodeMirror 预览。文件树通过 [`files.list`](../../host/apiproxy/README.md) wire 域逐层懒加载(目录在前、`hidden` 行照常显示、截断有标记),预览通过 `files.read` 读取单个文本文件,保存(按钮或 Ctrl/Cmd+S)以面板读取到的版本经 `files.write` 提交——并发编辑会以 `files-stale-version` 使写入失败,面板以冲突横幅呈现并附重新载入操作。编辑器通过工具栏选择器绑定三套键位:CodeMirror 默认键位、vim 模态键(`@replit/codemirror-vim`)与 emacs 键(`@replit/codemirror-emacs`);切换键位会重挂载编辑器并保留当前缓冲。主机把每次保存记为 `user/file-edit` 会话事件,并向会话的智能体排队一条模型可见通知,让模型在下一步得知人类编辑。所有调用都走共享 connection 客户端,因此面板观察到的后端、边界与错误词汇与智能体的文件工具一致。工作区根路径来自标准工作区数据源(其 `sessionIds` 包含当前会话的工作区);未关联工作区的会话显示空状态。所有 wire 错误以 `code: message` 文本呈现——面板不持有策略,只负责展示。

面板不注册 store:展开层级、选中项与编辑器状态是组件私有查看状态,随面板每次按会话重挂载而重置(切换会话时详情面板会关闭)。

## Model Experience

Indirectly, through 主机侧编辑通知:一次保存会排队一条归网关所有、由智能体循环记为普通 user/message 的 `agent.inject()` 上下文消息;本包自身不注册任何面向模型的内容。

#### KV Cache 效果

无;本包既不组装也不发送 provider 请求。

## Known Limitations and Deferred Work

- **CodeMirror 而非 Monaco**——类 vscode 的 Monaco 编辑器需要 worker 管线,而单文件客户端 bundle 架构并不携带;CodeMirror 无需 worker 即可打包。见 workspace-files Agent Note。
- **键位选择按会话重置**——键位选择器是面板私有查看状态,不是持久化偏好。
- **切换文件丢弃未保存编辑**——切换树选中项会替换编辑器缓冲,没有确认提示。
- **目录状态不刷新**——层级只在展开时和根目录「刷新」按钮点击时加载;基于文件监听的失效刷新留待后续。
- **隐藏文件始终显示**——暂无显示/隐藏开关(主机已标记 `hidden`,客户端目前直接渲染)。
- **每次保存都排队一条模型通知**——重复保存会各自注入一条上下文消息;去重留待后续。
