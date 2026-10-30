import {
  createRendererApi,
  useStore,
} from '@electron-multi-window/core/renderer';
import type { Action, AppState } from '../shared/ipc';
import { initialState } from '../shared/reducer';

export type { Action, AppState, Message } from '../shared/ipc';

/** Typed `window.electronAPI`, the bridge exposed by the preload. */
export const api = createRendererApi<AppState, Action>();

/** Mirror of the main-process state and a `dispatch` to change it. */
export const useAppStore = () => useStore(api, initialState);
