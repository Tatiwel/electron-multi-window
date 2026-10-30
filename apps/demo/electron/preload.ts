import { exposeElectronApi } from '@electron-multi-window/core/preload';

// getState, dispatch, onStateChanged, openWindow and closeWindow as
// window.electronAPI; typed on the renderer side in src/api.ts.
exposeElectronApi();
