/** `terminal` namespace dictionaries: view phases and controls. */

export const NS = 'terminal'

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'view.terminal': '终端',
  'loading': '正在启动终端…',
  'exited': '终端已退出',
  'unavailable': '此部署未启用交互式终端',
  'restart': '重启终端',
  'restarting': '正在重启终端…',
  'shell.label': 'Shell',
  'shell.default': '默认',
} satisfies Record<string, string>

/** The terminal namespace key union. */
export type TerminalKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'view.terminal': 'Terminal',
  'loading': 'Starting terminal…',
  'exited': 'Terminal exited',
  'unavailable': 'Interactive terminals are not enabled in this deployment',
  'restart': 'Restart terminal',
  'restarting': 'Restarting terminal…',
  'shell.label': 'Shell',
  'shell.default': 'Default',
} satisfies Record<TerminalKey, string>
