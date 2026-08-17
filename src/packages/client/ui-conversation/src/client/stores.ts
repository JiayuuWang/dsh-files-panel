/**
 * Per-session chat store shared by conversation and details registrations.
 * The plugin creates its handle at apply time so identity follows the fiber.
 * Pane layout lives in the root-scoped {@link pane-store} (cross-session);
 * this store keeps only per-session chat state.
 */
import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-runtime/client'
import type { CallId, ChatStoreState, DetailsTab, SelectionTarget } from './contract/views.ts'

/** Declared action shape used to give the exported factory a stable return type. */
type ChatActions = {
  select: (draft: ChatStoreState, target: SelectionTarget | null) => void
  setDraft: (draft: ChatStoreState, text: string) => void
  setInspect: (draft: ChatStoreState, target: { callId: CallId } | null) => void
  setDetailsTab: (draft: ChatStoreState, tab: DetailsTab) => void
}

/**
 * Declares the per-session chat state and write surface.
 * @returns the store handle.
 */
export function createChatStore(): EngineStoreHandle<ChatStoreState, ChatActions> {
  return defineStore({
    init: (): ChatStoreState => ({
      selection: null,
      draft: '',
      detailsTab: 'tool',
      inspect: null,
    }),
    // v2: the split-pane change replaced `view` with `panes`/`focusedPaneId`/
    // `fullscreenPaneId`; a v1 snapshot rehydrates without those fields and
    // crashes the pane tree, so the incompatible shape gets a fresh key. Those
    // pane fields later moved to the root pane store; stale extras rehydrate
    // harmlessly (they are simply never read again).
    persist: 'dsh.conversation.chat.v2',
    actions: {
      select: (d, target: SelectionTarget | null) => { d.selection = target },
      setDraft: (d, text: string) => { d.draft = text },
      setInspect: (d, target: { callId: CallId } | null) => { d.inspect = target },
      setDetailsTab: (d, tab: DetailsTab) => { d.detailsTab = tab },
    },
  })
}
