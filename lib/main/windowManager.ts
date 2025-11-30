import { BrowserWindow, ipcMain, type IpcMainEvent } from 'electron';
import path from 'node:path';
import type {
  WindowManagerOptions,
  WindowConfig,
  WindowCreatedCallback,
  WindowClosedCallback,
  EventBusMessage,
  WindowOptions,
} from '../types';

/**
 * Internal state for the window manager
 */
interface WindowManagerState {
  windows: Map<string, BrowserWindow>;
  windowData: Map<string, unknown>;
  windowRoutes: Map<string, string>;
  onCreatedCallbacks: WindowCreatedCallback[];
  onClosedCallbacks: WindowClosedCallback[];
}

/**
 * Window Manager API
 */
export interface WindowManager {
  onWindowCreated: (callback: WindowCreatedCallback) => () => void;
  onWindowClosed: (callback: WindowClosedCallback) => () => void;
  getWindow: (id: string) => BrowserWindow | undefined;
  getAllWindows: () => Map<string, BrowserWindow>;
  createWindow: (config: WindowConfig) => Promise<BrowserWindow>;
  closeWindow: (id: string) => void;
  closeAllWindows: () => void;
  broadcast: <T = unknown>(channel: string, payload: T, excludeId?: string) => void;
  send: <T = unknown>(targetId: string, channel: string, payload: T) => void;
}

/**
 * Build URL or file path for a new window
 */
const buildWindowUrl = (
  devServerUrl: string | undefined,
  rendererDist: string,
  route?: string
): string => {
  const hashRoute = route ? `#${route}` : '';
  
  if (devServerUrl) {
    const normalized = devServerUrl.endsWith('/') ? devServerUrl : `${devServerUrl}/`;
    return `${new URL('html/index.html', normalized).toString()}${hashRoute}`;
  }

  return path.join(rendererDist, `index.html${hashRoute}`);
};

/**
 * Merge window options with defaults
 */
const mergeWindowOptions = (
  defaults: WindowOptions | undefined,
  config: WindowConfig
): Partial<Electron.BrowserWindowConstructorOptions> => {
  // Extract known safe properties, excluding parent which could be unknown
  const { parent: _parent, ...safeDefaults } = (defaults ?? {}) as WindowOptions & { parent?: unknown };
  
  return {
    width: config.width ?? safeDefaults?.width ?? 800,
    height: config.height ?? safeDefaults?.height ?? 600,
    x: config.x ?? safeDefaults?.x,
    y: config.y ?? safeDefaults?.y,
    ...safeDefaults,
  };
};

/**
 * Creates a window manager instance for the main process
 * 
 * @example
 * ```typescript
 * const windowManager = createWindowManager({
 *   preloadPath: path.join(__dirname, 'preload.mjs'),
 *   devServerUrl: process.env.VITE_DEV_SERVER_URL,
 *   rendererDist: path.join(process.env.APP_ROOT, 'dist'),
 *   defaultOptions: { width: 800, height: 600 }
 * });
 * 
 * windowManager.onWindowCreated((id, win) => {
 *   console.log(`Window ${id} created`);
 * });
 * ```
 */
