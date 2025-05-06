import { app, BrowserWindow, ipcMain } from 'electron'; // importações preservadas :contentReference[oaicite:2]{index=2}:contentReference[oaicite:3]{index=3}
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let mainWindow: BrowserWindow | null = null;
// agora mantemos várias janelas num map
const windows: Record<number, BrowserWindow> = {};

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

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    // opcional: fechar todas as janelas filhas
    Object.values(windows).forEach((win) => win.close());
  });
}

// Abre ou foca janela específica
ipcMain.on(
  'open-new-window',
  async (_evt, { index, value }: { index: number; value: string }) => {
    if (windows[index]) {
      windows[index].focus();
      return;
    }
    const win = new BrowserWindow({
      width: 600,
      height: 400,
      webPreferences: {
        preload: path.join(__dirname, 'preload.mjs'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    windows[index] = win;

    if (VITE_DEV_SERVER_URL) {
      await win.loadURL(VITE_DEV_SERVER_URL + '/newwindow.html');
    } else {
      await win.loadFile(path.join(RENDERER_DIST, 'newwindow.html'));
    }

    // envia valor inicial só para esta janela
    win.webContents.send('init-value', value);

    win.on('closed', () => {
      delete windows[index];
    });
  }
);

// Repassa atualização só para a janela correta
ipcMain.on(
  'update-value',
  (_evt, { index, value }: { index: number; value: string }) => {
    const win = windows[index];
    if (win) {
      win.webContents.send('update-value', value);
    }
  }
);

// Fecha a janela de edição de índice X
ipcMain.on('close-window', (_evt, { index }: { index: number }) => {
  const win = windows[index];
  if (win) {
    win.close();
    delete windows[index];
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    mainWindow = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
