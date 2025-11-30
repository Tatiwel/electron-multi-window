import { useCallback, useRef } from 'react';
import type { WindowConfig } from '../types';

/**
 * Ensure electronWindow API is available
 */
const ensureElectronWindow = () => {
  if (!window.electronWindow) {
    throw new Error('electronWindow API is unavailable. Make sure the preload script is loaded correctly.');
  }
  return window.electronWindow;
};

/**
 * Options for opening a window
 */
export interface OpenWindowOptions {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  path?: string;
}

/**
 * Hook for managing a pool of windows
 * 
 * @example
 * ```tsx
 * const { openWindow, closeWindow, closeAllWindows } = useWindowPool();
 * 
 * // Open a new window with initial data
 * openWindow('editor-1', { text: 'Hello' }, { width: 500, path: '/editor' });
 * 
 * // Close a specific window
 * closeWindow('editor-1');
 * ```
 */
export const useWindowPool = () => {
  const openWindowsRef = useRef<Set<string>>(new Set());

  /**
   * Open a new window or focus existing one
   */
  const openWindow = useCallback(<T = unknown>(
    windowId: string,
    initialData?: T,
    options?: OpenWindowOptions
  ) => {
    const api = ensureElectronWindow();
    
    const config: WindowConfig = {
      id: windowId,
      data: initialData,
      width: options?.width,
      height: options?.height,
      x: options?.x,
      y: options?.y,
      path: options?.path,
    };

    api.create(config);
    openWindowsRef.current.add(windowId);
  }, []);

  /**
   * Close a specific window by ID
   */
  const closeWindow = useCallback((windowId: string) => {
    const api = ensureElectronWindow();
    api.close(windowId);
    openWindowsRef.current.delete(windowId);
  }, []);

  /**
   * Close the current window
   */
  const closeSelf = useCallback(() => {
    const api = ensureElectronWindow();
    api.close();
  }, []);

  /**
   * Get list of windows opened by this instance
   */
  const getOpenWindows = useCallback(() => {
    return Array.from(openWindowsRef.current);
  }, []);

  return {
    openWindow,
    closeWindow,
    closeSelf,
    getOpenWindows,
  };
};
