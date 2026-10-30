import { contextBridge, ipcRenderer } from 'electron';
import { CHANNELS } from '@electron-multi-window/core/shared';
import type { AppState, ElectronAPI } from '../shared/ipc';

const electronAPI: ElectronAPI = {
  getState: () => ipcRenderer.invoke(CHANNELS.STORE_GET),
  dispatch: (action) => ipcRenderer.send(CHANNELS.STORE_DISPATCH, action),
  onStateChanged: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, state: AppState) => {
      callback(state);
    };
    ipcRenderer.on(CHANNELS.STORE_CHANGED, listener);
    return () => {
      ipcRenderer.removeListener(CHANNELS.STORE_CHANGED, listener);
    };
  },
  openWindow: (route) => ipcRenderer.send(CHANNELS.WINDOW_OPEN, { route }),
  closeWindow: (route) => ipcRenderer.send(CHANNELS.WINDOW_CLOSE, { route }),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
