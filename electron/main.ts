import { app, BrowserWindow, ipcMain } from 'electron';
//import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
//const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let mainWindow: BrowserWindow | null = null;
let newWin: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send(
      'main-process-message',
      new Date().toLocaleString()
    );
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  mainWindow.on('closed', () => {
    if (newWin) newWin.close();
  });
}

async function openNewWindow(userInput: unknown) {
  newWin = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  newWin.webContents.on('did-finish-load', () => {
    newWin?.webContents.send(
      'main-process-message',
      new Date().toLocaleString()
    );
  });

  if (VITE_DEV_SERVER_URL) {
    // Em desenvolvimento, carrega a rota para newwindow.html
    await newWin.loadURL(VITE_DEV_SERVER_URL + '/newwindow.html');
  } else {
    await newWin.loadFile(path.join(RENDERER_DIST, 'newwindow.html'));
  }

  // receives the user input from the main window and sends it to the new window
  newWin.webContents.send('update-value', userInput);

  newWin.on('closed', () => {
    newWin = null;
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    mainWindow = null;
    newWin = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.on('open-new-window', (_event, userInput) => openNewWindow(userInput));
ipcMain.on('update-value', (_event, updatedInput) => {
  if (newWin) newWin.webContents.send('update-value', updatedInput);
});

app.whenReady().then(createWindow);
