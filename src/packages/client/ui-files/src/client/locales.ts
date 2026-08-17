/** `files` namespace dictionaries: tree controls and preview states. */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'tree.noWorkspace': '当前会话未关联工作区',
  'tree.loading': '加载中…',
  'tree.truncated': '条目过多，仅显示开头部分',
  'tree.refresh': '刷新',
  'tree.directory': '目录 {name}',
  'tree.file': '文件 {name}',
  'preview.selectHint': '选择左侧文件查看内容',
  'preview.loading': '读取中…',
  'preview.failed': '读取失败',
  'editor.save': '保存',
  'editor.saving': '保存中…',
  'editor.dirty': '未保存',
  'editor.conflict': '文件已被其他程序修改。保存会覆盖这些修改,建议重新载入后再编辑。',
  'editor.reload': '重新载入',
  'editor.keymap': '键位',
  'editor.keymap.default': '默认',
  'editor.keymap.vim': 'Vim',
  'editor.keymap.emacs': 'Emacs',
} satisfies Record<string, string>

/** The files namespace key union. */
export type FilesKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'tree.noWorkspace': 'This session has no workspace',
  'tree.loading': 'Loading…',
  'tree.truncated': 'Too many entries; only the beginning is shown',
  'tree.refresh': 'Refresh',
  'tree.directory': 'Directory {name}',
  'tree.file': 'File {name}',
  'preview.selectHint': 'Select a file to view its content',
  'preview.loading': 'Reading…',
  'preview.failed': 'Read failed',
  'editor.save': 'Save',
  'editor.saving': 'Saving…',
  'editor.dirty': 'Unsaved',
  'editor.conflict': 'This file changed elsewhere. Saving would overwrite those changes; reload before editing.',
  'editor.reload': 'Reload',
  'editor.keymap': 'Keymap',
  'editor.keymap.default': 'Default',
  'editor.keymap.vim': 'Vim',
  'editor.keymap.emacs': 'Emacs',
} satisfies Record<FilesKey, string>
