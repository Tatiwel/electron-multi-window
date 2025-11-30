import { useState, useEffect } from 'react';

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
 * Window initialization data
 */
export interface WindowInitData<T = unknown> {
  windowId: string | null;
  data: T | null;
  route: string | null;
  isReady: boolean;
}

/**
 * Hook for accessing window initialization data
 * 
 * Use this hook in child windows to get the initial data and route
 * that was passed when the window was created.
 * 
 * @example
 * ```tsx
 * const { windowId, data, route, isReady } = useWindowInit<{ text: string }>();
 * 
 * if (!isReady) return <div>Loading...</div>;
 * 
 * return <div>Window {windowId}: {data?.text}</div>;
 * ```
 */
export const useWindowInit = <T = unknown>(): WindowInitData<T> => {
  const [initData, setInitData] = useState<WindowInitData<T>>({
    windowId: null,
    data: null,
    route: null,
    isReady: false,
  });

  useEffect(() => {
    const api = ensureElectronWindow();

    // Try to get initial data immediately
    const windowId = api.getWindowId();
    const data = api.getInitialData<T>();
    const route = api.getRoute();

    if (windowId) {
      setInitData({
        windowId,
        data,
        route,
        isReady: true,
      });
    } else {
      // Listen for initialization
      const unsubscribe = api.on<{ windowId: string; data: T; route?: string }>(
        'window-init-internal',
        (payload) => {
          setInitData({
            windowId: payload.windowId,
            data: payload.data,
            route: payload.route ?? null,
            isReady: true,
          });
        }
      );

      // Request init data
      const checkInit = () => {
        const id = api.getWindowId();
        const d = api.getInitialData<T>();
        const r = api.getRoute();
        if (id) {
          setInitData({
            windowId: id,
            data: d,
            route: r,
            isReady: true,
          });
        }
      };

      // Poll for init data (in case it comes before subscription)
      const intervalId = setInterval(checkInit, 50);
      setTimeout(() => clearInterval(intervalId), 1000);

      return () => {
        unsubscribe();
        clearInterval(intervalId);
      };
    }
  }, []);

  return initData;
};

/**
 * Hook for subscribing to a specific channel with cleanup
 * 
 * @param channel - The channel to subscribe to
 * @param callback - The callback to invoke when a message is received
 * 
 * @example
 * ```tsx
 * useWindowChannel<{ text: string }>('my-channel', (data) => {
 *   console.log('Received:', data);
 * });
 * ```
 */
export const useWindowChannel = <T = unknown>(
  channel: string,
  callback: (payload: T) => void
): void => {
  useEffect(() => {
    const api = ensureElectronWindow();
    
    const unsubscribe = api.on<T>(channel, callback);

    return () => {
      unsubscribe();
    };
  }, [channel, callback]);
};

/**
 * Hook for sending messages to other windows
 * 
 * @returns Object with send and broadcast methods
 * 
 * @example
 * ```tsx
 * const { send, broadcast } = useWindowSend();
 * 
 * // Send to specific window
 * send('target-window-id', 'my-channel', { text: 'Hello!' });
 * 
 * // Broadcast to all windows
 * broadcast('my-channel', { text: 'Hello everyone!' });
 * ```
 */
export const useWindowSend = () => {
  const send = <T = unknown>(targetId: string, channel: string, data: T) => {
    const api = ensureElectronWindow();
    api.send(channel, data, targetId);
  };

  const broadcast = <T = unknown>(channel: string, data: T) => {
    const api = ensureElectronWindow();
    api.send(channel, data);
  };

  return { send, broadcast };
};
