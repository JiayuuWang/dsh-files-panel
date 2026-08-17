/**
 * TerminalView: one interactive PTY per terminal pane, rendered with xterm.js.
 * The view is keyed by a client-minted `terminalId` (falling back to the
 * session id for the lone default terminal), so several terminal panes of one
 * session each own a distinct shell. On mount it opens (or re-attaches to)
 * that key's terminal, seeds the emulator from the retained scrollback, then
 * polls terminal.read on a short cadence while forwarding keystrokes through
 * terminal.write. The terminal stays alive on the host across view switches —
 * unmounting only disposes the emulator, so a tab switch re-attaches to the
 * same shell. A restart (or a shell change) closes the host terminal and
 * reopens it fresh with the new shell.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import clsx from 'clsx'
import type { TerminalViewProps } from './contract.ts'
import css from './TerminalView.module.css'

/** Poll cadence for retained terminal output (milliseconds). */
const POLL_INTERVAL_MS = 60

type Phase = 'loading' | 'ready' | 'exited' | 'unavailable' | 'error' | 'restarting'

export function TerminalView({
  sessionId, terminalId, useSessions, openTerminal, writeTerminal, readTerminal,
  closeTerminal, listTerminalShells, t,
}: TerminalViewProps) {
  const cwd = useSessions(list => list.byId[sessionId]?.cwd)
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [generation, setGeneration] = useState(0)
  const [shells, setShells] = useState<string[]>([])
  const [shell, setShell] = useState<string | undefined>(undefined)
  // The shell the open effect reads: a ref so a shell change reopens without
  // re-entering the effect's dependency array (the generation bump does that).
  const shellRef = useRef<string | undefined>(undefined)

  // The terminal key this pane owns: its minted id, or the session id as the
  // lone default terminal's stable key.
  const terminalKey = terminalId ?? sessionId

  useEffect(() => {
    void listTerminalShells({}).then(response => {
      if (response.result.ok) setShells(response.result.value.shells)
    })
  }, [listTerminalShells])

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal
    const host = hostRef.current
    let term: Terminal | undefined
    let poll: ReturnType<typeof setInterval> | undefined
    let disposed = false

    setPhase('loading')
    void (async () => {
      const opened = await openTerminal({
        sessionId,
        terminalId: terminalKey,
        ...(cwd === undefined ? {} : { cwd }),
        ...(shellRef.current === undefined ? {} : { shell: shellRef.current }),
      }, signal)
      if (disposed || signal.aborted) return
      if (!opened.result.ok) {
        setPhase(opened.result.error.code === 'terminal-unavailable' ? 'unavailable' : 'error')
        return
      }
      /* v8 ignore next -- the ref is attached before the effect runs: the host div renders unconditionally. */
      if (host === null) { setPhase('error'); return }
      const value = opened.result.value
      term = new Terminal({ cols: value.cols, rows: value.rows, convertEol: false })
      term.open(host)
      term.write(value.output)
      let cursor = value.cursor
      term.onData((data) => { void writeTerminal({ sessionId, terminalId: terminalKey, data }) })
      setPhase('ready')
      poll = setInterval(() => {
        void (async () => {
          const read = await readTerminal({ sessionId, terminalId: terminalKey, cursor })
          if (disposed) return
          if (!read.result.ok) return
          const next = read.result.value
          if (next.output !== '') term?.write(next.output)
          cursor = next.cursor
          if (next.exited) {
            if (poll !== undefined) clearInterval(poll)
            poll = undefined
            setPhase('exited')
          }
        })()
      }, POLL_INTERVAL_MS)
    })().catch(() => {
      if (!disposed) setPhase('error')
    })

    return () => {
      disposed = true
      controller.abort()
      if (poll !== undefined) clearInterval(poll)
      term?.dispose()
    }
  }, [sessionId, terminalKey, cwd, generation, openTerminal, readTerminal, writeTerminal])

  const restart = useCallback(() => {
    setPhase('restarting')
    // Best-effort close (a never-opened or already-exited terminal answers
    // terminal-not-found); reopening always runs on the next generation.
    void closeTerminal({ sessionId, terminalId: terminalKey }).then(
      () => { setGeneration(g => g + 1) },
      () => { setGeneration(g => g + 1) },
    )
  }, [closeTerminal, sessionId, terminalKey])

  const chooseShell = useCallback((next: string) => {
    // The empty string is the "default" choice: reopen with the platform shell.
    shellRef.current = next === '' ? undefined : next
    setShell(next === '' ? undefined : next)
    setPhase('restarting')
    void closeTerminal({ sessionId, terminalId: terminalKey }).then(
      () => { setGeneration(g => g + 1) },
      () => { setGeneration(g => g + 1) },
    )
  }, [closeTerminal, sessionId, terminalKey])

  const message = phase === 'ready' || phase === 'restarting'
    ? null
    : phase === 'exited' ? t('exited')
      : phase === 'unavailable' ? t('unavailable')
        : phase === 'error' ? t('exited')
          : t('loading')

  return (
    <div className={css.root}>
      <div className={css.toolbar}>
        {shells.length > 0 && (
          <div className={css.shellGroup} role="group" aria-label={t('shell.label')}>
            <span className={css.shellLabel}>{t('shell.label')}</span>
            <div className={css.shellSegments}>
              <button
                type="button"
                className={clsx(css.shellSegment, shell === undefined && css.shellSegmentActive)}
                onClick={() => { chooseShell('') }}
              >
                {t('shell.default')}
              </button>
              {shells.map(name => (
                <button
                  key={name}
                  type="button"
                  className={clsx(css.shellSegment, shell === name && css.shellSegmentActive)}
                  onClick={() => { chooseShell(name) }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          type="button"
          className={css.restart}
          disabled={phase === 'restarting' || phase === 'loading' || phase === 'unavailable'}
          onClick={restart}
        >
          {phase === 'restarting' ? t('restarting') : t('restart')}
        </button>
      </div>
      <div className={css.host} ref={hostRef} />
      {message !== null && phase !== 'restarting' && (
        <div className={clsx(css.banner, phase === 'loading' && css.bannerLoading)}>{message}</div>
      )}
    </div>
  )
}
