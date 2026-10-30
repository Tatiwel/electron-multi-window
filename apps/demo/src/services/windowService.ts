import type { Unsubscribe } from '@electron-multi-window/core/shared';
import type { Action, AppState } from '../../shared/ipc';

export type { Action, AppState, Message } from '../../shared/ipc';

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
  /** Opens, or focuses, the window of a resolved route ('/message/abc'). */
  openWindow(route: string) {
    ensureElectronAPI().openWindow(route);
  },
  closeWindow(route: string) {
    ensureElectronAPI().closeWindow(route);
  },
};
