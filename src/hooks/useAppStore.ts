import { useCallback, useEffect, useState } from 'react';
import { windowService, type Action, type AppState } from '../services';

const EMPTY_STATE: AppState = { messages: [], editing: {} };

/**
 * Mirrors the main-process store. On mount it subscribes to state changes
 * and asks for the current state; afterwards every change pushed by the main
 * process replaces the whole state.
 */
export const useAppStore = () => {
  const [state, setState] = useState<AppState>(EMPTY_STATE);

  useEffect(() => {
    let active = true;

    // Subscribe before asking so no change slips between the two.
    const unsubscribe = windowService.onStateChanged((next) => {
      if (active) {
        setState(next);
      }
    });

    windowService
      .getState()
      .then((initial) => {
        if (active) {
          setState(initial);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to fetch the application state:', error);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const dispatch = useCallback((action: Action) => {
    windowService.dispatch(action);
  }, []);

  return { state, dispatch };
};
