/** Session-header explorer toggle: opens the details panel on the files tab, or closes it when already there. */

import clsx from 'clsx'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type { ChatStore } from '../contract/slots.ts'
import css from './ToggleExplorer.module.css'

/** Full props: the header-utilities runtime seats, the shared chat store, the layout verbs, and the locale seat. */
export type ToggleExplorerProps =
  PropsRuntime<'conversation.session.header.utilities'>
  & PropsStore<ChatStore>
  & { openDetails: () => void; closeDetails: () => void }
  & PropsLocale<'conversation'>

/**
 * One always-visible header control that opens the file explorer: switching
 * the details panel to its files tab and opening the column, or closing the
 * column when it already shows files. The active-tab fact lives in the shared
 * chat store, so the panel and this control agree on what is showing.
 * @param props - store/runtime/layout/locale shares.
 */
export function ToggleExplorer({ useStore, actions, openDetails, closeDetails, t }: ToggleExplorerProps) {
  const detailsTab = useStore(s => s.detailsTab)
  const active = detailsTab === 'files'
  return (
    <button
      type="button"
      className={clsx(css.toggle, active && css.active)}
      aria-label={t('details.toggleExplorer')}
      aria-pressed={active}
      title={t('details.toggleExplorer')}
      onClick={() => {
        if (active) {
          actions.setDetailsTab('tool')
          closeDetails()
        } else {
          actions.setDetailsTab('files')
          openDetails()
        }
      }}
    >
      <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden>
        <path
          d="M1.5 3.5h4l1.5 1.5h7.5v7.5a1 1 0 0 1-1 1.5h-11a1 1 0 0 1-1-1.5z"
          fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
