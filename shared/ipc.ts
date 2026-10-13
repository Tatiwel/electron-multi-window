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
  CHILD_REQUEST_CURRENT_VALUE: 'child-request-current-value',
  NOTIFY_EDITING_STATE: 'notify-editing-state',
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
  requestCurrentValue: () => void;
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
