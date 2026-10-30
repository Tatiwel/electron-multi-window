import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import { BRIDGE_KEY, CHANNELS, type ElectronApi } from '../shared/index.js';

/**
 * Exposes `getState`, `dispatch`, `onStateChanged`, `openWindow` and
 * `closeWindow` as `window.electronAPI`. Call it once from the preload
 * script. The bridge is untyped here; the renderer types it with
 * `createRendererApi<S, A>()`.
 */
export const exposeElectronApi = () => {
  const api: ElectronApi<unknown, unknown> = {
    getState: () => ipcRenderer.invoke(CHANNELS.STORE_GET),
    dispatch: (action) => ipcRenderer.send(CHANNELS.STORE_DISPATCH, action),
    onStateChanged: (callback) => {
      const listener = (_event: IpcRendererEvent, state: unknown) => {
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

  contextBridge.exposeInMainWorld(BRIDGE_KEY, api);
};
