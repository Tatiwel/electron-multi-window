/**
 * electron-multi-window - Main Process Window Manager
 * 
 * Core window management functionality for the main process
 */

import { BrowserWindow, ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import type {
  WindowConfig,
  WindowInfo,
  LibraryMainOptions,
  IPCMessage,
  WindowEvent,
  WindowEventType,
  WindowEventCallback,
} from '../shared/types';
import { IPC_CHANNELS } from '../shared/types';

// Internal state
const windows = new Map<string, BrowserWindow>();
const windowData = new Map<string, unknown>();
const windowEventListeners = new Set<WindowEventCallback>();
let libraryOptions: LibraryMainOptions | null = null;
let isInitialized = false;

/**
 * Generates a unique window ID
 */
const generateWindowId = (): string => uuidv4();

/**
 * Builds URL for a new window
 */
const buildWindowUrl = (config: WindowConfig): string | { filePath: string } => {
  if (config.url) {
    return config.url;
  }

  if (config.filePath) {
    return { filePath: config.filePath };
  }

  if (!libraryOptions) {
    throw new Error('Library not initialized. Call initMultiWindow first.');
  }

  const { devServerUrl, rendererDist } = libraryOptions;
  
  if (devServerUrl) {
    const baseUrl = devServerUrl.endsWith('/') ? devServerUrl : `${devServerUrl}/`;
    const route = config.route || '';
    return new URL(route, baseUrl).toString();
  }

  return { filePath: `${rendererDist}/${config.route || 'index.html'}` };
};

/**
 * Emits a window event to all listeners
 */
const emitWindowEvent = (type: WindowEventType, windowId: string, data?: unknown) => {
  const event: WindowEvent = {
    type,
    windowId,
    timestamp: Date.now(),
    data,
  };

  windowEventListeners.forEach((callback) => {
    try {
      callback(event);
    } catch (err) {
      console.error('Error in window event callback:', err);
    }
  });

  // Broadcast to all windows
  windows.forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.WINDOW_EVENT, event);
    }
  });
};

/**
 * Gets window information
 */
const getWindowInfo = (id: string, win: BrowserWindow): WindowInfo => {
  const bounds = win.getBounds();
  return {
    id,
    title: win.getTitle(),
    isVisible: win.isVisible(),
    isFocused: win.isFocused(),
    isDestroyed: win.isDestroyed(),
    bounds,
  };
};

/**
 * Initialize the multi-window library in the main process
 * Must be called before creating windows
 */
export const initMultiWindow = (options: LibraryMainOptions): void => {
  if (isInitialized) {
    console.warn('electron-multi-window is already initialized');
    return;
  }

  libraryOptions = options;
  isInitialized = true;

  // Register IPC handlers
  registerIPCHandlers();
};

/**
 * Register all IPC handlers
 */
const registerIPCHandlers = () => {
  // Handle window creation from renderer
  ipcMain.handle(IPC_CHANNELS.CREATE_WINDOW, async (_event, config: WindowConfig) => {
    const windowInfo = await createWindow(config);
    return windowInfo;
  });

  // Handle window closing from renderer
  ipcMain.on(IPC_CHANNELS.CLOSE_WINDOW, (_event, windowId: string) => {
    closeWindow(windowId);
  });

  // Handle get all windows
  ipcMain.handle(IPC_CHANNELS.GET_ALL_WINDOWS, () => {
    return getAllWindows();
  });

  // Handle get window info
  ipcMain.handle(IPC_CHANNELS.GET_WINDOW_INFO, (_event, windowId: string) => {
    return getWindow(windowId);
  });

  // Handle focus window
  ipcMain.on(IPC_CHANNELS.FOCUS_WINDOW, (_event, windowId: string) => {
    focusWindow(windowId);
  });

  // Handle emit (targeted message)
  ipcMain.on(IPC_CHANNELS.EMIT, (event, message: IPCMessage) => {
    const sourceWindowId = findWindowIdByWebContents(event.sender);
    const fullMessage: IPCMessage = {
      ...message,
      sourceWindowId,
      timestamp: Date.now(),
    };

    if (message.targetWindowId) {
      // Send to specific window
      const targetWindow = windows.get(message.targetWindowId);
      if (targetWindow && !targetWindow.isDestroyed()) {
        targetWindow.webContents.send(IPC_CHANNELS.MESSAGE, fullMessage);
      }
    } else {
      // Broadcast to all windows except sender
      windows.forEach((win, id) => {
        if (id !== sourceWindowId && !win.isDestroyed()) {
          win.webContents.send(IPC_CHANNELS.MESSAGE, fullMessage);
        }
      });
    }
  });

  // Handle broadcast (to all windows including sender)
  ipcMain.on(IPC_CHANNELS.BROADCAST, (event, message: IPCMessage) => {
    const sourceWindowId = findWindowIdByWebContents(event.sender);
    const fullMessage: IPCMessage = {
      ...message,
      sourceWindowId,
      timestamp: Date.now(),
    };

    windows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.MESSAGE, fullMessage);
      }
    });
  });

  // Handle get current window ID
  ipcMain.handle(IPC_CHANNELS.GET_CURRENT_WINDOW_ID, (event) => {
    return findWindowIdByWebContents(event.sender);
  });

  // Handle get initial data
  ipcMain.handle(IPC_CHANNELS.GET_INITIAL_DATA, (event) => {
    const windowId = findWindowIdByWebContents(event.sender);
    if (windowId) {
      return windowData.get(windowId);
    }
    return undefined;
  });
};

