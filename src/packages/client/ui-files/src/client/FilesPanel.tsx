// FilesPanel: the details panel's files tab — the session workspace's file
// tree with lazy level loading plus an editable preview of the selected text
// file. All data arrives through the injected files.* callbacks; the only
// component-private state is viewing state (expanded levels, selection,
// editor buffer, save/conflict state), which is allowed to reset with the
// panel's per-session remount.

import { useEffect, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import clsx from 'clsx'
import type { FileEntry, RpcError, SessionId } from '@deepseek-ai/dsh-api-remotes/client'
import type { FilesPanelProps } from './contract.ts'
import { EditorPane } from './EditorPane.tsx'
import type { EditorKeymap } from './EditorPane.tsx'
import { FileIcon, fileIconKind } from './FileIcon.tsx'
import css from './FilesPanel.module.css'

/** One loaded tree level: settled entries, null entries while loading. */
interface Level {
  entries: FileEntry[] | null
  truncated: boolean
  error: string | null
}

function loadingLevel(): Level {
  return { entries: null, truncated: false, error: null }
}

function errorLevel(message: string): Level {
  return { entries: [], truncated: false, error: message }
}

/** RpcError display text: the code names the kind, the message the detail. */
function errorText(error: RpcError): string {
  return `${error.code}: ${error.message}`
}

/**
 * Display order: directories first, then files, each keeping the backend's
 * name-sorted order within its group.
 * @param entries - one settled listing level.
 * @returns the same rows split into the two display groups.
 */
export function partitionEntries(entries: readonly FileEntry[]): { directories: FileEntry[]; files: FileEntry[] } {
  const directories: FileEntry[] = []
  const files: FileEntry[] = []
  for (const entry of entries) {
    (entry.type === 'directory' ? directories : files).push(entry)
  }
  return { directories, files }
}

/** Indent depth per nesting level, in px. */
const INDENT = 14

export function FilesPanel({ sessionId, useWorkspaces, listDirectory, readFile, writeFile, t }: FilesPanelProps) {
  const rootPath = useWorkspaces(list => list.items.find(workspace => workspace.sessionIds.includes(sessionId))?.path ?? null)
  const [levels, setLevels] = useState<Record<string, Level>>({})
  const [expanded, setExpanded] = useState<Record<string, true>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [version, setVersion] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)
  // Editor remount generation: bumped on every successful open/reload so a
  // conflict reload gets a fresh document state even for the same path (the
  // EditorPane is mount-once per key).
  const [generation, setGeneration] = useState(0)
  // Keymap choice is panel-private viewing state (resets per session); the
  // editor remounts on switch, keeping the current buffer.
  const [keymap, setKeymap] = useState<EditorKeymap>('default')

  const loadLevel = async (path: string): Promise<void> => {
    setLevels(prev => ({ ...prev, [path]: loadingLevel() }))
    const response = await listDirectory(path)
    if (!response.result.ok) {
      // Hoisted out of the setState closure: property-access narrowing does
      // not cross the callback boundary.
      const message = errorText(response.result.error)
      setLevels(prev => ({ ...prev, [path]: errorLevel(message) }))
      return
    }
    const value = response.result.value
    setLevels(prev => ({ ...prev, [path]: { entries: value.entries, truncated: value.truncated, error: null } }))
  }

  // Load the workspace root when it first resolves; the panel remounts per
  // session, so this runs once per opened session.
  useEffect(() => {
    if (rootPath !== null) void loadLevel(rootPath)
    // Root path is the only external fact this effect depends on; the
    // callback pair is stable per registration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootPath])

  const toggle = (path: string): void => {
    if (expanded[path] === true) {
      setExpanded(prev => {
        const next = { ...prev }
        delete next[path]
        return next
      })
      return
    }
    if (levels[path] === undefined) void loadLevel(path)
    setExpanded(prev => ({ ...prev, [path]: true }))
  }

  const openFile = async (path: string): Promise<void> => {
    setSelected(path)
    setPreview(null)
    setVersion(null)
    setDirty(false)
    setSaving(false)
    setSaveError(null)
    setConflict(false)
    setPreviewError(null)
    setPreviewLoading(true)
    const response = await readFile(path)
    setPreviewLoading(false)
    if (!response.result.ok) {
      setPreviewError(errorText(response.result.error))
      return
    }
    setPreview(response.result.value.content)
    setVersion(response.result.value.version)
    setGeneration(previous => previous + 1)
  }

  const save = async (): Promise<void> => {
    if (saving) return
    /* v8 ignore next -- preview/selected/version move together: openFile sets all three and nothing clears them while a file is open, so an independently-null combination is an unreachable defensive arm. */
    if (preview === null || selected === null || version === null) return
    setSaving(true)
    setSaveError(null)
    const response = await writeFile({
      sessionId: sessionId as SessionId,
      path: selected,
      content: preview,
      expectedVersion: version,
    })
    setSaving(false)
    if (!response.result.ok) {
      if (response.result.error.code === 'files-stale-version') setConflict(true)
      setSaveError(errorText(response.result.error))
      return
    }
    setVersion(response.result.value.version)
    setDirty(false)
  }

  const reload = async (): Promise<void> => {
    /* v8 ignore next -- the reload affordance renders only while a file is selected; a null selection here is an unreachable defensive arm. */
    if (selected === null) return
    await openFile(selected)
  }

  const onPreviewKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault()
      void save()
    }
  }

  const rowIndent = (depth: number): { paddingLeft: number } => ({ paddingLeft: 12 + depth * INDENT })

  const renderLevel = (entries: FileEntry[], depth: number): ReactNode[] => {
    const { directories, files } = partitionEntries(entries)
    const rows: ReactNode[] = []
    const pushChildren = (entry: FileEntry): void => {
      const level = levels[entry.path]
      if (level === undefined || (level.entries === null && level.error === null)) {
        rows.push(<div key={`${entry.path}-loading`} className={css.note} style={rowIndent(depth + 1)}>{t('tree.loading')}</div>)
        return
      }
      if (level.error !== null) {
        rows.push(<div key={`${entry.path}-error`} className={css.error} style={rowIndent(depth + 1)}>{level.error}</div>)
        return
      }
      if (level.entries !== null && level.entries.length > 0) {
        rows.push(...renderLevel(level.entries, depth + 1))
      }
    }
    for (const entry of directories) {
      const isExpanded = expanded[entry.path] === true
      rows.push(
        <button
          key={entry.path} type="button" className={css.row} style={rowIndent(depth)}
          aria-label={t('tree.directory', { name: entry.name })} aria-expanded={isExpanded}
          onClick={() => { toggle(entry.path) }}
        >
          <span className={css.chevron} data-open={isExpanded || undefined} aria-hidden>▸</span>
          <span className={css.icon}><FileIcon kind="folder" /></span>
          {entry.name}
        </button>,
      )
      if (isExpanded) pushChildren(entry)
    }
    for (const entry of files) {
      rows.push(
        <button
          key={entry.path} type="button" className={clsx(css.row, css.fileRow)} style={rowIndent(depth)}
          data-selected={selected === entry.path || undefined}
          aria-label={t('tree.file', { name: entry.name })}
          onClick={() => { void openFile(entry.path) }}
        >
          <span className={css.icon}><FileIcon kind={fileIconKind(entry.name, entry.type)} /></span>
          {entry.name}
        </button>,
      )
    }
    return rows
  }

  if (rootPath === null) return <div className={css.empty}>{t('tree.noWorkspace')}</div>

  const rootLevel = levels[rootPath]
  const treeBody = (): ReactNode => {
    if (rootLevel === undefined) return <div className={css.note}>{t('tree.loading')}</div>
    if (rootLevel.error !== null) return <div className={css.error}>{rootLevel.error}</div>
    if (rootLevel.entries === null) return <div className={css.note}>{t('tree.loading')}</div>
    const rows = renderLevel(rootLevel.entries, 0)
    if (rootLevel.truncated) rows.unshift(<div key="truncated" className={css.note}>{t('tree.truncated')}</div>)
    return rows
  }

  return (
    <div className={css.root}>
      <div className={css.tree}>
        <div className={css.treeHeader}>
          <span className={css.treeTitle}>{rootPath}</span>
          <button type="button" className={css.refresh} onClick={() => { void loadLevel(rootPath) }}>{t('tree.refresh')}</button>
        </div>
        <div className={css.treeBody}>{treeBody()}</div>
      </div>
      <div className={css.preview} onKeyDown={onPreviewKeyDown}>
        {selected !== null && preview !== null
          ? (
            <>
              <div className={css.previewHeader}>
                <span className={css.previewPath}>{selected}</span>
                <span className={css.toolbar}>
                  {dirty && <span className={css.dirty}>{t('editor.dirty')}</span>}
                  <label className={css.keymapLabel}>
                    {t('editor.keymap')}
                    <select
                      className={css.keymap} value={keymap} aria-label={t('editor.keymap')}
                      onChange={event => { setKeymap(event.target.value as EditorKeymap) }}
                    >
                      <option value="default">{t('editor.keymap.default')}</option>
                      <option value="vim">{t('editor.keymap.vim')}</option>
                      <option value="emacs">{t('editor.keymap.emacs')}</option>
                    </select>
                  </label>
                  <button
                    type="button" className={css.refresh} disabled={!dirty || saving}
                    onClick={() => { void save() }}
                  >
                    {saving ? t('editor.saving') : t('editor.save')}
                  </button>
                </span>
              </div>
              {conflict
                ? (
                  <div className={css.error}>
                    {t('editor.conflict')}
                    <button type="button" className={css.inlineAction} onClick={() => { void reload() }}>{t('editor.reload')}</button>
                  </div>
                )
                : null}
              {saveError !== null && !conflict
                ? <div className={css.error}>{saveError}</div>
                : null}
              <EditorPane
                key={`${selected}:${generation}:${keymap}`}
                value={preview}
                filename={selected}
                keymap={keymap}
                onChange={text => {
                  setPreview(text)
                  setDirty(true)
                }}
              />
            </>
          )
          : previewError !== null
            ? <div className={css.error}>{previewError}</div>
            : previewLoading
              ? <div className={css.note}>{t('preview.loading')}</div>
              : <div className={css.empty}>{t('preview.selectHint')}</div>}
      </div>
    </div>
  )
}
