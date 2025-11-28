import { contextBridge, ipcRenderer } from 'electron';

type EditPayload = { id: string; value: string };
type ClosePayload = { id: string };

const exposeListener = <T>(channel: string, callback: (payload: T) => void) => {
  const listener = (_event: Electron.IpcRendererEvent, payload: T) => {
    callback(payload);
  };

  ipcRenderer.on(channel, listener);

  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
};

contextBridge.exposeInMainWorld('electronAPI', {
  openNewWindow: (payload: EditPayload) =>
    ipcRenderer.send('open-new-window', payload),
  updateValue: (payload: EditPayload) =>
    ipcRenderer.send('update-value', payload),
  closeWindow: (payload: ClosePayload) =>
    ipcRenderer.send('close-window', payload),
  requestStartEditing: (payload: EditPayload) =>
    ipcRenderer.send('child-request-edit', payload),
  requestSyncValue: (payload: EditPayload) =>
    ipcRenderer.send('child-sync-edit-value', payload),
  requestSaveEditing: (payload: EditPayload) =>
    ipcRenderer.send('child-save-edit', payload),
  requestCancelEditing: (payload: EditPayload) =>
    ipcRenderer.send('child-cancel-edit', payload),
  requestCurrentValue: () => ipcRenderer.send('child-request-current-value'),
  notifyEditingState: (payload: {
    id: string
    value: string
    isEditing: boolean
  }) => ipcRenderer.send('notify-editing-state', payload),
  onInitValue: (callback: (payload: EditPayload) => void) =>
    exposeListener<EditPayload>('init-value', callback),
  onUpdateValue: (callback: (payload: EditPayload) => void) =>
    exposeListener<EditPayload>('update-value', callback),
  onEditWindowClosed: (callback: (payload: ClosePayload) => void) =>
    exposeListener<ClosePayload>('edit-window-closed', callback),
  onEditingStateChange: (
    callback: (payload: {
      id: string
      value: string
      isEditing: boolean
    }) => void
  ) =>
    exposeListener('editing-state-changed', callback),
  onStartEditingRequest: (callback: (payload: EditPayload) => void) =>
    exposeListener<EditPayload>('child-request-edit', callback),
  onSyncValueRequest: (callback: (payload: EditPayload) => void) =>
    exposeListener<EditPayload>('child-sync-edit-value', callback),
  onSaveEditingRequest: (callback: (payload: EditPayload) => void) =>
    exposeListener<EditPayload>('child-save-edit', callback),
  onCancelEditingRequest: (callback: (payload: EditPayload) => void) =>
    exposeListener<EditPayload>('child-cancel-edit', callback),
});
