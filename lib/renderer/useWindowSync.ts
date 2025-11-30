import { useState, useEffect, useCallback, useRef } from 'react';

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
 * Hook for synchronizing state across windows
 * 
 * When any window calls setData, all windows listening to the same channel
 * will receive the updated data.
 * 
 * @param channel - The channel name to synchronize on
 * @param initialValue - Optional initial value
 * 
 * @example
 * ```tsx
 * // In any window
 * const [data, setData] = useWindowSync<{ text: string }>('shared-data', { text: '' });
 * 
 * // Calling setData updates all windows listening to 'shared-data'
 * setData({ text: 'Hello from any window!' });
 * ```
 */
export const useWindowSync = <T = unknown>(
  channel: string,
  initialValue?: T
): [T | undefined, (newValue: T) => void] => {
  const [data, setLocalData] = useState<T | undefined>(initialValue);
  const channelRef = useRef(channel);

  // Keep channel ref updated
  useEffect(() => {
    channelRef.current = channel;
  }, [channel]);

  // Subscribe to channel updates
  useEffect(() => {
    const api = ensureElectronWindow();
    
    const unsubscribe = api.on<T>(channel, (payload) => {
      setLocalData(payload);
    });

    return () => {
      unsubscribe();
    };
  }, [channel]);

  /**
   * Set data and broadcast to all windows
   */
  const setData = useCallback((newValue: T) => {
    const api = ensureElectronWindow();
    
    // Update local state
    setLocalData(newValue);
    
    // Broadcast to other windows
    api.send(channelRef.current, newValue);
  }, []);

  return [data, setData];
};

/**
 * Hook for synchronizing state with a specific target window
 * 
 * @param channel - The channel name
 * @param targetWindowId - The target window ID
 * @param initialValue - Optional initial value
 * 
 * @example
 * ```tsx
 * const [data, setData] = useWindowSyncWithTarget<{ text: string }>('editor-data', 'editor-1');
 * 
 * // Only sends to 'editor-1' window
 * setData({ text: 'Hello editor!' });
 * ```
 */
export const useWindowSyncWithTarget = <T = unknown>(
  channel: string,
  targetWindowId: string,
  initialValue?: T
): [T | undefined, (newValue: T) => void] => {
  const [data, setLocalData] = useState<T | undefined>(initialValue);
  const channelRef = useRef(channel);
  const targetRef = useRef(targetWindowId);

  // Keep refs updated
  useEffect(() => {
    channelRef.current = channel;
    targetRef.current = targetWindowId;
  }, [channel, targetWindowId]);

  // Subscribe to channel updates
  useEffect(() => {
    const api = ensureElectronWindow();
    
    const unsubscribe = api.on<T>(channel, (payload) => {
      setLocalData(payload);
    });

    return () => {
      unsubscribe();
    };
  }, [channel]);

  /**
   * Set data and send to target window
   */
  const setData = useCallback((newValue: T) => {
    const api = ensureElectronWindow();
    
    // Update local state
    setLocalData(newValue);
    
    // Send to target window
    api.send(channelRef.current, newValue, targetRef.current);
  }, []);

  return [data, setData];
};
