import { BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import {
  IPC,
  type ClosePayload,
  type EditPayload,
  type EditingStatePayload,
  type IpcChannel,
} from '../../shared/ipc';

interface RegisterWindowHandlersOptions {
  preloadPath: string;
  devServerUrl?: string;
  rendererDist: string;
  getMainWindow: () => BrowserWindow | null;
  onChildWindowClosed?: (id: string) => void;
}

const windows = new Map<string, BrowserWindow>();
const windowValues = new Map<string, string>();
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

export const registerWindowHandlers = (
  options: RegisterWindowHandlersOptions
) => {
  if (registered) {
    return;
  }
  registered = true;

  const { preloadPath, devServerUrl, rendererDist, getMainWindow } = options;

  const maybeNotifyMainWindow = (payload: ClosePayload) => {
    const mainWindow = getMainWindow();
    mainWindow?.webContents.send(IPC.EDIT_WINDOW_CLOSED, payload);
  };

  const forwardToMainWindow = (channel: IpcChannel) => {
    ipcMain.on(channel, (_event, payload: EditPayload) => {
      const mainWindow = getMainWindow();
      windowValues.set(payload.id, payload.value);
      mainWindow?.webContents.send(channel, payload);
    });
  };

  ipcMain.on(IPC.OPEN_NEW_WINDOW, async (_event, payload: EditPayload) => {
    const { id } = payload;

    const existingWindow = windows.get(id);
    if (existingWindow) {
      existingWindow.focus();
      windowValues.set(id, payload.value);
      existingWindow.webContents.send(IPC.UPDATE_VALUE, payload);
      return;
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
    windowValues.set(id, payload.value);

    const urlOrPath = buildNewWindowUrl(devServerUrl, rendererDist);

    if (devServerUrl) {
      await childWindow.loadURL(urlOrPath);
    } else {
      await childWindow.loadFile(urlOrPath);
    }

    childWindow.webContents.send(IPC.INIT_VALUE, payload);

    childWindow.on('closed', () => {
      windows.delete(id);
      windowValues.delete(id);
      maybeNotifyMainWindow({ id });
      options.onChildWindowClosed?.(id);
    });
  });

  ipcMain.on(IPC.UPDATE_VALUE, (_event, payload: EditPayload) => {
    const { id } = payload;
    windowValues.set(id, payload.value);
    const childWindow = windows.get(id);
    if (childWindow) {
      childWindow.webContents.send(IPC.UPDATE_VALUE, payload);
    }
  });

  ipcMain.on(IPC.CHILD_REQUEST_CURRENT_VALUE, (event) => {
    const sender = event.sender;
    let targetId: string | null = null;
    for (const [id, win] of windows.entries()) {
      if (win.webContents === sender) {
        targetId = id;
        break;
      }
    }

    if (!targetId) {
      return;
    }

    const value = windowValues.get(targetId) ?? '';
    const payload: EditPayload = { id: targetId, value };
    sender.send(IPC.INIT_VALUE, payload);
  });

  ipcMain.on(IPC.CLOSE_WINDOW, (_event, payload: ClosePayload) => {
    const { id } = payload;
    const childWindow = windows.get(id);
    childWindow?.close();
  });

  forwardToMainWindow(IPC.CHILD_REQUEST_EDIT);
  forwardToMainWindow(IPC.CHILD_SYNC_EDIT_VALUE);
  forwardToMainWindow(IPC.CHILD_SAVE_EDIT);
  forwardToMainWindow(IPC.CHILD_CANCEL_EDIT);

  ipcMain.on(
    IPC.NOTIFY_EDITING_STATE,
    (_event, payload: EditingStatePayload) => {
      const { id } = payload;
      const childWindow = windows.get(id);
      windowValues.set(id, payload.value);
      childWindow?.webContents.send(IPC.EDITING_STATE_CHANGED, payload);
    }
  );
};

export const closeAllChildWindows = () => {
  windows.forEach((win) => win.close());
  windows.clear();
  windowValues.clear();
};
