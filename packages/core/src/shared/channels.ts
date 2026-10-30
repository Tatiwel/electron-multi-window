/** IPC channel names used by the main process, the preload and the renderer. */
export const CHANNELS = {
  // renderer -> main (invoke/handle)
  STORE_GET: 'store:get',
  // renderer -> main
  STORE_DISPATCH: 'store:dispatch',
  // main -> renderers
  STORE_CHANGED: 'store:changed',
  // renderer -> main
  WINDOW_OPEN: 'window:open',
  WINDOW_CLOSE: 'window:close',
} as const;

export type Channel = (typeof CHANNELS)[keyof typeof CHANNELS];

/** Global name under which the preload exposes the bridge to the renderer. */
export const BRIDGE_KEY = 'electronAPI';
