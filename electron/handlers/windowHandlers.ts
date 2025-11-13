import { BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';

interface EditPayload {
  id: string;
  value: string;
}

interface ClosePayload {
  id: string;
}

interface RegisterWindowHandlersOptions {
  preloadPath: string;
  devServerUrl?: string;
  rendererDist: string;
  getMainWindow: () => BrowserWindow | null;
  onChildWindowClosed?: (id: string) => void;
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
    return new URL('newWindow.html', normalized).toString();
  }

  return path.join(rendererDist, 'newWindow.html');
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
    mainWindow?.webContents.send('edit-window-closed', payload);
  };

  ipcMain.on('open-new-window', async (_event, payload: EditPayload) => {
    const { id } = payload;

    const existingWindow = windows.get(id);
    if (existingWindow) {
      existingWindow.focus();
      existingWindow.webContents.send('update-value', payload);
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

    const urlOrPath = buildNewWindowUrl(devServerUrl, rendererDist);

    if (devServerUrl) {
      await childWindow.loadURL(urlOrPath);
    } else {
      await childWindow.loadFile(urlOrPath);
    }

    childWindow.webContents.send('init-value', payload);

    childWindow.on('closed', () => {
      windows.delete(id);
      maybeNotifyMainWindow({ id });
      options.onChildWindowClosed?.(id);
    });
  });

  ipcMain.on('update-value', (_event, payload: EditPayload) => {
    const { id } = payload;
    const childWindow = windows.get(id);
    if (childWindow) {
      childWindow.webContents.send('update-value', payload);
    }
  });

  ipcMain.on('close-window', (_event, payload: ClosePayload) => {
    const { id } = payload;
    const childWindow = windows.get(id);
    childWindow?.close();
  });
};

export const closeAllChildWindows = () => {
  windows.forEach((win) => win.close());
  windows.clear();
};
