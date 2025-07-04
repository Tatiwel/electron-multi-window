import { app, BrowserWindow } from 'electron'; // importações preservadas :contentReference[oaicite:2]{index=2}:contentReference[oaicite:3]{index=3}
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { WindowManager, registerWindowHandlers } from './windows';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

const windowManager = new WindowManager({
  viteDevServerUrl: VITE_DEV_SERVER_URL,
  rendererDist: RENDERER_DIST,
  vitePublic: process.env.VITE_PUBLIC!,
  dirname: __dirname,
});

registerWindowHandlers(windowManager);

function createWindow() {
  windowManager.createMainWindow();
}


app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    // mainWindow = null; // Não é mais necessário, pois está encapsulado
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
