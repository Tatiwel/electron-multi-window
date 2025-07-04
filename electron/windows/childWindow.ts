import { BrowserWindow } from 'electron';
import path from 'node:path';

export interface ChildWindowOptions {
  VITE_DEV_SERVER_URL?: string;
  RENDERER_DIST: string;
  dirname: string;
}

export function createChildWindow(options: ChildWindowOptions): BrowserWindow {
  const win = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(options.dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  return win;
}
