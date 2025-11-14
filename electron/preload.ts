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
  onInitValue: (callback: (payload: EditPayload) => void) =>
    exposeListener<EditPayload>('init-value', callback),
  onUpdateValue: (callback: (payload: EditPayload) => void) =>
    exposeListener<EditPayload>('update-value', callback),
  onEditWindowClosed: (callback: (payload: ClosePayload) => void) =>
    exposeListener<ClosePayload>('edit-window-closed', callback),
});
