export type EditPayload = { id: string; value: string };
export type ClosePayload = { id: string };
export type EditingStatePayload = {
  id: string;
  value: string;
  isEditing: boolean;
};

type Unsubscribe = () => void;

/**
 * Legacy electronAPI interface for backwards compatibility
 */
interface LegacyElectronAPI {
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
  onEditWindowClosed: (callback: (payload: ClosePayload) => void) => Unsubscribe;
  onEditingStateChange: (callback: (payload: EditingStatePayload) => void) => Unsubscribe;
  onStartEditingRequest: (callback: (payload: EditPayload) => void) => Unsubscribe;
  onSyncValueRequest: (callback: (payload: EditPayload) => void) => Unsubscribe;
  onSaveEditingRequest: (callback: (payload: EditPayload) => void) => Unsubscribe;
  onCancelEditingRequest: (callback: (payload: EditPayload) => void) => Unsubscribe;
}

const ensureElectronAPI = (): LegacyElectronAPI => {
  const api = (window as unknown as { electronAPI?: LegacyElectronAPI }).electronAPI;
  if (!api) {
    throw new Error('electronAPI is unavailable in the current context.');
  }
  return api;
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
