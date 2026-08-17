/** Monochrome file-tree glyphs keyed by entry type and file extension. */

/** Icon vocabulary: one shape per recognizable file family plus generic fallbacks. */
export type FileIconKind =
  | 'folder' | 'code' | 'json' | 'markdown' | 'html' | 'css' | 'image' | 'config' | 'text' | 'file'

const EXTENSION_KINDS: Record<string, FileIconKind> = {
  js: 'code', jsx: 'code', ts: 'code', tsx: 'code', mjs: 'code', cjs: 'code',
  json: 'json', jsonc: 'json', jsonl: 'json',
  md: 'markdown', mdx: 'markdown', markdown: 'markdown',
  html: 'html', htm: 'html', vue: 'html', svelte: 'html', astro: 'html',
  css: 'css', scss: 'css', less: 'css',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', svg: 'image', webp: 'image', ico: 'image',
  yml: 'config', yaml: 'config', toml: 'config', ini: 'config', conf: 'config',
  txt: 'text', log: 'text', text: 'text',
}

/**
 * Classify one tree entry by its extension (directories and other non-files
 * collapse to `folder`).
 * @param name - the entry's base name.
 * @param type - the entry's wire type.
 * @returns the icon kind for the row.
 */
export function fileIconKind(name: string, type: 'file' | 'directory' | 'other'): FileIconKind {
  if (type !== 'file') return 'folder'
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot === name.length - 1) return 'file'
  return EXTENSION_KINDS[name.slice(dot + 1).toLowerCase()] ?? 'file'
}

/** Paths for one icon kind, drawn in a 16×16 viewBox with `currentColor` strokes. */
const PATHS: Record<FileIconKind, string[]> = {
  folder: ['M1.5 3.5h4l1.5 1.5h7.5v7.5a1 1 0 0 1-1 1.5h-11a1 1 0 0 1-1-1.5z'],
  code: ['M6 5 2.5 8 6 11', 'M10 5 13.5 8 10 11'],
  json: ['M6 4.5c-1.5 0-2.5.5-2.5 1.5v2c0 .8-.6 1-1.5 1 .9 0 1.5.2 1.5 1v2c0 1 1 1.5 2.5 1.5', 'M10 4.5c1.5 0 2.5.5 2.5 1.5v2c0 .8.6 1 1.5 1-.9 0-1.5.2-1.5 1v2c0 1-1 1.5-2.5 1.5'],
  markdown: ['M2.5 4.5v7', 'M2.5 6.5l2 2 2-2', 'M2.5 8.5l2 2 2-2', 'M10.5 4.5v7h2l-3 2.5L6.5 11.5h2v-7z'],
  html: ['M3 4.5l1.5 7L8 12.5l3.5-1 1.5-7', 'M5.5 6.5h5', 'M5.5 8.5h5'],
  css: ['M8 2.5 3 4.5l1 9L8 15.5l4-2 1-9z', 'M6.5 6.5h3v1.5h-1.5v1.5H9.5v-1.5h3v1.5l-.5 3L8 12v-1.5h1.5'],
  image: ['M2 3.5h12v9H2z', 'M5 6.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2', 'M2 12.5l3.5-3.5 3 3 2-2 3.5 3.5'],
  config: ['M8 1.5l1.3 1.6 2-.3.7 1.9-1.5 1.4v1.8L12 9.3l.7 1.9-2 .3L9.4 13.5 8 12.4l-1.4 1.1-1.3-1.8-2 .3-.7-1.9L4 8.7V6.9L2.6 5.5l.7-1.9 2 .3L6.6 2.1 8 3.5z', 'M8 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3'],
  text: ['M3 4h10', 'M3 7h10', 'M3 10h6'],
  file: ['M4 2h6l2.5 2.5V14H4z', 'M10 2v2.5h2.5'],
}

/** One tree-row icon: the folder/file glyph matching the entry's classification. */
export function FileIcon({ kind }: { kind: FileIconKind }) {
  const paths = PATHS[kind]
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className="file-icon" data-kind={kind}>
      {paths.map((d, index) => (
        <path key={index} d={d} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  )
}
