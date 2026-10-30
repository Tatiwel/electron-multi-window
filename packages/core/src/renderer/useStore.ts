import { useCallback, useEffect, useState } from 'react';
import type { ElectronApi } from '../shared/index.js';

/**
 * Mirrors the main-process store. On mount it subscribes to state changes
 * and asks for the current state; afterwards every change pushed by the main
 * process replaces the whole state. `initialState` is shown until the first
 * answer arrives. `api` should be created once, outside the component.
 */
export const useStore = <S, A>(api: ElectronApi<S, A>, initialState: S) => {
  const [state, setState] = useState<S>(initialState);

  useEffect(() => {
    let active = true;

    // Subscribe before asking so no change slips between the two.
    const unsubscribe = api.onStateChanged((next) => {
      if (active) {
        setState(next);
      }
    });

    api
      .getState()
      .then((current) => {
        if (active) {
          setState(current);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to fetch the application state:', error);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [api]);

  const dispatch = useCallback((action: A) => api.dispatch(action), [api]);

  return { state, dispatch };
};
