import { BrowserWindow, ipcMain, type WebContents } from 'electron';
import path from 'node:path';
import {
  IPC,
  isAction,
  isMessageId,
  type Action,
  type AppState,
  type WindowContext,
} from '../../shared/ipc';
import type { Store } from '../store';

interface RegisterWindowHandlersOptions {
  preloadPath: string;
  devServerUrl?: string;
  rendererDist: string;
  getMainWindow: () => BrowserWindow | null;
  store: Store;
}

const windows = new Map<string, BrowserWindow>();
let registered = false;

const buildNewWindowUrl = (
  devServerUrl: string | undefined,
  rendererDist: string
) => {
  if (devServerUrl) {
    const normalized = devServerUrl.endsWith('/')
      ? devServerUrl
      : `${devServerUrl}/`;
    return new URL('html/newWindow.html', normalized).toString();
  }

  return path.join(rendererDist, 'html', 'newWindow.html');
};

const hasMessage = (state: AppState, id: string) =>
  state.messages.some((message) => message.id === id);

export const registerWindowHandlers = (
  options: RegisterWindowHandlersOptions
) => {
  if (registered) {
    return;
  }
  registered = true;

  const { preloadPath, devServerUrl, rendererDist, getMainWindow, store } =
    options;

  const isMainSender = (sender: WebContents) =>
    getMainWindow()?.webContents === sender;

  const findChildIdBySender = (sender: WebContents) => {
    for (const [id, win] of windows.entries()) {
      if (win.webContents === sender) {
        return id;
      }
    }
    return null;
  };

  // Only the main window and the child windows this module created may talk
  // to these handlers.
  const isKnownSender = (event: { sender: WebContents }) =>
    isMainSender(event.sender) || findChildIdBySender(event.sender) !== null;

  // The main window may do anything. A child window may only edit the
  // message it was opened for.
  const isAuthorized = (sender: WebContents, action: Action) => {
    if (isMainSender(sender)) {
      return true;
    }
    const childId = findChildIdBySender(sender);
    if (childId === null) {
      return false;
    }
    switch (action.type) {
      case 'edit/start':
      case 'edit/draft':
      case 'edit/save':
      case 'edit/cancel':
        return action.id === childId;
      default:
        return false;
    }
  };

  const closeChildWindow = (id: string) => {
    const childWindow = windows.get(id);
    if (childWindow && !childWindow.isDestroyed()) {
      childWindow.close();
    }
  };

  const openChildWindow = async (id: string) => {
    const existingWindow = windows.get(id);
    if (existingWindow && !existingWindow.isDestroyed()) {
      existingWindow.focus();
      return;
    }
    if (existingWindow) {
      // Stale entry: the window was destroyed without its 'closed' handler
      // cleaning up. Drop it and create a fresh one.
      windows.delete(id);
    }

    const childWindow = new BrowserWindow({
      width: 600,
      height: 400,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    windows.set(id, childWindow);

    // Only drop the map entry if this window still owns the id, so a late
    // callback from an old window cannot evict a replacement with the same id.
    const forgetIfOwner = () => {
      if (windows.get(id) === childWindow) {
        windows.delete(id);
      }
    };

    // Registered before loading so a window closed mid-load is still cleaned
    // up. Closing a child discards its draft, which is what takes the main
    // window out of edit mode.
    childWindow.on('closed', () => {
      forgetIfOwner();
      if (id in store.getState().editing) {
        store.dispatch({ type: 'edit/cancel', id });
      }
    });

    const urlOrPath = buildNewWindowUrl(devServerUrl, rendererDist);

    try {
      if (devServerUrl) {
        await childWindow.loadURL(urlOrPath);
      } else {
        await childWindow.loadFile(urlOrPath);
      }
    } catch (error) {
      console.error(`Failed to load the edit window for ${id}:`, error);
      if (!childWindow.isDestroyed()) {
        childWindow.close();
      }
      forgetIfOwner();
    }
    // Nothing is pushed to the child here: it asks for the state on mount.
  };

  ipcMain.handle(IPC.STORE_GET, (event): AppState => {
    if (!isKnownSender(event)) {
      throw new Error('Unknown sender.');
    }
    return store.getState();
  });

  ipcMain.on(IPC.STORE_DISPATCH, (event, action: unknown) => {
    if (
      !isKnownSender(event) ||
      !isAction(action) ||
      !isAuthorized(event.sender, action)
    ) {
      return;
    }
    store.dispatch(action);
    if (action.type === 'message/delete') {
      closeChildWindow(action.id);
    }
  });

  ipcMain.handle(IPC.WINDOW_CONTEXT, (event): WindowContext | null => {
    const messageId = findChildIdBySender(event.sender);
    return messageId === null ? null : { messageId };
  });

  ipcMain.on(IPC.WINDOW_OPEN, (event, id: unknown) => {
    if (
      !isMainSender(event.sender) ||
      !isMessageId(id) ||
      !hasMessage(store.getState(), id)
    ) {
      return;
    }
    void openChildWindow(id);
  });

  ipcMain.on(IPC.WINDOW_CLOSE, (event, id: unknown) => {
    if (!isMessageId(id)) {
      return;
    }
    const isOwnWindow = findChildIdBySender(event.sender) === id;
    if (!isMainSender(event.sender) && !isOwnWindow) {
      return;
    }
    closeChildWindow(id);
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
