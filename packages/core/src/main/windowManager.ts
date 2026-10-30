import {
  BrowserWindow,
  type BrowserWindowConstructorOptions,
  type WebContents,
} from 'electron';
import type { Routes } from '../shared/index.js';

export interface WindowManagerOptions<P extends string> {
  routes: Routes<P>;
  /**
   * Size and other options per pattern. A pattern without an entry opens
   * with the BrowserWindow defaults. `preload`, `contextIsolation` and
   * `nodeIntegration` are always set by the manager.
   */
  windowOptions?: Partial<Record<P, BrowserWindowConstructorOptions>>;
  preloadPath: string;
  /** Built `index.html`, loaded with the route as its hash. */
  indexHtmlPath: string;
  /** When set, windows load `devServerUrl#route` instead of the file. */
  devServerUrl?: string;
  /** Called once the window of `route` has closed and been forgotten. */
  onWindowClosed?: (route: string) => void;
}

export interface ManagedWindow {
  route: string;
  window: BrowserWindow;
}

export interface WindowManager<P extends string> {
  routes: Routes<P>;
  /**
   * Opens the window of a resolved route ('/message/abc'), or focuses it if
   * it is already open. Returns null when the route matches no pattern. The
   * page loads in the background; a window that fails to load is closed.
   */
  open: (route: string) => BrowserWindow | null;
  close: (route: string) => void;
  /** Focuses the window of `route`; false when it is not open. */
  focus: (route: string) => boolean;
  /** Route of the window that owns `webContents`, or null. */
  getRoute: (webContents: WebContents) => string | null;
  getAll: () => ManagedWindow[];
  closeAll: () => void;
}

/** Keeps one BrowserWindow per route and loads each with its hash route. */
export const createWindowManager = <P extends string>(
  options: WindowManagerOptions<P>
): WindowManager<P> => {
  const {
    routes,
    windowOptions,
    preloadPath,
    indexHtmlPath,
    devServerUrl,
    onWindowClosed,
  } = options;

  const windows = new Map<string, BrowserWindow>();

  const isAlive = (win: BrowserWindow | undefined): win is BrowserWindow =>
    win !== undefined && !win.isDestroyed();

  const load = (win: BrowserWindow, route: string) =>
    devServerUrl
      ? win.loadURL(`${devServerUrl}#${route}`)
      : win.loadFile(indexHtmlPath, { hash: route });

  const focus = (route: string) => {
    const win = windows.get(route);
    if (!isAlive(win)) {
      return false;
    }
    win.focus();
    return true;
  };

  const open = (route: string) => {
    const resolved = routes.resolveRoute(route);
    if (resolved === null) {
      return null;
    }

    const existing = windows.get(route);
    if (isAlive(existing)) {
      existing.focus();
      return existing;
    }
    if (existing) {
      // Stale entry: the window was destroyed without its 'closed' handler
      // cleaning up. Drop it and create a fresh one.
      windows.delete(route);
    }

    const perPattern = windowOptions?.[resolved.pattern];
    const win = new BrowserWindow({
      ...perPattern,
      webPreferences: {
        ...perPattern?.webPreferences,
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    windows.set(route, win);

    // Only drop the map entry if this window still owns the route, so a late
    // callback from an old window cannot evict a replacement for it.
    const forgetIfOwner = () => {
      if (windows.get(route) === win) {
        windows.delete(route);
      }
    };

    // Registered before loading so a window closed mid-load is still cleaned
    // up.
    win.on('closed', () => {
      forgetIfOwner();
      onWindowClosed?.(route);
    });

    load(win, route).catch((error: unknown) => {
      console.error(`Failed to load the window for ${route}:`, error);
      if (!win.isDestroyed()) {
        win.close();
      }
      forgetIfOwner();
    });

    return win;
  };

  const close = (route: string) => {
    const win = windows.get(route);
    if (isAlive(win)) {
      win.close();
    }
  };

  const getRoute = (webContents: WebContents) => {
    for (const [route, win] of windows) {
      if (isAlive(win) && win.webContents === webContents) {
        return route;
      }
    }
    return null;
  };

  const getAll = () =>
    [...windows]
      .filter(([, win]) => isAlive(win))
      .map(([route, win]) => ({ route, window: win }));

  const closeAll = () => {
    const open = [...windows.values()];
    windows.clear();
    for (const win of open) {
      if (!win.isDestroyed()) {
        win.close();
      }
    }
  };

  return { routes, open, close, focus, getRoute, getAll, closeAll };
};
