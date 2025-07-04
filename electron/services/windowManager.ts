import { BrowserWindow } from 'electron';
import path from 'node:path';
import {
  createMainWindow,
  MainWindowOptions,
} from '../windows/mainWindow';
import { createChildWindow } from '../windows/childWindow';

export interface WindowManagerOptions extends MainWindowOptions {}

export class WindowManager {
  private windows: Record<string, BrowserWindow> = {};
  private mainWindow: BrowserWindow | null = null;
  private readonly options: WindowManagerOptions;

  constructor(options: WindowManagerOptions) {
    this.options = options;
  }

  createMainWindow() {
    this.mainWindow = createMainWindow(this.options);

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
    const win = createChildWindow(this.options);
    this.windows[id] = win;

    const load = async () => {
      if (this.options.VITE_DEV_SERVER_URL) {
        await win.loadURL(this.options.VITE_DEV_SERVER_URL + '/newwindow.html');
      } else {
        await win.loadFile(
          path.join(this.options.RENDERER_DIST, 'newwindow.html')
        );
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
