/** Strict per-session header/body content inserted into the resident conversation layout. */

import { useEffect, useSyncExternalStore } from 'react'
import clsx from 'clsx'
import type { SessionId, SessionListState, SessionSummary } from '@deepseek-ai/dsh-client-runtime/client'
import type {
  ConversationSessionHeaderSlotProps, ConversationSessionSlotProps,
} from '../contract/slots.ts'
import { findLeaf, focusedLeaf, isSingle } from '../pane-tree.ts'
import { PaneTree } from '../PaneTree.tsx'
import css from './ConversationRoot.module.css'

/** Full props composed from the strict session body contract. */
export type ConversationSessionProps = ConversationSessionSlotProps

/** Full props composed from the strict session header contract. */
export type ConversationSessionHeaderProps = ConversationSessionHeaderSlotProps

interface Breadcrumb {
  readonly id: SessionId
  readonly displayTitle: string
}

function deriveAncestry(list: SessionListState, id: SessionId): readonly Breadcrumb[] {
  const chain: Breadcrumb[] = []
  const seen = new Set<SessionId>()
  let cursor: SessionId | undefined = id
  while (cursor !== undefined) {
    if (seen.has(cursor)) break
    seen.add(cursor)
    const summary: SessionSummary | undefined = list.byId[cursor]
    if (summary === undefined) break
    chain.unshift({ id: summary.id, displayTitle: summary.displayTitle })
    if (summary.origin !== 'subagent') break
    cursor = summary.parentId
  }
  return chain
}

function equalBreadcrumbs(left: readonly Breadcrumb[], right: readonly Breadcrumb[]): boolean {
  return left.length === right.length
    && left.every((item, index) => {
      const other = right.at(index)
      return other !== undefined && item.id === other.id && item.displayTitle === other.displayTitle
    })
}

/**
 * Renders Session header chrome above the resident conversation scrollport.
 * The tab ring addresses the focused pane (from the root pane store): clicking
 * a tab switches that pane's view rather than replacing one global view.
 * @param props - Strict Session store, view ledger, navigation, render, and locale shares.
 * @returns the hidden blank-session header or visible title and tabs.
 */
