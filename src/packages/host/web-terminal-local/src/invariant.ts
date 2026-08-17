/** Package-owned invariant companion for the web-terminal-local backend. @module @deepseek-ai/dsh-host-web-terminal-local/invariant */

import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-host-web-terminal-local'

/** Cordis companion plugin name. */
export const name = 'host-web-terminal-local-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the backend owns no process-global relationship beyond
 * its own per-session terminal map, which its service teardown closes.
 */
const install: InvariantInstaller = () => {}

/**
 * Register the web-terminal-local invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
