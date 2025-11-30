import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronWindowAPI, EventBusMessage, WindowConfig, ChannelListener, Unsubscribe } from '../types';

/**
 * IPC Channel names
 */
const EVENT_BUS_CHANNEL = 'electron-window-stream';
const WINDOW_CREATE_CHANNEL = 'electron-window-create';
const WINDOW_CLOSE_CHANNEL = 'electron-window-close';
const WINDOW_INIT_CHANNEL = 'electron-window-init';
const WINDOW_REQUEST_INIT_CHANNEL = 'electron-window-request-init';

/**
 * Store for initial window data
 */
let windowId: string | null = null;
let initialData: unknown = null;
let route: string | null = null;
let initReceived = false;

/**
 * Listeners map for channel subscriptions
 */
type ListenerEntry<T = unknown> = {
  channel: string;
  callback: ChannelListener<T>;
  electronListener: (event: Electron.IpcRendererEvent, message: EventBusMessage<T>) => void;
};

const listeners: ListenerEntry[] = [];

/**
 * Handle initialization data from main process
 */
ipcRenderer.on(WINDOW_INIT_CHANNEL, (_event, data: { windowId: string; data: unknown; route?: string }) => {
  windowId = data.windowId;
  initialData = data.data;
  route = data.route ?? null;
  initReceived = true;
});

/**
 * Create the listener for Event Bus messages
 */
const createEventBusListener = <T = unknown>(
  channel: string,
  callback: ChannelListener<T>
): ((event: Electron.IpcRendererEvent, message: EventBusMessage<T>) => void) => {
  return (_event: Electron.IpcRendererEvent, message: EventBusMessage<T>) => {
    if (message.channel === channel) {
      callback(message.payload);
    }
  };
};

/**
 * API exposed to renderer process via contextBridge
 */
const electronWindowAPI: ElectronWindowAPI = {
  /**
   * Send data to a specific channel
   * @param channel - The channel name
   * @param data - The data to send
   * @param targetId - Optional target window ID (broadcasts if not specified)
   */
  send: <T = unknown>(channel: string, data: T, targetId?: string) => {
    const message: EventBusMessage<T> = {
      channel,
      payload: data,
      targetId,
      sourceId: windowId ?? undefined,
    };
    ipcRenderer.send(EVENT_BUS_CHANNEL, message);
  },

  /**
   * Subscribe to a channel
   * @param channel - The channel name to listen to
   * @param callback - The callback to invoke when a message is received
   * @returns Unsubscribe function
   */
  on: <T = unknown>(channel: string, callback: ChannelListener<T>): Unsubscribe => {
    const electronListener = createEventBusListener(channel, callback);
    
    listeners.push({
      channel,
      callback: callback as ChannelListener,
      electronListener: electronListener as ListenerEntry['electronListener'],
    });

    ipcRenderer.on(EVENT_BUS_CHANNEL, electronListener);

    return () => {
      ipcRenderer.removeListener(EVENT_BUS_CHANNEL, electronListener);
      const index = listeners.findIndex(
        (l) => l.channel === channel && l.callback === callback
      );
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  },

  /**
   * Create a new window
   * @param config - The window configuration
   */
  create: (config: WindowConfig) => {
    ipcRenderer.send(WINDOW_CREATE_CHANNEL, config);
  },

  /**
   * Close the current window or a specific window by ID
   * @param windowIdToClose - Optional window ID to close (closes current window if not specified)
   */
  close: (windowIdToClose?: string) => {
    ipcRenderer.send(WINDOW_CLOSE_CHANNEL, windowIdToClose);
  },

  /**
   * Get the current window's ID
   * @returns The window ID or null if not yet initialized
   */
  getWindowId: (): string | null => {
    if (!initReceived) {
      // Request initialization if not received yet
      ipcRenderer.send(WINDOW_REQUEST_INIT_CHANNEL);
    }
    return windowId;
  },

  /**
   * Get the initial data passed when the window was created
   * @returns The initial data or null
   */
  getInitialData: <T = unknown>(): T | null => {
    if (!initReceived) {
      // Request initialization if not received yet
      ipcRenderer.send(WINDOW_REQUEST_INIT_CHANNEL);
    }
    return initialData as T | null;
  },

  /**
   * Get the route/path for this window
   * @returns The route or null
   */
  getRoute: (): string | null => {
    return route;
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronWindow', electronWindowAPI);

// Export for type checking
export type { ElectronWindowAPI };
