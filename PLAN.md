# 实施计划

## 目标

dsh Web GUI 增加一个右侧可伸缩"文件区"面板:显示当前工作区文件树,人类用户可直接审阅、手动编辑文件(记事本级 Monaco 编辑器 + vim/emacs 键位),无需另开外部编辑器。

## 可行性结论(研究结论,已核实代码库)

必须作为 **dsh 仓库内插件包**实现,无法做成仓库外第三方插件:`apiproxy` 的 `RpcMethodMap` 与 session 事件表是仓库内封闭面,外部包无法注册新 RPC 方法或必读会话事件。

已有积木:

- 右侧可伸缩面板:`packages/client/ui-layout` 的 `details` 槽(可拖拽、可折叠)
- 客户端插件体系:`dsh.client` 插件 + `ctx.slots.register` + 三注册面
- 主机文件能力:`packages/fs` 能力缝(fs-local / fs-sandbox / observation policy)
- 主机↔浏览器 RPC 模板:`packages/host/directory-picker` 缝(服务定义 → 网关 wire → 客户端)
- 工作区根目录:`workspace.list`、`useWorkspaces`

缺失:文件内容读写 RPC、编辑器 UI、人类编辑的会话事件、交互式终端(web 无 xterm,`tool-terminal` 仅渲染卡片)。

## 阶段

### 阶段一:面板 + 文件树 + 只读预览

1. 主机能力缝 `workspace-files`(`packages/fs/` 下):Service Definition `ctx.workspaceFiles` + 提供者,`list(path)` / `read(path)`。**全部走 `ctx.fs` 同一通道**,继承沙箱与观察策略;错误码照 directory-picker 的 typed-error→wire 映射。
2. `packages/host/apiproxy/src/api/` 注册 `workspaceFiles.list/read`(zod schema + 错误码闭集)。
3. 客户端包 `packages/client/ui-files`:懒加载文件树(复用 directory-picker-browse 的 hidden/截断经验),注册进 `details` 面板做 **"轨迹 | 文件" tab**(在 ui-conversation 的 DetailsPanel 加 tab 容器 + 新子槽 `conversation.details.files`,不动三栏布局)。
4. 三注册面:`dsh.client` row 进 `packages/bundle/web-app/cordis.patch.yml` + `web-app/package.json` 依赖 + `tsconfig.client.json` aggregate。

### 阶段二:编辑(Monaco)+ 会话集成(核心不变量)

1. 主机加 `write(path, content)`:文本限定 + 大小上限。
2. 客户端接 Monaco(lazy chunk);脏标记、保存、diff 预览。
3. **必做**:新增 `user/file-edit` session 事件(declaration merging 进 `SessionEventMap` + 重生成 `KNOWN_SESSION_EVENT_TYPES`),`deriveMessages` 以 `<system-reminder>` 风格把人类编辑呈现给模型 —— `model-visible ⟺ logged` 不变量。
4. 冲突检测:人类保存 vs 模型 `tool-fs` 编辑的竞态(mtime/hash 比对)。

### 阶段三:vim/emacs

- 3a(推荐,便宜):CodeMirror + 自带 vim/emacs keymap,编辑器本体支持键位。
- 3b(大工程,单独评估):真交互式终端 = 主机 PTY 代理(复用 terminal-bash 持久会话)+ WebSocket 终端通道 + xterm 前端。全新能力缝与信任面,独立 PR 栈,不进默认。

## 关键设计决策

| 决策点 | 结论 |
|---|---|
| 面板挂载 | details 面板内 tab,不动三栏布局 |
| 文件通道 | 走 `ctx.fs`(fs-local + fs-sandbox + observation policy),不另开门 |
| RPC | apiproxy `RpcMethodMap` + zod + 错误码闭集,照 directory-picker 缝 |
| 会话事件 | `user/file-edit` + deriveMessages 呈现 |
| 编辑器 | Monaco;vim/emacs 用 CodeMirror keymap;真 PTY 独立评估 |
| 注册面 | dsh.client row / web-app package.json 依赖 / tsconfig.client.json aggregate |

