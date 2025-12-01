/**
 * electron-multi-window - Shared Types
 * 
 * Core type definitions for the multi-window library
 */

import type { BrowserWindowConstructorOptions } from 'electron';

/**
 * Window configuration options for creating new windows
 */
export interface WindowConfig {
  /** Unique identifier for the window (auto-generated if not provided) */
  id?: string;
  /** Window title */
  title?: string;
  /** Window width in pixels */
  width?: number;
  /** Window height in pixels */
  height?: number;
  /** Window x position */
  x?: number;
  /** Window y position */
  y?: number;
  /** URL to load in the window (for remote content) */
  url?: string;
  /** Path to local HTML file to load */
  filePath?: string;
  /** Route/path to append to base URL (for SPA routing) */
  route?: string;
  /** Whether the window should be shown immediately */
  show?: boolean;
  /** Parent window ID for creating child windows */
  parentId?: string;
  /** Whether the window is modal */
  modal?: boolean;
  /** Initial data to pass to the window */
  initialData?: unknown;
  /** Additional Electron BrowserWindow options */
  browserWindowOptions?: Partial<BrowserWindowConstructorOptions>;
}

/**
 * Window information returned by window management functions
 */
export interface WindowInfo {
  /** Unique window identifier */
  id: string;
  /** Window title */
  title: string;
  /** Whether the window is visible */
  isVisible: boolean;
  /** Whether the window is focused */
  isFocused: boolean;
  /** Whether the window is destroyed */
  isDestroyed: boolean;
  /** Window bounds */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Generic IPC message payload
 */
export interface IPCMessage<T = unknown> {
  /** Channel/topic of the message */
  channel: string;
  /** Message data payload */
  data: T;
  /** Source window ID */
  sourceWindowId?: string;
  /** Target window ID (if specific window targeted) */
  targetWindowId?: string;
  /** Timestamp of the message */
  timestamp: number;
}

/**
 * Callback function type for IPC listeners
 */
export type IPCCallback<T = unknown> = (data: T, message: IPCMessage<T>) => void;

/**
 * Unsubscribe function returned by listeners
 */
export type Unsubscribe = () => void;

/**
 * Window event types
 */
export type WindowEventType = 
  | 'created'
  | 'closed'
  | 'focused'
  | 'blurred'
  | 'moved'
  | 'resized'
  | 'minimized'
  | 'maximized'
  | 'restored';

/**
 * Window event payload
 */
export interface WindowEvent {
  type: WindowEventType;
  windowId: string;
  timestamp: number;
  data?: unknown;
}

/**
 * Window event callback
 */
export type WindowEventCallback = (event: WindowEvent) => void;

/**
 * Library initialization options for main process
 */
export interface LibraryMainOptions {
  /** Path to the preload script */
  preloadPath: string;
  /** Development server URL (for Vite dev mode) */
  devServerUrl?: string;
  /** Path to the renderer dist folder */
  rendererDist: string;
  /** Default window options */
  defaultWindowOptions?: Partial<WindowConfig>;
}

/**
 * Library initialization options for renderer process
 */
export interface LibraryRendererOptions {
  /** Current window ID (injected by preload) */
  windowId?: string;
}

/**
 * IPC Channel names used internally
 */
export const IPC_CHANNELS = {
  // Window management
  CREATE_WINDOW: 'emw:create-window',
  CLOSE_WINDOW: 'emw:close-window',
  GET_ALL_WINDOWS: 'emw:get-all-windows',
  GET_WINDOW_INFO: 'emw:get-window-info',
  FOCUS_WINDOW: 'emw:focus-window',
  
  // Generic messaging
  EMIT: 'emw:emit',
  BROADCAST: 'emw:broadcast',
  MESSAGE: 'emw:message',
  
  // Window events
  WINDOW_EVENT: 'emw:window-event',
  
  // Initialization
  INIT: 'emw:init',
  GET_CURRENT_WINDOW_ID: 'emw:get-current-window-id',
  GET_INITIAL_DATA: 'emw:get-initial-data',
} as const;
