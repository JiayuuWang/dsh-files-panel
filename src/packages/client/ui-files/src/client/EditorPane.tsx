// EditorPane: a thin CodeMirror mount. The panel owns every business fact
// (content, version, dirty, save, conflict, keymap); this component only turns
// text in and out around one EditorView with the selected keymap. Remounts per
// file/keymap via the panel's key, so a file switch, a conflict reload, or a
// keymap switch gets a fresh document state.

import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import type { Extension } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { html } from '@codemirror/lang-html'
import { css as cssLanguage } from '@codemirror/lang-css'
import { markdown } from '@codemirror/lang-markdown'
import { python } from '@codemirror/lang-python'
import { vim } from '@replit/codemirror-vim'
import { emacs } from '@replit/codemirror-emacs'
import css from './EditorPane.module.css'

/** Editor keymap choice: the plain CodeMirror bindings, vim modal keys, or emacs keys. */
export type EditorKeymap = 'default' | 'vim' | 'emacs'

/** Keymap extensions by choice (the default needs none). */
const KEYMAP_EXTENSIONS: Record<Exclude<EditorKeymap, 'default'>, Extension[]> = {
  vim: [vim()],
  emacs: [emacs()],
}

export interface EditorPaneProps {
  /** Initial document content (a reload remounts via the panel's key). */
  value: string
  /** The file's path/name, used only to pick the syntax-highlighting language. */
  filename?: string
  /** Fires on every document change with the full current text. */
  onChange: (text: string) => void
  /** Which keymap the view binds. */
  keymap?: EditorKeymap
  /** Fires once after the view mounts (diagnostic/test seam). */
  onReady?: (view: EditorView) => void
}

/**
 * Static per-extension language support (imported, not dynamically loaded):
 * the single-file client bundle cannot code-split, so the dynamic
 * `import()` inside `@codemirror/language-data` would emit an unresolvable
 * chunk require. This bounded set covers the common text-file families.
 */
const EXTENSION_LANGUAGES: Record<string, Extension> = {
  js: javascript(),
  jsx: javascript({ jsx: true }),
  ts: javascript({ typescript: true }),
  tsx: javascript({ typescript: true, jsx: true }),
  mjs: javascript(),
  cjs: javascript(),
  json: json(),
  jsonc: json(),
  html: html(),
  htm: html(),
  css: cssLanguage(),
  scss: cssLanguage(),
  less: cssLanguage(),
  md: markdown(),
  mdx: markdown(),
  py: python(),
  pyw: python(),
}

/** Language extension for a filename, or empty when the extension is unknown. */
function languageExtensions(filename: string | undefined): Extension[] {
  if (filename === undefined) return []
  const dot = filename.lastIndexOf('.')
  if (dot <= 0 || dot === filename.length - 1) return []
  const language = EXTENSION_LANGUAGES[filename.slice(dot + 1).toLowerCase()]
  return language === undefined ? [] : [language]
}

/**
 * Mount one CodeMirror editor on the host element.
 * @param props - initial content, change callback, and the bound keymap.
 */
export function EditorPane({ value, filename, onChange, keymap = 'default', onReady }: EditorPaneProps) {
  const host = useRef<HTMLDivElement>(null)
  // Latest-callback refs keep the mount-time effect free of dependency
  // churn: the view is created once, callbacks never go stale.
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useEffect(() => {
    const element = host.current
    /* v8 ignore next -- the host div renders with this component; a null ref requires an unmount race no test can schedule deterministically. */
    if (element === null) return
    const view = new EditorView({
      doc: value,
      extensions: [
        basicSetup,
        EditorView.lineWrapping,
        ...languageExtensions(filename),
        ...(keymap === 'default' ? [] : KEYMAP_EXTENSIONS[keymap]),
        EditorView.updateListener.of(update => {
          if (update.docChanged) onChangeRef.current(update.state.doc.toString())
        }),
      ],
      parent: element,
    })
    onReadyRef.current?.(view)
    return () => { view.destroy() }
    // Mount once per file/keymap: the panel remounts this component (key) on
    // file switch, keymap switch, and conflict reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={host} className={css.host} />
}
