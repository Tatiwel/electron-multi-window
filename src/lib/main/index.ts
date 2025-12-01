/**
 * electron-multi-window - Main Process Exports
 * 
 * Entry point for main process functionality
 */

export {
  initMultiWindow,
  createWindow,
  closeWindow,
  closeAllWindows,
  getWindow,
  getAllWindows,
  focusWindow,
  onWindowEvent,
  getBrowserWindow,
  sendToWindow,
  broadcast,
} from './windowManager';

export type {
  WindowConfig,
  WindowInfo,
  LibraryMainOptions,
  WindowEvent,
  WindowEventType,
  WindowEventCallback,
  IPCMessage,
  IPCCallback,
  Unsubscribe,
} from '../shared/types';

export { IPC_CHANNELS } from '../shared/types';