export function ConversationSessionHeader({
  sessionId, useSession, useSessions,
  renderSlot, views, paneStore, open, t,
}: ConversationSessionHeaderProps) {
  useSyncExternalStore(views.subscribe, views.version)
  const tabs = views.list()
  const paneState = useSyncExternalStore(paneStore.subscribe, paneStore.getSnapshot)
  const focused = paneState.panes === null ? undefined : focusedLeaf(paneState.panes, paneState.focusedPaneId)
  const focusedViewId = focused?.viewId
  // A stale persisted view id (composed out) falls back to the stable Chat tab.
  const activeViewId = focusedViewId !== undefined && tabs.some(tab => tab.id === focusedViewId) ? focusedViewId : 'chat'
  const targetPaneId = focused?.paneId ?? null
  const ancestry = useSessions(s => deriveAncestry(s, sessionId), equalBreadcrumbs)
  const composerPhase = useSession(s => s.composerPhase)
  const blank = useSession(s => s.blank)
  const hideChrome = blank && composerPhase === 'blank'

  return (
    <header
      className={clsx(css.header, hideChrome && css.headerHidden)}
      aria-hidden={hideChrome || undefined}
    >
      {!hideChrome && (
        <>
          <div className={css.titleRow}>
            <div className={css.titleCluster}>
              <nav className={css.crumbs} aria-label={t('session.hierarchy')}>
                {ancestry.map((summary, index) => {
                  const last = index === ancestry.length - 1
                  return (
                    <span key={summary.id} className={css.crumbSeg}>
                      {index > 0 && <span className={css.crumbSep}>/</span>}
                      <button
                        type="button"
                        className={clsx(css.crumb, last && css.crumbCurrent)}
                        disabled={last}
                        onClick={() => { open(summary.id) }}
                      >
                        {summary.displayTitle}
                      </button>
                    </span>
                  )
                })}
                {ancestry.length === 0 && <span className={css.crumbCurrent}>{sessionId}</span>}
              </nav>
              <div className={css.headerActions}>
                {renderSlot('conversation.session.header.actions', {})}
              </div>
            </div>
            <div className={css.headerUtilities}>
              {renderSlot('conversation.session.header.utilities', {})}
            </div>
          </div>
          {tabs.length > 1 && (
            <div className={css.tabs} role="tablist">
              {tabs.map(viewTab => (
                <button
                  key={viewTab.id}
                  type="button"
                  role="tab"
                  aria-selected={viewTab.id === activeViewId}
                  className={clsx(css.tab, viewTab.id === activeViewId && css.tabActive)}
                  onClick={() => {
                    if (targetPaneId !== null) paneStore.actions.setPaneView(targetPaneId, viewTab.id)
                  }}
                >
                  {viewTab.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </header>
  )
}

/**
 * Renders the active Session view area as a recursive pane tree whose leaves
 * each bind their OWN session (cross-session panes): the current session's
 * leaves render inline, and every other leaf renders under a SessionBoundary.
 * @param props - Strict Session input/store, view ledger, and render shares.
 * @returns the pane grid, or null while no pane tree exists yet.
 */
export function ConversationSession({
  sessionId, useSession, useInput, inputActions, useStore, actions,
  renderSlot, views, paneStore, newSessionFor, openSession,
  bindDraftMirror, releaseSessionImages, SessionBoundary, t,
}: ConversationSessionProps) {
  useSyncExternalStore(views.subscribe, views.version)
  const tabs = views.list()
  const paneState = useSyncExternalStore(paneStore.subscribe, paneStore.getSnapshot)
  const composerPhase = useSession(s => s.composerPhase)
  const blank = useSession(s => s.blank)
  const inputState = useInput(s => s)
  const storedDraft = useStore(s => s.draft)
  // `?? null`: persisted snapshots from before the inspect field rehydrate without it.
  const inspect = useStore(s => s.inspect ?? null)

  useEffect(() => {
    if (inputState.draft === '' && storedDraft !== '') inputActions.setDraft(storedDraft)
    const unmirror = bindDraftMirror(actions.setDraft)
    return () => { unmirror() }
    // Mount-only (deps pinned to inputActions): later store writes come from
    // the machine mirror, not this seed effect.
  }, [inputActions])

  useEffect(() => () => {
    releaseSessionImages(sessionId)
  }, [releaseSessionImages, sessionId])

  // Initialize the root pane grid for the first session once a session exists.
  // Deferred to an effect (not the reconcile subscription) so the grid appears
  // even when the current session was already set before any listener ran.
  const panes = paneState.panes
  useEffect(() => {
    if (panes === null) paneStore.actions.init(sessionId)
  }, [panes, paneStore, sessionId])

  if (panes === null) return null
  // The blank-session hero hides the body only for the single-pane case: a
  // cross-session split must keep rendering even when the focused pane is a
  // fresh blank session (chat split → new session), because sibling panes hold
  // content. Single-pane blank stays the hero (workspace picker) as before.
  if (blank && composerPhase === 'blank' && isSingle(panes)) return null
  // The renderer always hands this entry a SessionBoundary because it declares
  // the session-scope 'conversation.view' child; the optional prop type only
  // keeps sibling entries' tests free of a stub.
  const Boundary = SessionBoundary!
  return (
    <div className={css.viewArea}>
      <PaneTree
        root={panes}
        focusedPaneId={paneState.focusedPaneId}
        fullscreenPaneId={paneState.fullscreenPaneId}
        tabs={tabs}
        renderView={leaf => {
          const viewId = tabs.some(tab => tab.id === leaf.viewId) ? leaf.viewId : 'chat'
          const owner = leaf.sessionId === sessionId
            ? { inspect, onInspectDone: () => { actions.setInspect(null) } }
            : { inspect: null, onInspectDone: () => {} }
          const view = renderSlot('conversation.view', {
            ...owner,
            ...(leaf.terminalId === undefined ? {} : { terminalId: leaf.terminalId }),
          }, { only: viewId })
          return leaf.sessionId === sessionId
            ? view
            : <Boundary sessionId={leaf.sessionId}>{view}</Boundary>
        }}
        onFocus={paneId => {
          paneStore.actions.setFocusedPane(paneId)
          const leaf = findLeaf(panes, paneId)
          if (leaf !== undefined && leaf.sessionId !== sessionId) openSession(leaf.sessionId)
        }}
        onSplit={(paneId, direction) => {
          const leaf = findLeaf(panes, paneId)
          if (leaf === undefined) return
          const same = leaf.sessionId
          const doSplit = (sessionId: SessionId) => {
            paneStore.actions.splitPane(paneId, direction, sessionId)
            try {
              openSession(sessionId)
            } catch {
              // The fresh session may not be listed yet; the reconcile listener
              // focuses it the moment it lands. The split itself already ran.
            }
          }
          if (leaf.viewId === 'chat') {
            // New Session: mint the sibling session, then split onto it. If
            // creation fails, fall back to a same-session split rather than
            // dropping the user's gesture (unhandled rejection).
            void newSessionFor(same).then(doSplit).catch(() => { doSplit(same) })
          } else {
            doSplit(same)
          }
        }}
        onClose={paneId => { paneStore.actions.closePane(paneId) }}
        onFullscreen={paneId => { paneStore.actions.toggleFullscreen(paneId) }}
        onResize={(splitId, sizes) => { paneStore.actions.setPaneSizes(splitId, sizes) }}
        t={t}
      />
    </div>
  )
}
