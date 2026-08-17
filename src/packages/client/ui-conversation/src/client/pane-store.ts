/**
 * Root-scoped pane-layout store: the tmux-style split grid spans sessions (each
 * leaf binds its own session), so the layout survives session switches while
 * the per-session chat store keeps only per-session chat state. Created once in
 * apply and handed to the conversation skeleton through inject — it is NOT a
 * slot store, because no existing slot is root-scoped (the conversation entry
 * is session-maybe, which keys stores per session).
 */

import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-runtime/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { PaneNode } from './contract/panes.ts'
import {
  closePane, findLeaf, findLeafBySession, focusedLeaf, initialPane, isSingle,
  rehomeLeaf, setLeafTerminalId, setLeafView, setSplitSizes, splitPane,
} from './pane-tree.ts'

/** Mint a transient pane/split identity (non-persisted UI ids; randomness avoids persisted collisions). */
function mintId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

/** Pane-layout state: a null tree means no session has arrived yet. */
export interface PaneStoreState {
  /** The pane tree; null until the first session initializes it. */
  panes: PaneNode | null
  /** Focused leaf pane id; null = the first leaf. */
  focusedPaneId: string | null
  /** Fullscreen leaf pane id; null = the whole grid shows. */
  fullscreenPaneId: string | null
}

/** Declared action shape of the pane store. */
type PaneActions = {
  /** Initialize the tree for the first session (no-op once initialized). */
  init: (draft: PaneStoreState, sessionId: SessionId) => void
  /** Split a leaf right/down, focusing the fresh pane bound to `newSessionId`. */
  splitPane: (draft: PaneStoreState, paneId: string, direction: 'row' | 'column', newSessionId: SessionId) => void
  /** Close a leaf (the last pane cannot be closed). */
  closePane: (draft: PaneStoreState, paneId: string) => void
  /** Switch one leaf to another conversation view. */
  setPaneView: (draft: PaneStoreState, paneId: string, viewId: string) => void
  /** Switch the focused pane (fallback: first) to another view. */
  switchFocusedTo: (draft: PaneStoreState, viewId: string) => void
  /** Update a split's child fractions (drag). */
  setPaneSizes: (draft: PaneStoreState, splitId: string, sizes: number[]) => void
  /** Move focus to one leaf. */
  setFocusedPane: (draft: PaneStoreState, paneId: string) => void
  /** Toggle one leaf into/out of fullscreen. */
  toggleFullscreen: (draft: PaneStoreState, paneId: string) => void
  /**
   * Reconcile the pane grid to the current session: focus the leaf already
   * bound to it, re-home the focused leaf onto it, or initialize the tree.
   */
  focusSession: (draft: PaneStoreState, sessionId: SessionId) => void
}

/**
 * Declare the root-scoped pane-layout store.
 * @returns the store handle (created once in apply; the root instance is shared).
 */
export function createPaneStore(): EngineStoreHandle<PaneStoreState, PaneActions> {
  return defineStore({
    init: (): PaneStoreState => ({ panes: null, focusedPaneId: null, fullscreenPaneId: null }),
    // Root scope (create() with no scope key): the persist key stays unsuffixed
    // and one grid is shared by every session.
    persist: 'dsh.conversation.panes.v1',
    actions: {
      init: (d, sessionId) => {
        if (d.panes === null) d.panes = initialPane(sessionId)
      },
      splitPane: (d, paneId, direction, newSessionId) => {
        if (d.panes === null) return
        const source = findLeaf(d.panes, paneId)
        if (source === undefined) return
        const newPaneId = mintId('pane')
        // The fresh pane inherits the source view; a Terminal source opens a NEW
        // terminal (distinct key), a Trajectory source duplicates the trajectory
        // panel, and a Chat source starts a fresh chat (bound to the new session).
        const newTerminalId = source.viewId === 'terminal' ? mintId('term') : undefined
        d.panes = splitPane(d.panes, paneId, newPaneId, mintId('split'), direction, source.viewId, newSessionId, newTerminalId)
        d.focusedPaneId = newPaneId
      },
      closePane: (d, paneId) => {
        if (d.panes === null || isSingle(d.panes)) return
        d.panes = closePane(d.panes, paneId)
        if (d.focusedPaneId === paneId) d.focusedPaneId = null
        if (d.fullscreenPaneId === paneId) d.fullscreenPaneId = null
      },
      setPaneView: (d, paneId, viewId) => {
        if (d.panes === null) return
        d.panes = setLeafView(d.panes, paneId, viewId)
        if (viewId === 'terminal') {
          const leaf = findLeaf(d.panes, paneId)
          if (leaf !== undefined && leaf.terminalId === undefined) {
            d.panes = setLeafTerminalId(d.panes, paneId, mintId('term'))
          }
        }
      },
      switchFocusedTo: (d, viewId) => {
        if (d.panes === null) return
        const leaf = focusedLeaf(d.panes, d.focusedPaneId)
        if (leaf !== undefined) {
          d.panes = setLeafView(d.panes, leaf.paneId, viewId)
          if (viewId === 'terminal') {
            const fresh = findLeaf(d.panes, leaf.paneId)
            if (fresh !== undefined && fresh.terminalId === undefined) {
              d.panes = setLeafTerminalId(d.panes, leaf.paneId, mintId('term'))
            }
          }
        }
      },
      setPaneSizes: (d, splitId, sizes) => {
        if (d.panes !== null) d.panes = setSplitSizes(d.panes, splitId, sizes)
      },
      setFocusedPane: (d, paneId) => { d.focusedPaneId = paneId },
      toggleFullscreen: (d, paneId) => { d.fullscreenPaneId = d.fullscreenPaneId === paneId ? null : paneId },
      focusSession: (d, sessionId) => {
        if (d.panes === null) {
          d.panes = initialPane(sessionId)
          return
        }
        const bound = findLeafBySession(d.panes, sessionId)
        if (bound !== undefined) {
          d.focusedPaneId = bound.paneId
          return
        }
        const focus = focusedLeaf(d.panes, d.focusedPaneId)
        if (focus !== undefined) {
          d.panes = rehomeLeaf(d.panes, focus.paneId, sessionId)
          d.focusedPaneId = focus.paneId
        }
      },
    },
  })
}
