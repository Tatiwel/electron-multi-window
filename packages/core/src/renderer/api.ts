import { BRIDGE_KEY, type ElectronApi } from '../shared/index.js';

const bridge = () => {
  const api = (globalThis as Record<string, unknown>)[BRIDGE_KEY];
  if (api === undefined) {
    throw new Error('The preload bridge is unavailable in this context.');
  }
  return api as ElectronApi<unknown, unknown>;
};

/**
 * Typed view of the bridge exposed by `exposeElectronApi()`. The bridge is
 * looked up on every call, so the api can be created at module load and
 * still throw a clear error when used outside a window with the preload.
 */
export const createRendererApi = <S, A>(): ElectronApi<S, A> => ({
  getState: () => bridge().getState() as Promise<S>,
  dispatch: (action) => bridge().dispatch(action),
  onStateChanged: (callback) =>
    bridge().onStateChanged((state) => callback(state as S)),
  openWindow: (route) => bridge().openWindow(route),
  closeWindow: (route) => bridge().closeWindow(route),
});