export const createWindowManager = (options: WindowManagerOptions): WindowManager => {
  const { preloadPath, devServerUrl, rendererDist, defaultOptions } = options;

  const state: WindowManagerState = {
    windows: new Map(),
    windowData: new Map(),
    windowRoutes: new Map(),
    onCreatedCallbacks: [],
    onClosedCallbacks: [],
  };

  /**
   * Event Bus channel for all IPC communication
   */
  const EVENT_BUS_CHANNEL = 'electron-window-stream';
  const WINDOW_CREATE_CHANNEL = 'electron-window-create';
  const WINDOW_CLOSE_CHANNEL = 'electron-window-close';
  const WINDOW_INIT_CHANNEL = 'electron-window-init';
  const WINDOW_REQUEST_INIT_CHANNEL = 'electron-window-request-init';

  /**
   * Handle Event Bus messages
   */
  const handleEventBus = (event: IpcMainEvent, message: EventBusMessage) => {
    const { channel, payload, targetId, sourceId } = message;

    if (targetId) {
      // Send to specific window
      const targetWindow = state.windows.get(targetId);
      if (targetWindow && !targetWindow.isDestroyed()) {
        targetWindow.webContents.send(EVENT_BUS_CHANNEL, { channel, payload, sourceId });
      }
    } else {
      // Broadcast to all windows except sender
      state.windows.forEach((win) => {
        if (!win.isDestroyed() && win.webContents !== event.sender) {
          win.webContents.send(EVENT_BUS_CHANNEL, { channel, payload, sourceId });
        }
      });
    }
  };

  /**
   * Handle window creation requests
   */
  const handleWindowCreate = async (_event: IpcMainEvent, config: WindowConfig) => {
    await manager.createWindow(config);
  };

  /**
   * Handle window close requests
   */
  const handleWindowClose = (event: IpcMainEvent, windowId?: string) => {
    if (windowId) {
      manager.closeWindow(windowId);
    } else {
      // Close the sender's window
      const senderWindow = BrowserWindow.fromWebContents(event.sender);
      if (senderWindow) {
        const id = findWindowId(senderWindow);
        if (id) {
          manager.closeWindow(id);
        } else {
          senderWindow.close();
        }
      }
    }
  };

  /**
   * Handle initialization requests from newly opened windows
   */
  const handleWindowRequestInit = (event: IpcMainEvent) => {
    const sender = event.sender;
    let windowId: string | null = null;

    for (const [id, win] of state.windows.entries()) {
      if (win.webContents === sender) {
        windowId = id;
        break;
      }
    }

    if (windowId) {
      const data = state.windowData.get(windowId);
      const route = state.windowRoutes.get(windowId);
      sender.send(WINDOW_INIT_CHANNEL, { windowId, data, route });
    }
  };

  /**
   * Find window ID by BrowserWindow instance
   */
  const findWindowId = (win: BrowserWindow): string | null => {
    for (const [id, w] of state.windows.entries()) {
      if (w === win) return id;
    }
    return null;
  };

  // Register IPC handlers
  ipcMain.on(EVENT_BUS_CHANNEL, handleEventBus);
  ipcMain.on(WINDOW_CREATE_CHANNEL, handleWindowCreate);
  ipcMain.on(WINDOW_CLOSE_CHANNEL, handleWindowClose);
  ipcMain.on(WINDOW_REQUEST_INIT_CHANNEL, handleWindowRequestInit);

  const manager: WindowManager = {
    onWindowCreated: (callback: WindowCreatedCallback) => {
      state.onCreatedCallbacks.push(callback);
      return () => {
        const index = state.onCreatedCallbacks.indexOf(callback);
        if (index > -1) {
          state.onCreatedCallbacks.splice(index, 1);
        }
      };
    },

    onWindowClosed: (callback: WindowClosedCallback) => {
      state.onClosedCallbacks.push(callback);
      return () => {
        const index = state.onClosedCallbacks.indexOf(callback);
        if (index > -1) {
          state.onClosedCallbacks.splice(index, 1);
        }
      };
    },

    getWindow: (id: string) => {
      return state.windows.get(id);
    },

    getAllWindows: () => {
      return new Map(state.windows);
    },

    createWindow: async (config: WindowConfig): Promise<BrowserWindow> => {
      const { id, path: route, data } = config;

      // Check if window already exists
      const existingWindow = state.windows.get(id);
      if (existingWindow && !existingWindow.isDestroyed()) {
        existingWindow.focus();
        // Update data and notify
        if (data !== undefined) {
          state.windowData.set(id, data);
          existingWindow.webContents.send(WINDOW_INIT_CHANNEL, { windowId: id, data, route });
        }
        return existingWindow;
      }

      const windowOptions = mergeWindowOptions(defaultOptions, config);

      const browserWindow = new BrowserWindow({
        ...windowOptions,
        webPreferences: {
          preload: preloadPath,
          contextIsolation: true,
          nodeIntegration: false,
          ...windowOptions.webPreferences,
        },
      });

      state.windows.set(id, browserWindow);
      if (data !== undefined) {
        state.windowData.set(id, data);
      }
      if (route) {
        state.windowRoutes.set(id, route);
      }

      const urlOrPath = buildWindowUrl(devServerUrl, rendererDist, route);

      if (devServerUrl) {
        await browserWindow.loadURL(urlOrPath);
      } else {
        // For file:// protocol, we need to handle hash routing differently
        const [filePath, hash] = urlOrPath.split('#');
        await browserWindow.loadFile(filePath);
        if (hash) {
          browserWindow.webContents.executeJavaScript(`window.location.hash = '#${hash}'`);
        }
      }

      // Send initial data
      browserWindow.webContents.send(WINDOW_INIT_CHANNEL, { windowId: id, data, route });

      // Notify callbacks
      state.onCreatedCallbacks.forEach((cb) => cb(id, browserWindow));

      // Handle window close
      browserWindow.on('closed', () => {
        state.windows.delete(id);
        state.windowData.delete(id);
        state.windowRoutes.delete(id);
        state.onClosedCallbacks.forEach((cb) => cb(id));

        // Notify other windows
        state.windows.forEach((win) => {
          if (!win.isDestroyed()) {
            win.webContents.send(EVENT_BUS_CHANNEL, {
              channel: 'window-closed',
              payload: { windowId: id },
            });
          }
        });
      });

      return browserWindow;
    },

    closeWindow: (id: string) => {
      const win = state.windows.get(id);
      if (win && !win.isDestroyed()) {
        win.close();
      }
    },

    closeAllWindows: () => {
      state.windows.forEach((win) => {
        if (!win.isDestroyed()) {
          win.close();
        }
      });
      state.windows.clear();
      state.windowData.clear();
      state.windowRoutes.clear();
    },

    broadcast: <T = unknown>(channel: string, payload: T, excludeId?: string) => {
      state.windows.forEach((win, id) => {
        if (!win.isDestroyed() && id !== excludeId) {
          win.webContents.send(EVENT_BUS_CHANNEL, { channel, payload });
        }
      });
    },

    send: <T = unknown>(targetId: string, channel: string, payload: T) => {
      const targetWindow = state.windows.get(targetId);
      if (targetWindow && !targetWindow.isDestroyed()) {
        targetWindow.webContents.send(EVENT_BUS_CHANNEL, { channel, payload });
      }
    },
  };

  return manager;
};
