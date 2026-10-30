import { BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { IPC, isAction, isWindowRoutePayload } from '../shared/ipc.js';
import { hasDraft } from '../shared/reducer.js';
import { buildRoute, resolveRoute, ROUTES } from '../shared/routes.js';

/** Preload script of every window. CommonJS, so the sandbox can stay on. */
export const PRELOAD_PATH = path.join(import.meta.dirname, 'preload.cjs');

/** The single renderer page; the hash says which screen it shows. */
const INDEX_HTML = path.join(import.meta.dirname, '../renderer/index.html');

/** webPreferences shared by every window. */
export const webPreferences = {
  preload: PRELOAD_PATH,
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
};

/**
 * Size and other options per screen. A route without an entry opens with
 * the BrowserWindow defaults.
 */
export const windowOptions = {
  [ROUTES.home]: { width: 800, height: 600 },
  [ROUTES.message]: { width: 600, height: 400 },
};

/** Child windows keyed by their route, e.g. '/message/abc'. */
const windows = new Map();
let registered = false;

/** Loads `src/renderer/index.html` with `route` in the hash. */
export const loadRoute = (win, route) =>
  win.loadFile(INDEX_HTML, { hash: route });

// Message id of a '/message/:id' route, or null for any other route.
const messageIdOfRoute = (route) => {
  const resolved = resolveRoute(route);
  return resolved?.pattern === ROUTES.message ? resolved.params.id : null;
};

// Route of a message window, or null when the id cannot be part of a route.
const messageRoute = (id) => {
  try {
    return buildRoute(ROUTES.message, { id });
  } catch {
    return null;
  }
};

const hasMessage = (state, id) =>
  state.messages.some((message) => message.id === id);

/**
 * Registers the IPC handlers. `getMainWindow` returns the main window or
 * null; `store` is the one created by `createStore`.
 */
export const registerWindowHandlers = ({ getMainWindow, store }) => {
  if (registered) {
    return;
  }
  registered = true;

  const isMainSender = (sender) => getMainWindow()?.webContents === sender;

  const findChildRouteBySender = (sender) => {
    for (const [route, win] of windows.entries()) {
      if (win.webContents === sender) {
        return route;
      }
    }
    return null;
  };

  // Only the main window and the child windows this module created may talk
  // to these handlers.
  const isKnownSender = (event) =>
    isMainSender(event.sender) || findChildRouteBySender(event.sender) !== null;

  // The main window may do anything. A child window may only edit the
  // message its route points to.
  const isAuthorized = (sender, action) => {
    if (isMainSender(sender)) {
      return true;
    }
    const childRoute = findChildRouteBySender(sender);
    if (childRoute === null) {
      return false;
    }
    const childMessageId = messageIdOfRoute(childRoute);
    switch (action.type) {
      case 'edit/start':
      case 'edit/draft':
      case 'edit/save':
      case 'edit/cancel':
        return childMessageId !== null && action.id === childMessageId;
      default:
        return false;
    }
  };

  const closeChildWindow = (route) => {
    const childWindow = windows.get(route);
    if (childWindow && !childWindow.isDestroyed()) {
      childWindow.close();
    }
  };

  // Whether the route may be opened as a child window right now. The home
  // route is the main window and is never opened twice; a message route
  // needs an existing message.
  const canOpen = (route) => {
    const resolved = resolveRoute(route);
    if (resolved === null || resolved.pattern === ROUTES.home) {
      return false;
    }
    if (resolved.pattern === ROUTES.message) {
      return hasMessage(store.getState(), resolved.params.id);
    }
    return true;
  };

  const openChildWindow = async (route) => {
    const existingWindow = windows.get(route);
    if (existingWindow && !existingWindow.isDestroyed()) {
      existingWindow.focus();
      return;
    }
    if (existingWindow) {
      // Stale entry: the window was destroyed without its 'closed' handler
      // cleaning up. Drop it and create a fresh one.
      windows.delete(route);
    }

    const pattern = resolveRoute(route)?.pattern;
    const childWindow = new BrowserWindow({
      ...(pattern ? windowOptions[pattern] : undefined),
      webPreferences,
    });

    windows.set(route, childWindow);

    // Only drop the map entry if this window still owns the route, so a late
    // callback from an old window cannot evict a replacement for it.
    const forgetIfOwner = () => {
      if (windows.get(route) === childWindow) {
        windows.delete(route);
      }
    };

    // Registered before loading so a window closed mid-load is still cleaned
    // up. Closing a message window discards its draft, which is what takes
    // the main window out of edit mode.
    childWindow.on('closed', () => {
      forgetIfOwner();
      const id = messageIdOfRoute(route);
      if (id !== null && hasDraft(store.getState().editing, id)) {
        store.dispatch({ type: 'edit/cancel', id });
      }
    });

    try {
      await loadRoute(childWindow, route);
    } catch (error) {
      console.error(`Failed to load the window for ${route}:`, error);
      if (!childWindow.isDestroyed()) {
        childWindow.close();
      }
      forgetIfOwner();
    }
    // Nothing is pushed to the child here: it asks for the state on load.
  };

  ipcMain.handle(IPC.STORE_GET, (event) => {
    if (!isKnownSender(event)) {
      throw new Error('Unknown sender.');
    }
    return store.getState();
  });

  ipcMain.on(IPC.STORE_DISPATCH, (event, action) => {
    if (
      !isKnownSender(event) ||
      !isAction(action) ||
      !isAuthorized(event.sender, action)
    ) {
      return;
    }
    store.dispatch(action);
    if (action.type === 'message/delete') {
      const route = messageRoute(action.id);
      if (route !== null) {
        closeChildWindow(route);
      }
    }
  });

  ipcMain.on(IPC.WINDOW_OPEN, (event, payload) => {
    if (
      !isMainSender(event.sender) ||
      !isWindowRoutePayload(payload) ||
      !canOpen(payload.route)
    ) {
      return;
    }
    void openChildWindow(payload.route);
  });

  ipcMain.on(IPC.WINDOW_CLOSE, (event, payload) => {
    if (!isWindowRoutePayload(payload)) {
      return;
    }
    const isOwnWindow = findChildRouteBySender(event.sender) === payload.route;
    if (!isMainSender(event.sender) && !isOwnWindow) {
      return;
    }
    closeChildWindow(payload.route);
  });
};

export const closeAllChildWindows = () => {
  windows.forEach((win) => {
    if (!win.isDestroyed()) {
      win.close();
    }
  });
  windows.clear();
};
