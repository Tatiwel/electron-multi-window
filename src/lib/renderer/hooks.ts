/**
 * electron-multi-window - React Hooks
 * 
 * Custom React hooks for window management and IPC communication
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  WindowInfo,
  WindowConfig,
  IPCCallback,
  WindowEvent,
} from '../shared/types';
import * as multiWindow from './multiWindow';

/**
 * Hook to get the current window's ID
 * 
 * @returns The current window's ID or undefined if not yet loaded
 * 
 * @example
 * ```tsx
 * const windowId = useCurrentWindowId();
 * console.log('My window ID:', windowId);
 * ```
 */
export const useCurrentWindowId = (): string | undefined => {
  const [windowId, setWindowId] = useState<string | undefined>();

  useEffect(() => {
    multiWindow.getCurrentWindowId().then(setWindowId);
  }, []);

  return windowId;
};

/**
 * Hook to get the initial data passed to the current window
 * 
 * @returns Object containing loading state, data, and any error
 * 
 * @example
 * ```tsx
 * interface EditorData {
 *   documentId: string;
 *   title: string;
 * }
 * 
 * const { data, isLoading, error } = useInitialData<EditorData>();
 * 
 * if (isLoading) return <Loading />;
 * if (error) return <Error message={error.message} />;
 * 
 * return <Editor documentId={data?.documentId} />;
 * ```
 */
export const useInitialData = <T = unknown>(): {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
} => {
  const [data, setData] = useState<T | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    multiWindow
      .getInitialData<T>()
      .then((result) => {
        if (mounted) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { data, isLoading, error };
};

/**
 * Hook to listen for messages on a specific channel
 * 
 * @param channel - Channel to listen on
 * @param callback - Function to call when a message is received
 * 
 * @example
 * ```tsx
 * useIPCListener('document:updated', (data, message) => {
 *   console.log(`Document updated from window ${message.sourceWindowId}:`, data);
 * });
 * ```
 */
export const useIPCListener = <T = unknown>(
  channel: string,
  callback: IPCCallback<T>
): void => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const unsubscribe = multiWindow.listen<T>(channel, (data, message) => {
      callbackRef.current(data, message);
    });

    return unsubscribe;
  }, [channel]);
};

/**
 * Hook to listen for window events
 * 
 * @param callback - Function to call when a window event occurs
 * @param eventTypes - Optional array of event types to filter
 * 
 * @example
 * ```tsx
 * useWindowEvents((event) => {
 *   if (event.type === 'closed') {
 *     console.log(`Window ${event.windowId} was closed`);
 *   }
 * }, ['closed', 'created']);
 * ```
 */
export const useWindowEvents = (
  callback: (event: WindowEvent) => void,
  eventTypes?: WindowEvent['type'][]
): void => {
  const callbackRef = useRef(callback);
  const eventTypesRef = useRef(eventTypes);

  useEffect(() => {
    callbackRef.current = callback;
    eventTypesRef.current = eventTypes;
  }, [callback, eventTypes]);

  useEffect(() => {
    const unsubscribe = multiWindow.onWindowEvent((event) => {
      const types = eventTypesRef.current;
      if (!types || types.includes(event.type)) {
        callbackRef.current(event);
      }
    });

    return unsubscribe;
  }, []);
};

/**
 * Hook to get list of all windows with auto-updates
 * 
 * @returns Object containing windows list, loading state, and refresh function
 * 
 * @example
 * ```tsx
 * const { windows, isLoading, refresh } = useAllWindows();
 * 
 * return (
 *   <ul>
 *     {windows.map(win => (
 *       <li key={win.id}>{win.title}</li>
 *     ))}
 *   </ul>
 * );
 * ```
 */
export const useAllWindows = (): {
  windows: WindowInfo[];
  isLoading: boolean;
  refresh: () => void;
} => {
  const [windows, setWindows] = useState<WindowInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setIsLoading(true);
    multiWindow.getAllWindows().then((result) => {
      setWindows(result);
      setIsLoading(false);
    });
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh on window events
  useWindowEvents(refresh, ['created', 'closed']);

  return { windows, isLoading, refresh };
};

/**
 * Hook to manage window creation
 * 
 * @returns Object with createWindow function, loading state, and any error
 * 
 * @example
 * ```tsx
 * const { createWindow, isCreating, error } = useCreateWindow();
 * 
 * const handleOpenEditor = async () => {
 *   await createWindow({
 *     route: 'editor.html',
 *     initialData: { documentId: '123' }
 *   });
 * };
 * ```
 */
export const useCreateWindow = (): {
  createWindow: (config: WindowConfig) => Promise<WindowInfo>;
  isCreating: boolean;
  lastCreated: WindowInfo | null;
  error: Error | null;
} => {
  const [isCreating, setIsCreating] = useState(false);
  const [lastCreated, setLastCreated] = useState<WindowInfo | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(async (config: WindowConfig): Promise<WindowInfo> => {
    setIsCreating(true);
    setError(null);
    
    try {
      const windowInfo = await multiWindow.createWindow(config);
      setLastCreated(windowInfo);
      return windowInfo;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return { createWindow: create, isCreating, lastCreated, error };
};

/**
 * Hook to emit messages with stable references
 * 
 * @param channel - Default channel to emit on
 * @returns Function to emit messages
 * 
 * @example
 * ```tsx
 * const emitUpdate = useEmit('document:updated');
 * 
 * const handleChange = (content: string) => {
 *   emitUpdate({ id: documentId, content });
 * };
 * ```
 */
export const useEmit = <T = unknown>(
  channel: string
): ((data: T, targetWindowId?: string) => void) => {
  return useCallback(
    (data: T, targetWindowId?: string) => {
      multiWindow.emit(channel, data, targetWindowId);
    },
    [channel]
  );
};

/**
 * Hook to broadcast messages with stable references
 * 
 * @param channel - Default channel to broadcast on
 * @returns Function to broadcast messages
 */
export const useBroadcast = <T = unknown>(
  channel: string
): ((data: T) => void) => {
  return useCallback(
    (data: T) => {
      multiWindow.broadcast(channel, data);
    },
    [channel]
  );
};

/**
 * Hook for bidirectional state synchronization across windows
 * 
 * @param channel - Channel for synchronization
 * @param initialValue - Initial state value
 * @returns Tuple of [state, setState] similar to useState
 * 
 * @example
 * ```tsx
 * // This state will be synchronized across all windows
 * const [sharedState, setSharedState] = useSyncedState('app:theme', 'light');
 * 
 * const toggleTheme = () => {
 *   setSharedState(prev => prev === 'light' ? 'dark' : 'light');
 * };
 * ```
 */
export const useSyncedState = <T>(
  channel: string,
  initialValue: T
): [T, (valueOrUpdater: T | ((prev: T) => T)) => void] => {
  const [state, setState] = useState<T>(initialValue);
  const isUpdatingRef = useRef(false);

  // Listen for updates from other windows
  useIPCListener<T>(channel, (data) => {
    if (!isUpdatingRef.current) {
      setState(data);
    }
    isUpdatingRef.current = false;
  });

  // Broadcast updates
  const setSyncedState = useCallback(
    (valueOrUpdater: T | ((prev: T) => T)) => {
      setState((prev) => {
        const newValue =
          typeof valueOrUpdater === 'function'
            ? (valueOrUpdater as (prev: T) => T)(prev)
            : valueOrUpdater;
        
        isUpdatingRef.current = true;
        multiWindow.broadcast(channel, newValue);
        return newValue;
      });
    },
    [channel]
  );

  return [state, setSyncedState];
};
