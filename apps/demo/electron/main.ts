import { app, BrowserWindow } from 'electron';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  createStore,
  createWindowManager,
  registerIpc,
} from '@electron-multi-window/core/main';
import { isAction, type Action, type AppState } from '../shared/ipc';
import { initialState, reducer } from '../shared/reducer';
import { ROUTES, routes } from '../shared/routes';
import {
  authorize,
  canOpenWindow,
  closeWindowsOfDeletedMessages,
  discardDraftOfClosedWindow,
  windowOptions,
} from './rules';

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
// The reducer stays pure: the id of a new message is generated here.
const store = createStore<AppState, Action>(
  (state, action) =>
    reducer(
      state,
      action.type === 'message/create'
        ? { ...action, id: randomUUID() }
        : action
    ),
  initialState
);

const windows = createWindowManager({
  routes,
  windowOptions: {
    ...windowOptions,
    [ROUTES.home]: {
      ...windowOptions[ROUTES.home],
      icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    },
  },
  preloadPath: path.join(__dirname, 'preload.mjs'),
  // dist/index.html (or the dev server) with the route in the hash.
  indexHtmlPath: path.join(RENDERER_DIST, 'index.html'),
  devServerUrl: VITE_DEV_SERVER_URL,
  onWindowClosed: discardDraftOfClosedWindow(store),
});

registerIpc({
  store,
  windows,
  getMainWindow: () => mainWindow,
  isAction,
  authorize,
  canOpenWindow: canOpenWindow(store),
});

closeWindowsOfDeletedMessages(store, windows);

function createWindow() {
  mainWindow = windows.open(ROUTES.home);

  mainWindow?.on('closed', () => {
    mainWindow = null;
    windows.closeAll();
  });
}

void app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    mainWindow = null;
    windows.closeAll();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
