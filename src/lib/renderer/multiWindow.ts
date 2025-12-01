/**
 * electron-multi-window - Renderer Process API
 * 
 * Client-side functions for window management and IPC communication
 */

import type {
  WindowConfig,
  WindowInfo,
  IPCMessage,
  IPCCallback,
  Unsubscribe,
  WindowEventCallback,
} from '../shared/types';

// Type for the exposed API from preload
interface MultiWindowAPI {
  createWindow: (config: WindowConfig) => Promise<WindowInfo>;
  closeWindow: (windowId: string) => void;
  getAllWindows: () => Promise<WindowInfo[]>;
  getWindow: (windowId: string) => Promise<WindowInfo | undefined>;
  focusWindow: (windowId: string) => void;
  getCurrentWindowId: () => Promise<string | undefined>;
  getInitialData: <T = unknown>() => Promise<T | undefined>;
  emit: <T = unknown>(channel: string, data: T, targetWindowId?: string) => void;
  broadcast: <T = unknown>(channel: string, data: T) => void;
  listen: <T = unknown>(
    channel: string,
    callback: (data: T, message: IPCMessage<T>) => void
  ) => Unsubscribe;
  onMessage: <T = unknown>(callback: (message: IPCMessage<T>) => void) => Unsubscribe;
  onWindowEvent: (callback: WindowEventCallback) => Unsubscribe;
}

// Declare the global window property
declare global {
  interface Window {
    multiWindow?: MultiWindowAPI;
  }
}

/**
 * Gets the multi-window API or throws if unavailable
 */
const getAPI = (): MultiWindowAPI => {
  if (!window.multiWindow) {
    throw new Error(
      'electron-multi-window: API not available. Make sure the preload script is properly configured.'
    );
  }
  return window.multiWindow;
};

/**
 * Checks if the multi-window API is available
 */
export const isAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.multiWindow;
};

/**
 * Creates a new window with the given configuration
 * 
 * @param config - Window configuration options
 * @returns Promise resolving to WindowInfo of the created window
 * 
 * @example
 * ```tsx
 * import { createWindow } from 'electron-multi-window/renderer';
 * 
 * // Create a window with a URL
 * const win = await createWindow({ 
 *   url: 'editor.html', 
 *   width: 800, 
 *   height: 600,
 *   initialData: { documentId: '123' }
 * });
 * ```
 */
export const createWindow = (config: WindowConfig): Promise<WindowInfo> => {
  return getAPI().createWindow(config);
};

/**
 * Closes a window by ID
 * 
 * @param windowId - The ID of the window to close
 * 
 * @example
 * ```tsx
 * closeWindow('my-editor-window');
 * ```
 */
export const closeWindow = (windowId: string): void => {
  getAPI().closeWindow(windowId);
};

/**
 * Gets information about all active windows
 * 
 * @returns Promise resolving to array of WindowInfo
 */
export const getAllWindows = (): Promise<WindowInfo[]> => {
  return getAPI().getAllWindows();
};

/**
 * Gets information about a specific window
 * 
 * @param windowId - The ID of the window
 * @returns Promise resolving to WindowInfo if found
 */
export const getWindow = (windowId: string): Promise<WindowInfo | undefined> => {
  return getAPI().getWindow(windowId);
};

/**
 * Focuses a window by ID
 * 
 * @param windowId - The ID of the window to focus
 */
export const focusWindow = (windowId: string): void => {
  getAPI().focusWindow(windowId);
};

/**
 * Gets the current window's ID
 * 
 * @returns Promise resolving to the current window's ID
 */
export const getCurrentWindowId = (): Promise<string | undefined> => {
  return getAPI().getCurrentWindowId();
};

/**
 * Gets the initial data passed to the current window
 * 
 * @returns Promise resolving to the initial data
 * 
 * @example
 * ```tsx
 * interface EditorData {
 *   documentId: string;
 *   title: string;
 * }
 * 
 * const data = await getInitialData<EditorData>();
 * console.log(data?.documentId);
 * ```
 */
export const getInitialData = <T = unknown>(): Promise<T | undefined> => {
  return getAPI().getInitialData<T>();
};

/**
 * Sends a message to a specific window or broadcasts to all other windows
 * 
 * @param channel - Message channel/topic
 * @param data - Data to send
 * @param targetWindowId - Optional target window ID (broadcasts if not specified)
 * 
 * @example
 * ```tsx
 * // Send to specific window
 * emit('document:updated', { id: '123', content: 'Hello' }, 'editor-window');
 * 
 * // Broadcast to all other windows
 * emit('user:activity', { action: 'typing' });
 * ```
 */
export const emit = <T = unknown>(
  channel: string,
  data: T,
  targetWindowId?: string
): void => {
  getAPI().emit(channel, data, targetWindowId);
};

/**
 * Broadcasts a message to all windows including the current window
 * 
 * @param channel - Message channel/topic
 * @param data - Data to send
 */
export const broadcast = <T = unknown>(channel: string, data: T): void => {
  getAPI().broadcast(channel, data);
};

/**
 * Listens for messages on a specific channel
 * 
 * @param channel - Channel to listen on
 * @param callback - Function to call when a message is received
 * @returns Unsubscribe function
 * 
 * @example
 * ```tsx
 * // Listen for document updates
 * const unsubscribe = listen<{ id: string; content: string }>(
 *   'document:updated',
 *   (data, message) => {
 *     console.log(`Document ${data.id} updated from window ${message.sourceWindowId}`);
 *   }
 * );
 * 
 * // Later, unsubscribe
 * unsubscribe();
 * ```
 */
export const listen = <T = unknown>(
  channel: string,
  callback: IPCCallback<T>
): Unsubscribe => {
  return getAPI().listen(channel, callback);
};

/**
 * Listens for all messages regardless of channel
 * 
 * @param callback - Function to call when any message is received
 * @returns Unsubscribe function
 */
export const onMessage = <T = unknown>(
  callback: (message: IPCMessage<T>) => void
): Unsubscribe => {
  return getAPI().onMessage(callback);
};

/**
 * Listens for window events (created, closed, focused, etc.)
 * 
 * @param callback - Function to call when a window event occurs
 * @returns Unsubscribe function
 * 
 * @example
 * ```tsx
 * const unsubscribe = onWindowEvent((event) => {
 *   console.log(`Window ${event.windowId} was ${event.type}`);
 * });
 * ```
 */
export const onWindowEvent = (callback: WindowEventCallback): Unsubscribe => {
  return getAPI().onWindowEvent(callback);
};

/**
 * Closes the current window
 */
export const closeCurrentWindow = async (): Promise<void> => {
  const windowId = await getCurrentWindowId();
  if (windowId) {
    closeWindow(windowId);
  }
};
