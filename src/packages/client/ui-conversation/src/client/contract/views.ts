/** Shared conversation view, selection, and store-state contracts. */

/** Tool call identity as carried on the wire (branded upstream in connection). */
export type CallId = string

/** The details panel's two tabs; shared so an external control can switch it. */
export type DetailsTab = 'tool' | 'files'

/** Selection target for the details linkage channel (toolcall is the step special case). */
export interface SelectionTarget { turnSeq: number; stepSeq?: number; callId?: CallId; toolName?: string }

/**
 * One conversation view tab, projected from a 'conversation.view' slot
 * entry's registration options (label falls back to the entry id).
 */
export interface ViewTab { id: string; label: string }

/**
 * Per-session state shared by conversation, chat-view, and details slots.
 * Pane layout is root-scoped (cross-session) in the pane store, not here.
 */
export interface ChatStoreState {
  /** Details-linkage channel (conversation writes, details reads). */
  selection: SelectionTarget | null
  /** Composer draft (persisted; survives session switches and reloads). */
  draft: string
  /**
   * The details panel's active tab. Shared so the explorer toggle in the
   * session header can open the panel on the files tab and the panel's own
   * tabs/tool-details pill can switch it back.
   */
  detailsTab: DetailsTab
  /**
   * One-shot inspect handoff: chat writes the call to reveal, the trajectory
   * view consumes it and acknowledges by clearing. Read with `?? null` —
   * persisted snapshots from before this field rehydrate without it.
   */
  inspect: { callId: CallId } | null
}
