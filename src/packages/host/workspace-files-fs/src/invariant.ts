/** Package-owned invariant companion for the workspace-files `-fs` backend. @module @deepseek-ai/dsh-host-workspace-files-fs/invariant */

import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-host-workspace-files-fs'

/** Cordis companion plugin name. */
export const name = 'host-workspace-files-fs-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the backend owns no event or durable-data relationship
 * of its own — the filesystem capability and the API gateway already observe
 * every read it issues.
 */
const install: InvariantInstaller = () => {}

/**
 * Register the workspace-files `-fs` invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
