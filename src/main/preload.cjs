// CommonJS on purpose: an ES module preload needs the sandbox turned off,
// and every window keeps it on.
const { contextBridge, ipcRenderer } = require('electron');

// Same names as IPC in src/shared/ipc.js, which a sandboxed preload cannot
// import. Keep both in sync.
const IPC = {
  STORE_GET: 'store:get',
  STORE_DISPATCH: 'store:dispatch',
  STORE_CHANGED: 'store:changed',
  WINDOW_OPEN: 'window:open',
  WINDOW_CLOSE: 'window:close',
};

contextBridge.exposeInMainWorld('electronAPI', {
  getState: () => ipcRenderer.invoke(IPC.STORE_GET),
  dispatch: (action) => ipcRenderer.send(IPC.STORE_DISPATCH, action),
  onStateChanged: (callback) => {
    const listener = (_event, state) => {
      callback(state);
    };
    ipcRenderer.on(IPC.STORE_CHANGED, listener);
    return () => {
      ipcRenderer.removeListener(IPC.STORE_CHANGED, listener);
    };
  },
  openWindow: (route) => ipcRenderer.send(IPC.WINDOW_OPEN, { route }),
  closeWindow: (route) => ipcRenderer.send(IPC.WINDOW_CLOSE, { route }),
});