/**
 * Finds window ID by webContents
 */
const findWindowIdByWebContents = (webContents: Electron.WebContents): string | undefined => {
  for (const [id, win] of windows.entries()) {
    if (win.webContents === webContents) {
      return id;
    }
  }
  return undefined;
};

/**
 * Creates a new window with the given configuration
 * 
 * @param config - Window configuration options
 * @returns Promise resolving to WindowInfo of the created window
 * 
 * @example
 * ```ts
 * // Create a window with a URL
 * const win = await createWindow({ url: 'https://example.com', width: 800, height: 600 });
 * 
 * // Create a window with a local file
 * const win = await createWindow({ filePath: '/path/to/index.html' });
 * 
 * // Create a window with initial data
 * const win = await createWindow({ route: 'editor.html', initialData: { documentId: '123' } });
 * ```
 */
export const createWindow = async (config: WindowConfig = {}): Promise<WindowInfo> => {
  if (!libraryOptions) {
    throw new Error('Library not initialized. Call initMultiWindow first.');
  }

  const windowId = config.id || generateWindowId();
  
  // Check if window with this ID already exists
  const existingWindow = windows.get(windowId);
  if (existingWindow && !existingWindow.isDestroyed()) {
    existingWindow.focus();
    return getWindowInfo(windowId, existingWindow);
  }

  const { preloadPath, defaultWindowOptions } = libraryOptions;

  // Merge default options with provided config
  const finalConfig: WindowConfig = {
    width: 800,
    height: 600,
    show: true,
    ...defaultWindowOptions,
    ...config,
    id: windowId,
  };

  // Get parent window if specified
  let parentWindow: BrowserWindow | undefined;
  if (finalConfig.parentId) {
    parentWindow = windows.get(finalConfig.parentId) ?? undefined;
  }

  // Create BrowserWindow
  const browserWindow = new BrowserWindow({
    width: finalConfig.width,
    height: finalConfig.height,
    x: finalConfig.x,
    y: finalConfig.y,
    show: finalConfig.show,
    title: finalConfig.title,
    parent: parentWindow,
    modal: finalConfig.modal,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      ...finalConfig.browserWindowOptions?.webPreferences,
    },
    ...finalConfig.browserWindowOptions,
  });

  // Store window and initial data
  windows.set(windowId, browserWindow);
  if (finalConfig.initialData !== undefined) {
    windowData.set(windowId, finalConfig.initialData);
  }

  // Load content
  const urlOrPath = buildWindowUrl(finalConfig);
  if (typeof urlOrPath === 'string') {
    await browserWindow.loadURL(urlOrPath);
  } else {
    await browserWindow.loadFile(urlOrPath.filePath);
  }

  // Setup window event listeners
  setupWindowEvents(windowId, browserWindow);

  // Emit created event
  emitWindowEvent('created', windowId);

  return getWindowInfo(windowId, browserWindow);
};

/**
 * Sets up event listeners for a window
 */
