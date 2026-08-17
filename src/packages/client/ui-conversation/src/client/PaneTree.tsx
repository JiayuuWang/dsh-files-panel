/** Recursive pane-tree renderer: leaves host one view + chrome; splits lay children out with draggable dividers. */

import { useRef } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import clsx from 'clsx'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-client-runtime/client'
import type { PaneLeaf, PaneNode, PaneSplit } from './contract/panes.ts'
import type { ViewTab } from './contract/views.ts'
import { findLeaf } from './pane-tree.ts'
import css from './PaneTree.module.css'

/** Minimum child fraction a divider may leave (10%). */
const MIN_FRACTION = 0.1

interface PaneTreeProps {
  root: PaneNode
  focusedPaneId: string | null
  fullscreenPaneId: string | null
  tabs: readonly ViewTab[]
  renderView: (leaf: PaneLeaf) => ReactNode
  onFocus: (paneId: string) => void
  onSplit: (paneId: string, direction: 'row' | 'column') => void
  onClose: (paneId: string) => void
  onFullscreen: (paneId: string) => void
  onResize: (splitId: string, sizes: number[]) => void
  /** The session this ConversationSession body is bound to (its own panes show no title). */
  currentSessionId: SessionId
  /** Resolve one session's display title for a cross-session pane's chrome label. */
  titleOf: (sessionId: SessionId) => string | undefined
  t: TranslateNS<'conversation'>
}

/** One leaf pane: the chrome bar (focus, split, fullscreen, close) above its view. */
function LeafPane(props: PaneTreeProps & { leaf: PaneLeaf }) {
  const { leaf, focusedPaneId, fullscreenPaneId, tabs, renderView, onFocus, onSplit, onClose, onFullscreen, currentSessionId, titleOf, t } = props
  const { paneId, viewId } = leaf
  // A cross-session pane names its session so the split stays navigable: the
  // header above only titles the current session, and every other leaf would
  // otherwise read as the same "Chat"/"Trajectory"/"Terminal" chrome.
  const viewLabel = tabs.find(tab => tab.id === viewId)?.label ?? viewId
  const sessionTitle = leaf.sessionId === currentSessionId ? undefined : titleOf(leaf.sessionId)
  return (
    <section
      className={clsx(css.pane, focusedPaneId === paneId && css.focused)}
      data-pane={paneId}
      onPointerDown={() => { onFocus(paneId) }}
    >
      <div className={css.chrome}>
        <span className={css.viewLabel} title={sessionTitle}>
          {sessionTitle === undefined || sessionTitle === ''
            ? viewLabel
            : `${sessionTitle} · ${viewLabel}`}
        </span>
        <div className={css.chromeActions}>
          <button type="button" className={css.chromeButton} aria-label={t('pane.splitRight')} title={t('pane.splitRight')} onClick={() => { onSplit(paneId, 'row') }}>⫞</button>
          <button type="button" className={css.chromeButton} aria-label={t('pane.splitDown')} title={t('pane.splitDown')} onClick={() => { onSplit(paneId, 'column') }}>⫟</button>
          <button type="button" className={css.chromeButton} aria-label={fullscreenPaneId === paneId ? t('pane.exitFullscreen') : t('pane.fullscreen')} title={fullscreenPaneId === paneId ? t('pane.exitFullscreen') : t('pane.fullscreen')} onClick={() => { onFullscreen(paneId) }}>⛶</button>
          <button type="button" className={css.chromeButton} aria-label={t('pane.close')} title={t('pane.close')} onClick={() => { onClose(paneId) }}>✕</button>
        </div>
      </div>
      <div className={css.view} data-pane-view="">{renderView(leaf)}</div>
    </section>
  )
}

/** One draggable divider between two split children (index → index+1). */
function Divider({ split, index, onResize }: { split: PaneSplit; index: number; onResize: (sizes: number[]) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    event.preventDefault()
    const parent = ref.current?.parentElement
    /* v8 ignore next -- the divider renders inside its split container. */
    if (parent === null || parent === undefined) return
    const horizontal = split.direction === 'row'
    const start = horizontal ? event.clientX : event.clientY
    const extent = horizontal ? parent.clientWidth : parent.clientHeight
    const startSizes = [...split.sizes]
    const move = (ev: PointerEvent): void => {
      if (extent === 0) return
      const delta = ((horizontal ? ev.clientX : ev.clientY) - start) / extent
      const raw = startSizes[index]! + delta
      const clamped = Math.max(MIN_FRACTION, Math.min(1 - MIN_FRACTION, raw))
      const sizes = [...startSizes]
      sizes[index] = clamped
      sizes[index + 1] = startSizes[index]! + startSizes[index + 1]! - clamped
      onResize(sizes)
    }
    const up = (): void => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
  return <div ref={ref} className={css.divider} data-direction={split.direction} onPointerDown={onPointerDown} />
}

/** Render one node: a leaf, or a flex split with dividers between sized fragments. */
function renderNode(props: PaneTreeProps, node: PaneNode): ReactNode {
  if (node.kind === 'leaf') {
    return <LeafPane {...props} leaf={node} />
  }
  const children: ReactNode[] = []
  node.children.forEach((child, index) => {
    const key = child.kind === 'leaf' ? child.paneId : child.splitId
    children.push(
      <div
        key={key}
        className={css.fragment}
        // flex-basis:0 makes the fragment's main size a pure function of its
        // flex-grow fraction (sizes sum to 1), so drags resize exactly and the
        // grid tracks its container on window resize. flex-shrink:1 lets the
        // grid shrink below a content-imposed basis (min-width/height:0 gate it).
        style={{ flexGrow: node.sizes[index] ?? 1, flexShrink: 1, flexBasis: 0 }}
      >
        {renderNode(props, child)}
      </div>,
    )
    if (index < node.children.length - 1) {
      children.push(<Divider key={`divider-${key}`} split={node} index={index} onResize={sizes => props.onResize(node.splitId, sizes)} />)
    }
  })
  return (
    <div className={clsx(css.split, node.direction === 'row' ? css.splitRow : css.splitColumn)}>
      {children}
    </div>
  )
}

/** Top-level pane tree (handles fullscreen by rendering only that leaf). */
export function PaneTree(props: PaneTreeProps) {
  const { root, fullscreenPaneId } = props
  if (fullscreenPaneId !== null) {
    const leaf = findLeaf(root, fullscreenPaneId)
    if (leaf !== undefined) {
      return (
        <div className={css.root} data-conversation-composer-overlay="">
          <LeafPane {...props} leaf={leaf} />
        </div>
      )
    }
  }
  return <div className={css.root} data-conversation-composer-overlay="">{renderNode(props, root)}</div>
}
