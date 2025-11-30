/**
 * electron-window-stream
 * 
 * A generic, reusable library for managing multi-window Electron applications
 * with IPC communication and state synchronization.
 * 
 * @packageDocumentation
 */

// Types
export * from './types';

// Main Process
export { createWindowManager, type WindowManager } from './main';

// Renderer Process (React Hooks & Components)
export {
  // Hooks
  useWindowPool,
  useWindowSync,
  useWindowSyncWithTarget,
  useWindowInit,
  useWindowChannel,
  useWindowSend,
  // Components
  WindowRouter,
  navigateTo,
  getRouteParams,
  // Types
  type OpenWindowOptions,
  type WindowInitData,
  type RouteConfig,
  type RouteProps,
  type WindowRouterProps,
} from './renderer';
