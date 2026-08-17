/**
 * Browser half of the ui-files plugin: fills the details panel's files tab
 * with the workspace file tree and a read-only text preview, driving the
 * files.* wire domain through the shared connection client. The tab seat is
 * declared by ui-conversation's 'details' entry, so registration goes through
 * `slots.inject()` — the declaration may activate later or be replaced.
 * @module @deepseek-ai/dsh-client-ui-files/client
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the SlotMap merge declaring the files tab.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
// Type-only: the shared wire client handle (the runtime reads the same seat).
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import type { FilesInjected } from './contract.ts'
import { FilesPanel } from './FilesPanel.tsx'
import { en, zh, type FilesKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Files-panel copy. */
    files: FilesKey
  }
}

export type { FilesInjected, FilesPanelProps } from './contract.ts'

/** Locale namespace owning the files panel copy. */
const LOCALE_NS = 'files'

/** Required services (cordis fiber inject): slots, the shared wire client, and locale. */
export const inject = ['slots', 'connection', 'locale']

/**
 * Client plugin body: register the panel dictionaries and the files tab into
 * the details panel's `conversation.details.files` seat.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(LOCALE_NS, { zh, en }), 'ui-files: dictionaries')

  // The runtime object layer reads the connection seat the same way; there is
  // no runtime service wrapping the files.* domain, so the panel drives the
  // shared api client directly.
  const connection = ctx.get('connection') as ConnectionHandle
  const injected = (): FilesInjected => ({
    listDirectory: (path, signal) => connection.api.files.list({ path }, signal),
    readFile: (path, signal) => connection.api.files.read({ path }, signal),
    writeFile: (payload, signal) => connection.api.files.write(payload, signal),
  })
  ctx.slots.inject('conversation.details.files', () =>
    ctx.slots.register({ name: 'conversation.details.files', locale: LOCALE_NS, inject: injected }, FilesPanel))
}
