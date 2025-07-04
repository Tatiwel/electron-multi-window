import { BrowserWindow } from 'electron';
import path from 'node:path';

export class WindowManager {
  private windows: Record<string, BrowserWindow> = {};
  private mainWindow: BrowserWindow | null = null;
  private readonly VITE_DEV_SERVER_URL: string | undefined;
  private readonly RENDERER_DIST: string;
  private readonly VITE_PUBLIC: string;
  private readonly __dirname: string;

  constructor(options: {
    viteDevServerUrl: string | undefined;
    rendererDist: string;
    vitePublic: string;
    dirname: string;
  }) {
    this.VITE_DEV_SERVER_URL = options.viteDevServerUrl;
    this.RENDERER_DIST = options.rendererDist;
    this.VITE_PUBLIC = options.vitePublic;
    this.__dirname = options.dirname;
  }

  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      icon: path.join(this.VITE_PUBLIC, 'electron-vite.svg'),
      webPreferences: {
        preload: path.join(this.__dirname, 'preload.mjs'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    if (this.VITE_DEV_SERVER_URL) {
      this.mainWindow.loadURL(this.VITE_DEV_SERVER_URL);
    } else {
      this.mainWindow.loadFile(path.join(this.RENDERER_DIST, 'index.html'));
    }

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
      Object.values(this.windows).forEach((win) => win.close());
    });
  }

  getMainWindow() {
    return this.mainWindow;
  }

  openWindow(
    id: string,
    value: string,
    onReady?: (win: BrowserWindow) => void
  ) {
    if (this.windows[id]) {
      this.windows[id].focus();
      return;
    }
    const win = new BrowserWindow({
      width: 600,
      height: 400,
      webPreferences: {
        preload: path.join(this.__dirname, 'preload.mjs'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    this.windows[id] = win;

    const load = async () => {
      if (this.VITE_DEV_SERVER_URL) {
        await win.loadURL(this.VITE_DEV_SERVER_URL + '/newwindow.html');
      } else {
        await win.loadFile(path.join(this.RENDERER_DIST, 'newwindow.html'));
      }
      win.webContents.send('init-value', value);
      if (onReady) onReady(win);
    };
    load();

    win.on('closed', () => {
      delete this.windows[id];
    });
  }

  updateValue(id: string, value: string) {
    const win = this.windows[id];
    if (win) {
      win.webContents.send('update-value', value);
    }
  }

  closeWindow(id: string) {
    const win = this.windows[id];
    if (win) {
      win.close();
      delete this.windows[id];
    }
  }
}
