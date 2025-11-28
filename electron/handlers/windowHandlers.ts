import { BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';

interface EditPayload {
  id: string;
  value: string;
}

interface ClosePayload {
  id: string;
}

interface EditingStatePayload {
  id: string;
  value: string;
  isEditing: boolean;
}

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

  const forwardToMainWindow = (channel: string) => {
    ipcMain.on(channel, (_event, payload: EditPayload) => {
      const mainWindow = getMainWindow();
      windowValues.set(payload.id, payload.value);
      mainWindow?.webContents.send(channel, payload);
    });
  };

  ipcMain.on('open-new-window', async (_event, payload: EditPayload) => {
    const { id } = payload;

    const existingWindow = windows.get(id);
    if (existingWindow) {
      existingWindow.focus();
      windowValues.set(id, payload.value);
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
    windowValues.set(id, payload.value);

    const urlOrPath = buildNewWindowUrl(devServerUrl, rendererDist);

    if (devServerUrl) {
      await childWindow.loadURL(urlOrPath);
    } else {
      await childWindow.loadFile(urlOrPath);
    }

    childWindow.webContents.send('init-value', payload);

    childWindow.on('closed', () => {
      windows.delete(id);
      windowValues.delete(id);
      maybeNotifyMainWindow({ id });
      options.onChildWindowClosed?.(id);
    });
  });

  ipcMain.on('update-value', (_event, payload: EditPayload) => {
    const { id } = payload;
    windowValues.set(id, payload.value);
    const childWindow = windows.get(id);
    if (childWindow) {
      childWindow.webContents.send('update-value', payload);
    }
  });

  ipcMain.on('child-request-current-value', (event) => {
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
    sender.send('init-value', { id: targetId, value });
  });

  ipcMain.on('close-window', (_event, payload: ClosePayload) => {
    const { id } = payload;
    const childWindow = windows.get(id);
    childWindow?.close();
  });

  forwardToMainWindow('child-request-edit');
  forwardToMainWindow('child-sync-edit-value');
  forwardToMainWindow('child-save-edit');
  forwardToMainWindow('child-cancel-edit');

  ipcMain.on('notify-editing-state', (_event, payload: EditingStatePayload) => {
    const { id } = payload;
    const childWindow = windows.get(id);
    windowValues.set(id, payload.value);
    childWindow?.webContents.send('editing-state-changed', payload);
  });
};

export const closeAllChildWindows = () => {
  windows.forEach((win) => win.close());
  windows.clear();
  windowValues.clear();
};
