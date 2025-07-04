import { ipcMain } from 'electron';
import { WindowManager } from './windowManager';

export function registerWindowHandlers(windowManager: WindowManager) {
  ipcMain.on('open-new-window', async (_evt, { id, value }: { id: string; value: string }) => {
    windowManager.openWindow(id, value);
  });

  ipcMain.on('update-value', (_evt, { id, value }: { id: string; value: string }) => {
    windowManager.updateValue(id, value);
  });

  ipcMain.on('close-window', (_evt, { id }: { id: string }) => {
    windowManager.closeWindow(id);
  });
}