## 风险

- 模型与人类同时改文件的竞态 → 保存冲突检测
- 人类编辑 diff 进 session 日志的体积 → 截断/摘要策略
- 非 loopback 部署无认证层,文件面板暴露工作区内容 → 远程部署需标注
- Monaco 打包体积 → 懒加载 chunk
- 测试门:test:gui / test:web / 覆盖率 100% / 快照

## 检查点节奏

- [x] **C1(2026-08-16)**:workspace-files 缝 + wire + 测试
  - 新包 `packages/host/workspace-files`(Service Definition)+ `packages/host/workspace-files-fs`(ctx.fs 后端)
  - apiproxy `files` 域(`files.list` / `files.read`)+ 6 个封闭错误码 + handler/client/fixture 全链
  - web-app bundle 挂载行、tsconfig 注册面、Agent Note(`2026-08-16-workspace-files-capability-seam`)
  - 验证:17 个新测试 + 524 个受影响套件全绿、repo typecheck、每文件 100% 覆盖率、cordis/config/note/README/pairing 门禁全过
- [x] **C2(2026-08-16)**:ui-files 面板 + 文件树只读
  - ui-conversation 的 details 面板加「工具 | 文件」双 tab(新子槽 `conversation.details.files`,布局零改动)
  - 新包 `packages/client/ui-files`(dsh.client):工作区根解析(useWorkspaces)→ `files.list` 懒加载树(目录在前/截断标记)→ `files.read` 只读预览;不注册 store,直接驱动 `ctx.connection.api`
  - wire 类型出口链:connection/client api.ts + index.ts + remotes/client 增加 FileEntry/FileListing/FileContent
  - 验证:14 个新测试 + 受影响面 539 全绿、repo typecheck、每文件 100% 覆盖率、client-catalog/slot-catalog 重生成、全部门禁过;test:gui 的 2 个动态导入计时测试为机器负载抖动(隔离复跑 105/105 通过)
- [x] **C3(2026-08-16)**:编辑保存 + `user/file-edit` 会话事件
  - 缝新增 `write(path, content, expectedVersion?)`:`ctx.fs.writeText` + `replaceIfVersion` 守卫,`files-stale-version` 错误码
  - wire `files.write`(sessionId + path + content + expectedVersion);`user/file-edit` 事件(declare module `@deepseek-ai/dsh-session/types`)进 KNOWN_SESSION_EVENT_TYPES + persistence-catalog
  - 模型可见性:`agent.inject()` system-reminder 通知(下次 pre-step 认领并记为 user/message)——model-visible ⟺ logged
  - 编辑器:**CodeMirror 替代 Monaco**(单文件 client bundle 无 worker 管线,Agent Note 记录该取舍);保存按钮/Ctrl+S、脏标记、`files-stale-version` 冲突横幅 + 重新载入
  - 验证:主机 31 + 客户端 25 新测试,受影响面 430 全绿、repo typecheck、双树每文件 100% 覆盖、persistence/doc-graphs/cordis 目录重生成、全门禁过;test:gui 的 3 个时序测试为机器负载抖动(隔离 42/42 通过)
- [x] **C4(2026-08-16)**:vim/emacs keymap(最终检查点)
  - EditorPane 增加 `keymap` prop:`@replit/codemirror-vim` / `@replit/codemirror-emacs` 扩展组合;默认键位零额外扩展
  - FilesPanel 工具栏键位选择器(默认 | Vim | Emacs);切换键位重挂载编辑器并保留缓冲与脏状态;键位是面板私有查看状态(按会话重置)
  - 验证:ui-files 28/28 + 受影响面 556 全绿、repo typecheck、每文件 100% 覆盖、note/README/pairing 门禁过;test:gui 3 个时序测试为机器负载抖动(隔离 53/53 通过)
- [ ] (可选)真交互式终端:独立评估,不在本目标范围
