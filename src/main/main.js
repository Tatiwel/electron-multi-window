import { app, BrowserWindow } from 'electron';
import { createStore } from './store.js';
import {
  closeAllChildWindows,
  loadRoute,
  registerWindowHandlers,
  webPreferences,
  windowOptions,
} from './windows.js';
import { initialState } from '../shared/reducer.js';
import { ROUTES } from '../shared/routes.js';

let mainWindow = null;

// The main process is the single source of truth for the application state.
const store = createStore(initialState);

registerWindowHandlers({
  getMainWindow: () => mainWindow,
  store,
});

function createWindow() {
  mainWindow = new BrowserWindow({
    ...windowOptions[ROUTES.home],
    webPreferences,
  });

  // src/renderer/index.html with the home route in the hash.
  loadRoute(mainWindow, ROUTES.home).catch((error) => {
    console.error('Failed to load the main window:', error);
  });

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
