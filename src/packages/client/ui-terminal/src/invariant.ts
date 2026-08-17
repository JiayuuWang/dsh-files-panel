/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-client-ui-terminal`.
 * @module @deepseek-ai/dsh-client-ui-terminal/invariant
 */

import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-client-ui-terminal'

/** Cordis companion plugin name. */
export const name = 'client-ui-terminal-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: a pure-consumer plugin driving the terminal.* wire
 * calls from its component — it emits no cordis events and owns no
 * cross-plugin mutable state; interaction behavior is asserted directly by
 * this package's component specs.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
