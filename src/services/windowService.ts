export type EditPayload = { id: string; value: string };
export type ClosePayload = { id: string };

type Unsubscribe = () => void;

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
  onInitValue(callback: (payload: EditPayload) => void): Unsubscribe {
    return ensureElectronAPI().onInitValue(callback);
  },
  onUpdateValue(callback: (payload: EditPayload) => void): Unsubscribe {
    return ensureElectronAPI().onUpdateValue(callback);
  },
  onEditWindowClosed(callback: (payload: ClosePayload) => void): Unsubscribe {
    return ensureElectronAPI().onEditWindowClosed(callback);
  },
};
