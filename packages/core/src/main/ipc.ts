import { ipcMain, type BrowserWindow, type WebContents } from 'electron';
import {
  CHANNELS,
  isWindowRoutePayload,
  type ResolvedRoute,
  type RouteParams,
} from '../shared/index.js';
import type { Store } from './store.js';
import type { WindowManager } from './windowManager.js';

/** Who sent an IPC message: the main window, or a managed window. */
export type SenderContext<P extends string = string> =
  | { kind: 'main' }
  | { kind: 'child'; route: string; pattern: P; params: RouteParams };

export interface RegisterIpcOptions<S, A, P extends string> {
  store: Store<S, A>;
  windows: WindowManager<P>;
  getMainWindow: () => BrowserWindow | null;
  /** Validates an untrusted `store:dispatch` payload. */
  isAction: (x: unknown) => x is A;
  /** Decides whether the sender may dispatch `action`. */
  authorize: (ctx: SenderContext<P>, action: A) => boolean;
  /**
   * Decides whether the main window may open `route` right now. Without it
   * every route that resolves may be opened.
   */
  canOpenWindow?: (route: string, resolved: ResolvedRoute<P>) => boolean;
}

/**
 * Registers the `store:*` and `window:*` handlers. Only the main window and
 * the windows of `windows` may talk to them; only the main window may open
 * windows; a window may close itself, the main window may close any.
 * Returns a function that removes the handlers.
 */
export const registerIpc = <S, A, P extends string>(
  options: RegisterIpcOptions<S, A, P>
) => {
  const { store, windows, getMainWindow, isAction, authorize, canOpenWindow } =
    options;

  const isMainSender = (sender: WebContents) => {
    const main = getMainWindow();
    return main !== null && !main.isDestroyed() && main.webContents === sender;
  };

  const contextOf = (sender: WebContents): SenderContext<P> | null => {
    if (isMainSender(sender)) {
      return { kind: 'main' };
    }
    const route = windows.getRoute(sender);
    const resolved = route === null ? null : windows.routes.resolveRoute(route);
    if (route === null || resolved === null) {
      return null;
    }
    return {
      kind: 'child',
      route,
      pattern: resolved.pattern,
      params: resolved.params,
    };
  };

  ipcMain.handle(CHANNELS.STORE_GET, (event) => {
    if (contextOf(event.sender) === null) {
      throw new Error('Unknown sender.');
    }
    return store.getState();
  });

  ipcMain.on(CHANNELS.STORE_DISPATCH, (event, action: unknown) => {
    const ctx = contextOf(event.sender);
    if (ctx === null || !isAction(action) || !authorize(ctx, action)) {
      return;
    }
    store.dispatch(action);
  });

  ipcMain.on(CHANNELS.WINDOW_OPEN, (event, payload: unknown) => {
    if (!isMainSender(event.sender) || !isWindowRoutePayload(payload)) {
      return;
    }
    const resolved = windows.routes.resolveRoute(payload.route);
    if (
      resolved === null ||
      (canOpenWindow && !canOpenWindow(payload.route, resolved))
    ) {
      return;
    }
    windows.open(payload.route);
  });

  ipcMain.on(CHANNELS.WINDOW_CLOSE, (event, payload: unknown) => {
    if (!isWindowRoutePayload(payload)) {
      return;
    }
    const isOwnWindow = windows.getRoute(event.sender) === payload.route;
    if (!isMainSender(event.sender) && !isOwnWindow) {
      return;
    }
    windows.close(payload.route);
  });

  return () => {
    ipcMain.removeHandler(CHANNELS.STORE_GET);
    ipcMain.removeAllListeners(CHANNELS.STORE_DISPATCH);
    ipcMain.removeAllListeners(CHANNELS.WINDOW_OPEN);
    ipcMain.removeAllListeners(CHANNELS.WINDOW_CLOSE);
  };
};
