/**
 * Browser half of the ui-terminal plugin: contributes the Terminal tab to the
 * conversation view ring (beside Chat and Trajectory), driving the terminal.*
 * wire domain through the shared connection client. The view-ring seat is
 * declared by ui-conversation's 'conversation.session' entry, so registration
 * goes through `slots.inject()` — the declaration may activate later or be
 * replaced.
 * @module @deepseek-ai/dsh-client-ui-terminal/client
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the SlotMap merge declaring the conversation view ring.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
// Type-only: the shared wire client handle (the runtime reads the same seat).
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import type { TerminalInjected } from './contract.ts'
import { TerminalView } from './TerminalView.tsx'
import { en, zh, type TerminalKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Terminal-view copy. */
    terminal: TerminalKey
  }
}

export type { TerminalInjected, TerminalViewProps } from './contract.ts'

/** Locale namespace owning the terminal-view copy. */
const LOCALE_NS = 'terminal'

/** Required services (cordis fiber inject): slots, the shared wire client, and locale. */
export const inject = ['slots', 'connection', 'locale']

/**
 * Client plugin body: register the terminal dictionaries and the Terminal
 * view-ring entry (id `terminal`, beside chat and trajectory).
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(LOCALE_NS, { zh, en }), 'ui-terminal: dictionaries')
  // Registration-time text (the view tab label) reads through the bound
  // translate as a thunk, so it follows the active locale without
  // re-registration.
  const t = ctx.locale.bind(LOCALE_NS)

  const connection = ctx.get('connection') as ConnectionHandle
  const injected = (): TerminalInjected => ({
    openTerminal: (payload, signal) => connection.api.terminal.open(payload, signal),
    writeTerminal: (payload, signal) => connection.api.terminal.write(payload, signal),
    readTerminal: (payload, signal) => connection.api.terminal.read(payload, signal),
    signalTerminal: (payload, signal) => connection.api.terminal.signal(payload, signal),
    closeTerminal: (payload, signal) => connection.api.terminal.close(payload, signal),
    listTerminalShells: (payload, signal) => connection.api.terminal.shells(payload, signal),
  })
  ctx.slots.inject('conversation.view', () =>
    ctx.slots.register({
      name: 'conversation.view',
      id: 'terminal',
      order: 20,
      locale: LOCALE_NS,
      label: () => t('view.terminal'),
      inject: injected,
    }, TerminalView))
}
