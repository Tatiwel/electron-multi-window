import { BrowserWindow } from 'electron';
import path from 'node:path';

export interface MainWindowOptions {
  VITE_DEV_SERVER_URL?: string;
  RENDERER_DIST: string;
  VITE_PUBLIC: string;
  dirname: string;
}

export function createMainWindow(options: MainWindowOptions): BrowserWindow {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(options.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(options.dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (options.VITE_DEV_SERVER_URL) {
    win.loadURL(options.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(options.RENDERER_DIST, 'index.html'));
  }

  return win;
}
