/**
 * electron-multi-window - Preload Script
 * 
 * Exposes the multi-window API to the renderer process securely
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { WindowConfig, IPCMessage, WindowEvent, WindowInfo } from '../shared/types';
import { IPC_CHANNELS } from '../shared/types';

/**
 * Helper to create a listener with cleanup
 */
const createListener = <T>(channel: string, callback: (data: T) => void): (() => void) => {
  const listener = (_event: Electron.IpcRendererEvent, data: T) => {
    callback(data);
  };
  ipcRenderer.on(channel, listener);
  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
};

/**
 * Multi-window API exposed to renderer
 */
const multiWindowAPI = {
  /**
   * Creates a new window
   */
  createWindow: (config: WindowConfig): Promise<WindowInfo> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CREATE_WINDOW, config);
  },

  /**
   * Closes a window by ID
   */
  closeWindow: (windowId: string): void => {
    ipcRenderer.send(IPC_CHANNELS.CLOSE_WINDOW, windowId);
  },

  /**
   * Gets all active windows
   */
  getAllWindows: (): Promise<WindowInfo[]> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_ALL_WINDOWS);
  },

  /**
   * Gets information about a specific window
   */
  getWindow: (windowId: string): Promise<WindowInfo | undefined> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_WINDOW_INFO, windowId);
  },

  /**
   * Focuses a window by ID
   */
  focusWindow: (windowId: string): void => {
    ipcRenderer.send(IPC_CHANNELS.FOCUS_WINDOW, windowId);
  },

  /**
   * Gets the current window's ID
   */
  getCurrentWindowId: (): Promise<string | undefined> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_CURRENT_WINDOW_ID);
  },

  /**
   * Gets the initial data passed to this window
   */
  getInitialData: <T = unknown>(): Promise<T | undefined> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_INITIAL_DATA);
  },

  /**
   * Sends a message to a specific window or broadcasts to all windows
   */
  emit: <T = unknown>(channel: string, data: T, targetWindowId?: string): void => {
    const message: IPCMessage<T> = {
      channel,
      data,
      targetWindowId,
      timestamp: Date.now(),
    };
    ipcRenderer.send(IPC_CHANNELS.EMIT, message);
  },

  /**
   * Broadcasts a message to all windows including the sender
   */
  broadcast: <T = unknown>(channel: string, data: T): void => {
    const message: IPCMessage<T> = {
      channel,
      data,
      timestamp: Date.now(),
    };
    ipcRenderer.send(IPC_CHANNELS.BROADCAST, message);
  },

  /**
   * Listens for messages on a specific channel
   */
  listen: <T = unknown>(
    channel: string,
    callback: (data: T, message: IPCMessage<T>) => void
  ): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, message: IPCMessage<T>) => {
      if (message.channel === channel) {
        callback(message.data, message);
      }
    };
    ipcRenderer.on(IPC_CHANNELS.MESSAGE, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.MESSAGE, listener);
    };
  },

  /**
   * Listens for all messages regardless of channel
   */
  onMessage: <T = unknown>(
    callback: (message: IPCMessage<T>) => void
  ): (() => void) => {
    return createListener<IPCMessage<T>>(IPC_CHANNELS.MESSAGE, callback);
  },

  /**
   * Listens for window events
   */
  onWindowEvent: (callback: (event: WindowEvent) => void): (() => void) => {
    return createListener<WindowEvent>(IPC_CHANNELS.WINDOW_EVENT, callback);
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('multiWindow', multiWindowAPI);

// Type declaration for the exposed API
export type MultiWindowAPI = typeof multiWindowAPI;
