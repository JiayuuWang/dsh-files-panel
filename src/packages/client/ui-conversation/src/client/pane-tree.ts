/**
 * Pure pane-tree operations: every operation returns a NEW tree, so the store
 * actions stay one immutable write each. Leaf/split identities are minted by
 * the caller (the store), never here.
 */

import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { PaneLeaf, PaneNode, PaneSplit } from './contract/panes.ts'

/** The initial single-pane layout (chat) for one session. */
export function initialPane(sessionId: SessionId): PaneNode {
  return { kind: 'leaf', paneId: 'pane-1', viewId: 'chat', sessionId }
}

/** Find a leaf by pane id (depth-first). */
export function findLeaf(root: PaneNode, paneId: string): PaneLeaf | undefined {
  if (root.kind === 'leaf') return root.paneId === paneId ? root : undefined
  for (const child of root.children) {
    const found = findLeaf(child, paneId)
    if (found !== undefined) return found
  }
  return undefined
}

/** Find a leaf bound to a session id (depth-first). */
export function findLeafBySession(root: PaneNode, sessionId: SessionId): PaneLeaf | undefined {
  if (root.kind === 'leaf') return root.sessionId === sessionId ? root : undefined
  for (const child of root.children) {
    const found = findLeafBySession(child, sessionId)
    if (found !== undefined) return found
  }
  return undefined
}

/** The first (top-left) leaf, used as the fallback focus target. */
export function firstLeaf(root: PaneNode): PaneLeaf | undefined {
  if (root.kind === 'leaf') return root
  for (const child of root.children) {
    const leaf = firstLeaf(child)
    if (leaf !== undefined) return leaf
  }
  return undefined
}

/** The focused leaf, falling back to the first leaf when the id is stale/absent. */
export function focusedLeaf(root: PaneNode, focusedId: string | null): PaneLeaf | undefined {
  const byId = focusedId === null ? undefined : findLeaf(root, focusedId)
  return byId ?? firstLeaf(root)
}

/** Scale an arbitrary non-empty fraction list to sum to 1. */
function normalize(sizes: number[]): number[] {
  const total = sizes.reduce((sum, value) => sum + value, 0)
  if (total <= 0) return sizes.map(() => 1 / sizes.length)
  return sizes.map(value => value / total)
}

/** Replace the leaf `paneId` with a two-child split (the leaf plus a fresh one). */
export function splitPane(
  root: PaneNode,
  paneId: string,
  newPaneId: string,
  splitId: string,
  direction: 'row' | 'column',
  newViewId: string,
  newSessionId: SessionId,
  newTerminalId?: string,
): PaneNode {
  if (root.kind === 'leaf') {
    if (root.paneId !== paneId) return root
    const fresh: PaneLeaf = {
      kind: 'leaf',
      paneId: newPaneId,
      viewId: newViewId,
      sessionId: newSessionId,
      ...(newTerminalId === undefined ? {} : { terminalId: newTerminalId }),
    }
    return {
      kind: 'split',
      splitId,
      direction,
      children: [root, fresh],
      sizes: [0.5, 0.5],
    }
  }
  return { ...root, children: root.children.map(child => splitPane(child, paneId, newPaneId, splitId, direction, newViewId, newSessionId, newTerminalId)) }
}

/** Remove the leaf `paneId`, collapsing a split left with one child into it. */
export function closePane(root: PaneNode, paneId: string): PaneNode {
  if (root.kind === 'leaf') return root
  const directIndex = root.children.findIndex(child => child.kind === 'leaf' && child.paneId === paneId)
  if (directIndex >= 0) {
    const remaining = root.children.filter((_, index) => index !== directIndex)
    if (remaining.length === 1) return remaining[0] as PaneNode
    const keptSizes = root.sizes.filter((_, index) => index !== directIndex)
    return { ...root, children: remaining, sizes: normalize(keptSizes) }
  }
  return {
    ...root,
    children: root.children.map(child => child.kind === 'split' ? closePane(child, paneId) : child),
  }
}

/** Set a leaf's view id. */
export function setLeafView(root: PaneNode, paneId: string, viewId: string): PaneNode {
  if (root.kind === 'leaf') {
    return root.paneId === paneId ? { ...root, viewId } : root
  }
  return { ...root, children: root.children.map(child => setLeafView(child, paneId, viewId)) }
}

/** Set a leaf's terminal key (minted on first switch to the Terminal view). */
export function setLeafTerminalId(root: PaneNode, paneId: string, terminalId: string): PaneNode {
  if (root.kind === 'leaf') {
    return root.paneId === paneId ? { ...root, terminalId } : root
  }
  return { ...root, children: root.children.map(child => setLeafTerminalId(child, paneId, terminalId)) }
}

/** Re-home a leaf to another session: a fresh chat view with no terminal key. */
export function rehomeLeaf(root: PaneNode, paneId: string, sessionId: SessionId): PaneNode {
  if (root.kind === 'leaf') {
    return root.paneId === paneId
      ? { kind: 'leaf', paneId, viewId: 'chat', sessionId }
      : root
  }
  return { ...root, children: root.children.map(child => rehomeLeaf(child, paneId, sessionId)) }
}

/** Set a split's child fractions (caller supplies the full, normalized list). */
export function setSplitSizes(root: PaneNode, splitId: string, sizes: number[]): PaneNode {
  if (root.kind === 'leaf') return root
  if (root.splitId === splitId) return { ...root, sizes: normalize(sizes) }
  return { ...root, children: root.children.map(child => setSplitSizes(child, splitId, sizes)) }
}

/** True when the tree has only the one leaf (cannot be closed). */
export function isSingle(root: PaneNode): boolean {
  return root.kind === 'leaf'
}

/** Locate the split node that directly contains `childId` (leaf or split), if any. */
export function parentSplit(root: PaneNode, childId: string): PaneSplit | undefined {
  if (root.kind === 'leaf') return undefined
  if (root.children.some(child => (child.kind === 'leaf' ? child.paneId : child.splitId) === childId)) {
    return root
  }
  for (const child of root.children) {
    if (child.kind === 'leaf') continue
    const found = parentSplit(child, childId)
    if (found !== undefined) return found
  }
  return undefined
}
