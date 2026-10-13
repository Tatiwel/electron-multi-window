import type {
  ClosePayload,
  EditPayload,
  EditingStatePayload,
  Unsubscribe,
} from '../../shared/ipc';

export type {
  ClosePayload,
  EditPayload,
  EditingStatePayload,
} from '../../shared/ipc';

const ensureElectronAPI = () => {
  if (!window.electronAPI) {
    throw new Error('electronAPI is unavailable in the current context.');
  }

  return window.electronAPI;
};

export const windowService = {
  openEditWindow(payload: EditPayload) {
    ensureElectronAPI().openNewWindow(payload);
  },
  syncEditValue(payload: EditPayload) {
    ensureElectronAPI().updateValue(payload);
  },
  closeEditWindow(payload: ClosePayload) {
    ensureElectronAPI().closeWindow(payload);
  },
  requestStartEditing(payload: EditPayload) {
    ensureElectronAPI().requestStartEditing(payload);
  },
  requestSyncValue(payload: EditPayload) {
    ensureElectronAPI().requestSyncValue(payload);
  },
  requestSaveEditing(payload: EditPayload) {
    ensureElectronAPI().requestSaveEditing(payload);
  },
  requestCancelEditing(payload: EditPayload) {
    ensureElectronAPI().requestCancelEditing(payload);
  },
  requestCurrentValue() {
    ensureElectronAPI().requestCurrentValue();
  },
  notifyEditingState(payload: EditingStatePayload) {
    ensureElectronAPI().notifyEditingState(payload);
  },
  onInitValue(callback: (payload: EditPayload) => void): Unsubscribe {
    return ensureElectronAPI().onInitValue(callback);
  },
  onUpdateValue(callback: (payload: EditPayload) => void): Unsubscribe {
    return ensureElectronAPI().onUpdateValue(callback);
  },
  onEditWindowClosed(callback: (payload: ClosePayload) => void): Unsubscribe {
    return ensureElectronAPI().onEditWindowClosed(callback);
  },
  onEditingStateChange(
    callback: (payload: EditingStatePayload) => void
  ): Unsubscribe {
    return ensureElectronAPI().onEditingStateChange(callback);
  },
  onStartEditingRequest(callback: (payload: EditPayload) => void): Unsubscribe {
    return ensureElectronAPI().onStartEditingRequest(callback);
  },
  onSyncValueRequest(callback: (payload: EditPayload) => void): Unsubscribe {
    return ensureElectronAPI().onSyncValueRequest(callback);
  },
  onSaveEditingRequest(callback: (payload: EditPayload) => void): Unsubscribe {
    return ensureElectronAPI().onSaveEditingRequest(callback);
  },
  onCancelEditingRequest(callback: (payload: EditPayload) => void): Unsubscribe {
    return ensureElectronAPI().onCancelEditingRequest(callback);
  },
};
