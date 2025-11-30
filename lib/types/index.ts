/**
 * Core types for electron-window-stream library
 */

/**
 * Generic message envelope for the Event Bus
 */
export interface EventBusMessage<T = unknown> {
  channel: string;
  payload: T;
  targetId?: string;
  sourceId?: string;
}

/**
 * Window configuration for creating new windows
 */
export interface WindowConfig {
  id: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  path?: string;
  data?: unknown;
}

/**
 * BrowserWindow options subset for default configuration
 */
export interface WindowOptions {
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  x?: number;
  y?: number;
  resizable?: boolean;
  movable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  closable?: boolean;
  focusable?: boolean;
  alwaysOnTop?: boolean;
  fullscreen?: boolean;
  fullscreenable?: boolean;
  title?: string;
  show?: boolean;
  frame?: boolean;
  parent?: unknown;
  modal?: boolean;
  acceptFirstMouse?: boolean;
  disableAutoHideCursor?: boolean;
  autoHideMenuBar?: boolean;
  enableLargerThanScreen?: boolean;
  backgroundColor?: string;
  hasShadow?: boolean;
  opacity?: number;
  darkTheme?: boolean;
  transparent?: boolean;
  webPreferences?: {
    nodeIntegration?: boolean;
    contextIsolation?: boolean;
    preload?: string;
  };
}

/**
 * Options for createWindowManager factory
 */
export interface WindowManagerOptions {
  defaultOptions?: WindowOptions;
  preloadPath: string;
  devServerUrl?: string;
  rendererDist: string;
}

/**
 * Callback type for window created events
 */
export type WindowCreatedCallback = (windowId: string, window: unknown) => void;

/**
 * Callback type for window closed events
 */
export type WindowClosedCallback = (windowId: string) => void;

/**
 * Unsubscribe function type
 */
export type Unsubscribe = () => void;

/**
 * Listener callback type for generic channels
 */
export type ChannelListener<T = unknown> = (payload: T) => void;

/**
 * API exposed to renderer via contextBridge
 */
export interface ElectronWindowAPI {
  send: <T = unknown>(channel: string, data: T, targetId?: string) => void;
  on: <T = unknown>(channel: string, callback: ChannelListener<T>) => Unsubscribe;
  create: (config: WindowConfig) => void;
  close: (windowId?: string) => void;
  getWindowId: () => string | null;
  getInitialData: <T = unknown>() => T | null;
  getRoute: () => string | null;
}

/**
 * Declaration merging for window.electronWindow
 */
declare global {
  interface Window {
    electronWindow?: ElectronWindowAPI;
  }
}
