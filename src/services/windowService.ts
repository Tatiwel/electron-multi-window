import type {
  Action,
  AppState,
  Unsubscribe,
  WindowContext,
} from '../../shared/ipc';

export type {
  Action,
  AppState,
  Message,
  WindowContext,
} from '../../shared/ipc';

const ensureElectronAPI = () => {
  if (!window.electronAPI) {
    throw new Error('electronAPI is unavailable in the current context.');
  }

  return window.electronAPI;
};

/** Thin wrapper over `window.electronAPI`, the bridge exposed by the preload. */
export const windowService = {
  getState(): Promise<AppState> {
    return ensureElectronAPI().getState();
  },
  dispatch(action: Action) {
    ensureElectronAPI().dispatch(action);
  },
  onStateChanged(callback: (state: AppState) => void): Unsubscribe {
    return ensureElectronAPI().onStateChanged(callback);
  },
  openWindow(id: string) {
    ensureElectronAPI().openWindow(id);
  },
  closeWindow(id: string) {
    ensureElectronAPI().closeWindow(id);
  },
  getWindowContext(): Promise<WindowContext | null> {
    return ensureElectronAPI().getWindowContext();
  },
};
