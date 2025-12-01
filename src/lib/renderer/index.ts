/**
 * electron-multi-window - Renderer Process Exports
 * 
 * Entry point for renderer process functionality
 */

// Core functions
export {
  isAvailable,
  createWindow,
  closeWindow,
  closeCurrentWindow,
  getAllWindows,
  getWindow,
  focusWindow,
  getCurrentWindowId,
  getInitialData,
  emit,
  broadcast,
  listen,
  onMessage,
  onWindowEvent,
} from './multiWindow';

// React hooks
export {
  useCurrentWindowId,
  useInitialData,
  useIPCListener,
  useWindowEvents,
  useAllWindows,
  useCreateWindow,
  useEmit,
  useBroadcast,
  useSyncedState,
} from './hooks';

// Re-export types
export type {
  WindowConfig,
  WindowInfo,
  IPCMessage,
  IPCCallback,
  Unsubscribe,
  WindowEvent,
  WindowEventType,
  WindowEventCallback,
} from '../shared/types';
