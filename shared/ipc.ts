/**
 * IPC contract shared by the main process, the preload script and the
 * renderer. This file must stay free of Electron, Node and DOM imports so
 * that every side can bundle it.
 */

export type EditPayload = { id: string; value: string };
export type ClosePayload = { id: string };
export type EditingStatePayload = {
  id: string;
  value: string;
  isEditing: boolean;
};

export type Unsubscribe = () => void;

export const IPC = {
  // renderer -> main
  OPEN_NEW_WINDOW: 'open-new-window',
  UPDATE_VALUE: 'update-value',
  CLOSE_WINDOW: 'close-window',
  CHILD_REQUEST_EDIT: 'child-request-edit',
  CHILD_SYNC_EDIT_VALUE: 'child-sync-edit-value',
  CHILD_SAVE_EDIT: 'child-save-edit',
  CHILD_CANCEL_EDIT: 'child-cancel-edit',
  NOTIFY_EDITING_STATE: 'notify-editing-state',
  // renderer -> main (invoke/handle)
  GET_CURRENT_VALUE: 'get-current-value',
  // main -> renderer
  INIT_VALUE: 'init-value',
  EDIT_WINDOW_CLOSED: 'edit-window-closed',
  EDITING_STATE_CHANGED: 'editing-state-changed',
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];

/** Shape of `window.electronAPI`, as exposed by `electron/preload.ts`. */
export interface ElectronAPI {
  openNewWindow: (payload: EditPayload) => void;
  updateValue: (payload: EditPayload) => void;
  closeWindow: (payload: ClosePayload) => void;
  requestStartEditing: (payload: EditPayload) => void;
  requestSyncValue: (payload: EditPayload) => void;
  requestSaveEditing: (payload: EditPayload) => void;
  requestCancelEditing: (payload: EditPayload) => void;
  /** Resolves with the value the main process holds for the calling child window. */
  getCurrentValue: () => Promise<EditPayload | null>;
  notifyEditingState: (payload: EditingStatePayload) => void;
  onInitValue: (callback: (payload: EditPayload) => void) => Unsubscribe;
  onUpdateValue: (callback: (payload: EditPayload) => void) => Unsubscribe;
  onEditWindowClosed: (
    callback: (payload: ClosePayload) => void
  ) => Unsubscribe;
  onEditingStateChange: (
    callback: (payload: EditingStatePayload) => void
  ) => Unsubscribe;
  onStartEditingRequest: (
    callback: (payload: EditPayload) => void
  ) => Unsubscribe;
  onSyncValueRequest: (callback: (payload: EditPayload) => void) => Unsubscribe;
  onSaveEditingRequest: (
    callback: (payload: EditPayload) => void
  ) => Unsubscribe;
  onCancelEditingRequest: (
    callback: (payload: EditPayload) => void
  ) => Unsubscribe;
}

// Runtime guards for payloads coming over IPC. Kept deliberately small; the
// project does not need a validation library.
const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null;

const hasNonEmptyId = (x: Record<string, unknown>) =>
  typeof x.id === 'string' && x.id.length > 0;

export const isClosePayload = (x: unknown): x is ClosePayload =>
  isRecord(x) && hasNonEmptyId(x);

export const isEditPayload = (x: unknown): x is EditPayload =>
  isRecord(x) && hasNonEmptyId(x) && typeof x.value === 'string';

export const isEditingStatePayload = (x: unknown): x is EditingStatePayload =>
  isRecord(x) &&
  hasNonEmptyId(x) &&
  typeof x.value === 'string' &&
  typeof x.isEditing === 'boolean';
