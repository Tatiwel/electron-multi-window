import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createWindowManager, type WindowManager } from '../lib/main';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let mainWindow: BrowserWindow | null = null;
let windowManager: WindowManager | null = null;

// Initialize window manager with the new library
windowManager = createWindowManager({
  preloadPath: path.join(__dirname, 'preload.mjs'),
  devServerUrl: VITE_DEV_SERVER_URL,
  rendererDist: RENDERER_DIST,
  defaultOptions: {
    width: 600,
    height: 400,
  },
});

// Optional: Listen to window creation events
windowManager.onWindowCreated((id) => {
  console.log(`Window created: ${id}`);
});

windowManager.onWindowClosed((id) => {
  console.log(`Window closed: ${id}`);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(process.env.VITE_PUBLIC ?? '', 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    const devEntryUrl = new URL(
      'html/index.html',
      VITE_DEV_SERVER_URL.endsWith('/')
        ? VITE_DEV_SERVER_URL
        : `${VITE_DEV_SERVER_URL}/`
    ).toString();
    mainWindow.loadURL(devEntryUrl);
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    windowManager?.closeAllWindows();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    mainWindow = null;
    windowManager?.closeAllWindows();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
