export type Unsubscribe = () => void;

/**
 * Payload of `window:open` and `window:close`: an already resolved route,
 * such as '/message/abc'.
 */
export type WindowRoutePayload = { route: string };

/**
 * Shape of the bridge the preload exposes on `window`, for a state `S` and
 * an action `A`.
 */
export interface ElectronApi<S, A> {
  /** Resolves with the whole state held by the main process. */
  getState: () => Promise<S>;
  dispatch: (action: A) => void;
  onStateChanged: (callback: (state: S) => void) => Unsubscribe;
  /** Opens, or focuses, the window of the given route. */
  openWindow: (route: string) => void;
  /** Closes the window of the given route. */
  closeWindow: (route: string) => void;
}
