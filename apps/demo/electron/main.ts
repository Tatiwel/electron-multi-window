import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  closeAllChildWindows,
  loadRoute,
  registerWindowHandlers,
  windowOptions,
} from './handlers/windowHandlers';
import { createStore } from './store';
import { initialState } from '../shared/reducer';
import { ROUTES } from '../shared/routes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let mainWindow: BrowserWindow | null = null;

// The main process is the single source of truth for the application state.
const store = createStore(initialState);

registerWindowHandlers({
  preloadPath: path.join(__dirname, 'preload.mjs'),
  devServerUrl: VITE_DEV_SERVER_URL,
  rendererDist: RENDERER_DIST,
  getMainWindow: () => mainWindow,
  store,
});

function createWindow() {
  mainWindow = new BrowserWindow({
    ...windowOptions[ROUTES.home],
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // dist/index.html (or the dev server) with the home route in the hash.
  void loadRoute(mainWindow, ROUTES.home, VITE_DEV_SERVER_URL, RENDERER_DIST);

  mainWindow.on('closed', () => {
    mainWindow = null;
    closeAllChildWindows();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    mainWindow = null;
    closeAllChildWindows();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