const setupWindowEvents = (windowId: string, browserWindow: BrowserWindow) => {
  browserWindow.on('closed', () => {
    windows.delete(windowId);
    windowData.delete(windowId);
    emitWindowEvent('closed', windowId);
  });

  browserWindow.on('focus', () => {
    emitWindowEvent('focused', windowId);
  });

  browserWindow.on('blur', () => {
    emitWindowEvent('blurred', windowId);
  });

  browserWindow.on('move', () => {
    emitWindowEvent('moved', windowId, browserWindow.getBounds());
  });

  browserWindow.on('resize', () => {
    emitWindowEvent('resized', windowId, browserWindow.getBounds());
  });

  browserWindow.on('minimize', () => {
    emitWindowEvent('minimized', windowId);
  });

  browserWindow.on('maximize', () => {
    emitWindowEvent('maximized', windowId);
  });

  browserWindow.on('restore', () => {
    emitWindowEvent('restored', windowId);
  });
};

/**
 * Closes a window by ID
 * 
 * @param windowId - The ID of the window to close
 * @returns true if window was found and closed, false otherwise
 * 
 * @example
 * ```ts
 * closeWindow('my-window-id');
 * ```
 */
export const closeWindow = (windowId: string): boolean => {
  const win = windows.get(windowId);
  if (win && !win.isDestroyed()) {
    win.close();
    return true;
  }
  return false;
};

/**
 * Gets information about a specific window
 * 
 * @param windowId - The ID of the window
 * @returns WindowInfo if window exists, undefined otherwise
 */
export const getWindow = (windowId: string): WindowInfo | undefined => {
  const win = windows.get(windowId);
  if (win && !win.isDestroyed()) {
    return getWindowInfo(windowId, win);
  }
  return undefined;
};

/**
 * Gets information about all active windows
 * 
 * @returns Array of WindowInfo for all active windows
 * 
 * @example
 * ```ts
 * const windows = getAllWindows();
 * console.log(`${windows.length} windows are open`);
 * ```
 */
export const getAllWindows = (): WindowInfo[] => {
  const result: WindowInfo[] = [];
  windows.forEach((win, id) => {
    if (!win.isDestroyed()) {
      result.push(getWindowInfo(id, win));
    }
  });
  return result;
};

/**
 * Focuses a window by ID
 * 
 * @param windowId - The ID of the window to focus
 * @returns true if window was found and focused, false otherwise
 */
export const focusWindow = (windowId: string): boolean => {
  const win = windows.get(windowId);
  if (win && !win.isDestroyed()) {
    win.focus();
    return true;
  }
  return false;
};

/**
 * Closes all windows managed by the library
 */
export const closeAllWindows = (): void => {
  windows.forEach((win) => {
    if (!win.isDestroyed()) {
      win.close();
    }
  });
  windows.clear();
  windowData.clear();
};

/**
 * Subscribe to window events in the main process
 * 
 * @param callback - Function to call when window events occur
 * @returns Unsubscribe function
 */
export const onWindowEvent = (callback: WindowEventCallback): (() => void) => {
  windowEventListeners.add(callback);
  return () => {
    windowEventListeners.delete(callback);
  };
};

/**
 * Gets the BrowserWindow instance for a window ID
 * Use with caution - prefer using the library's abstraction
 * 
 * @param windowId - The ID of the window
 * @returns BrowserWindow instance or undefined
 */
export const getBrowserWindow = (windowId: string): BrowserWindow | undefined => {
  return windows.get(windowId);
};

/**
 * Sends a message to a specific window
 * 
 * @param windowId - Target window ID
 * @param channel - Message channel
 * @param data - Data to send
 */
export const sendToWindow = <T = unknown>(windowId: string, channel: string, data: T): void => {
  const win = windows.get(windowId);
  if (win && !win.isDestroyed()) {
    const message: IPCMessage<T> = {
      channel,
      data,
      targetWindowId: windowId,
      timestamp: Date.now(),
    };
    win.webContents.send(IPC_CHANNELS.MESSAGE, message);
  }
};

/**
 * Broadcasts a message to all windows
 * 
 * @param channel - Message channel
 * @param data - Data to send
 */
export const broadcast = <T = unknown>(channel: string, data: T): void => {
  const message: IPCMessage<T> = {
    channel,
    data,
    timestamp: Date.now(),
  };
  
  windows.forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.MESSAGE, message);
    }
  });
};
