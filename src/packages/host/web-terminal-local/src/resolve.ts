/** Platform shell selection for the web-terminal backend. */

import { resolvePwshPath } from '@deepseek-ai/dsh-pwsh-local'

/** Interactive PowerShell argv: no banner/profile, no implicit command file. */
const PWSH_ARGS = ['-NoLogo', '-NoProfile']

/** Interactive bash argv: skip profile/rc scripts, force interactive mode. */
const BASH_ARGS = ['--noprofile', '--norc', '-i']

/** Shell names offered on Windows hosts. */
const WINDOWS_SHELLS = ['pwsh', 'cmd'] as const

/** Shell names offered on non-Windows hosts. */
const POSIX_SHELLS = ['bash', 'zsh', 'sh'] as const

/** Shell choice the web-terminal backend spawns. */
export interface ShellChoice {
  /** Complete argv (program at index 0). */
  argv: string[]
}

/**
 * Shell names a platform can spawn. Windows offers PowerShell (7 with a 5.1
 * fallback via `resolvePwshPath`) and the always-present command prompt;
 * POSIX offers bash (the configured default), zsh, and sh.
 * @param platform - the host platform to list for.
 * @returns the selectable shell names.
 */
export function availableShells(platform: NodeJS.Platform): readonly string[] {
  return platform === 'win32' ? WINDOWS_SHELLS : POSIX_SHELLS
}

/**
 * Resolve the argv of one shell for a platform, defaulting to the platform's
 * primary shell when `shell` is omitted.
 * @param platform - the host platform to select for.
 * @param shellPath - configured non-Windows default shell executable.
 * @param pwshPath - configured Windows PowerShell executable (resolved when absent).
 * @param shell - explicit shell name (one of {@link availableShells}); defaults to the platform primary.
 * @returns the shell argv.
 * @throws when `shell` is not a shell this platform can spawn.
 */
export function shellArgv(
  platform: NodeJS.Platform,
  shellPath: string,
  pwshPath?: string,
  shell?: string,
): ShellChoice {
  const name = shell ?? (platform === 'win32' ? 'pwsh' : 'bash')
  if (platform === 'win32') {
    if (name === 'pwsh') return { argv: [resolvePwshPath(pwshPath), ...PWSH_ARGS] }
    if (name === 'cmd') return { argv: ['cmd.exe'] }
    throw new Error(`web-terminal: unknown Windows shell "${name}"`)
  }
  if (name === 'bash') return { argv: [shellPath, ...BASH_ARGS] }
  if (name === 'zsh') return { argv: ['zsh', '-i'] }
  if (name === 'sh') return { argv: ['sh', '-i'] }
  throw new Error(`web-terminal: unknown POSIX shell "${name}"`)
}
