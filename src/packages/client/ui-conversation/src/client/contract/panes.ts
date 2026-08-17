/** Pane-layout contracts for the tmux-style split view. */

import type { SessionId } from '@deepseek-ai/dsh-session/types'

/** A leaf pane hosting one conversation view (chat / trajectory / terminal). */
export interface PaneLeaf {
  kind: 'leaf'
  /** Stable identity across splits/closes (minted at split time). */
  paneId: string
  /** The `conversation.view` entry id this pane renders. */
  viewId: string
  /** The session this pane's view binds to (cross-session panes). */
  sessionId: SessionId
  /**
   * This pane's terminal key (only meaningful when `viewId` is `terminal`):
   * minted on first switch to the Terminal view and reused across view
   * switches, so each terminal pane owns a distinct PTY that survives
   * tab changes. Absent until a terminal view is first used.
   */
  terminalId?: string
}

/** A split container: children laid out side-by-side (row) or stacked (column). */
export interface PaneSplit {
  kind: 'split'
  /** Stable identity for size drags (minted at split time). */
  splitId: string
  /** Row = side-by-side (split right); column = stacked (split down). */
  direction: 'row' | 'column'
  children: PaneNode[]
  /** Per-child fractional size; length equals children and sums to 1. */
  sizes: number[]
}

/** One node of the pane tree: a leaf or a recursive split. */
export type PaneNode = PaneLeaf | PaneSplit
