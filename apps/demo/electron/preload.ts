import { contextBridge, ipcRenderer } from 'electron';
import { IPC, type AppState, type ElectronAPI } from '../shared/ipc';

const electronAPI: ElectronAPI = {
  getState: () => ipcRenderer.invoke(IPC.STORE_GET),
  dispatch: (action) => ipcRenderer.send(IPC.STORE_DISPATCH, action),
  onStateChanged: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, state: AppState) => {
      callback(state);
    };
    ipcRenderer.on(IPC.STORE_CHANGED, listener);
    return () => {
      ipcRenderer.removeListener(IPC.STORE_CHANGED, listener);
    };
  },
  openWindow: (route) => ipcRenderer.send(IPC.WINDOW_OPEN, { route }),
  closeWindow: (route) => ipcRenderer.send(IPC.WINDOW_CLOSE, { route }),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
