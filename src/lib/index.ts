/**
 * electron-multi-window
 * 
 * A library for managing multiple Electron windows with bidirectional IPC communication
 * and state synchronization.
 * 
 * @packageDocumentation
 * 
 * ## Usage
 * 
 * ### Main Process
 * 
 * ```ts
 * // main.ts
 * import { app, BrowserWindow } from 'electron';
 * import { initMultiWindow, createWindow } from 'electron-multi-window/main';
 * import path from 'path';
 * 
 * app.whenReady().then(() => {
 *   // Initialize the library
 *   initMultiWindow({
 *     preloadPath: path.join(__dirname, 'preload.js'),
 *     rendererDist: path.join(__dirname, '../dist'),
 *   });
 * 
 *   // Create the main window
 *   createWindow({
 *     id: 'main',
 *     route: 'index.html',
 *     width: 1200,
 *     height: 800,
 *   });
 * });
 * ```
 * 
 * ### Preload Script
 * 
 * ```ts
 * // preload.ts
 * // Simply import the preload module to expose the API
 * import 'electron-multi-window/preload';
 * ```
 * 
 * ### Renderer Process (React)
 * 
 * ```tsx
 * import { 
 *   createWindow, 
 *   emit, 
 *   listen,
 *   useSyncedState,
 *   useIPCListener 
 * } from 'electron-multi-window/renderer';
 * 
 * function App() {
 *   // Synced state across all windows
 *   const [theme, setTheme] = useSyncedState('theme', 'light');
 * 
 *   // Listen for custom events
 *   useIPCListener('user:activity', (data) => {
 *     console.log('User activity:', data);
 *   });
 * 
 *   const openEditor = async () => {
 *     await createWindow({
 *       route: 'editor.html',
 *       initialData: { documentId: '123' }
 *     });
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={openEditor}>Open Editor</button>
 *       <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
 *         Toggle Theme
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */

// Re-export types from shared
export type {
  WindowConfig,
  WindowInfo,
  LibraryMainOptions,
  LibraryRendererOptions,
  IPCMessage,
  IPCCallback,
  Unsubscribe,
  WindowEvent,
  WindowEventType,
  WindowEventCallback,
} from './shared/types';

export { IPC_CHANNELS } from './shared/types';
