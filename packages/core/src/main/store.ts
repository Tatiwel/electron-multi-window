import { BrowserWindow } from 'electron';
import { CHANNELS } from '../shared/index.js';
import type { Unsubscribe } from '../shared/index.js';

export type Reducer<S, A> = (state: S, action: A) => S;

/** Called after every change, once the new state has been broadcast. */
export type StoreListener<S> = (state: S, previous: S) => void;

export interface Store<S, A> {
  getState: () => S;
  /** Applies the action and, when the state changed, broadcasts it. */
  dispatch: (action: A) => void;
  subscribe: (listener: StoreListener<S>) => Unsubscribe;
}

const broadcast = (state: unknown) => {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
      win.webContents.send(CHANNELS.STORE_CHANGED, state);
    }
  }
};

/**
 * Single source of truth for the application state. Lives in the main
 * process; every window dispatches actions here and receives the whole state
 * back through `store:changed`. A reducer that returns the same reference
 * means "nothing changed": no broadcast, no listener call.
 */
export const createStore = <S, A>(
  reducer: Reducer<S, A>,
  initialState: S
): Store<S, A> => {
  let state = initialState;
  const listeners = new Set<StoreListener<S>>();

  return {
    getState: () => state,
    dispatch: (action) => {
      const previous = state;
      const next = reducer(previous, action);
      if (next === previous) {
        return;
      }
      state = next;
      broadcast(state);
      // The copy is a snapshot: a listener that subscribes or unsubscribes
      // while this loop runs must not change which listeners it visits.
      // oxlint-disable-next-line unicorn/no-useless-spread
      for (const listener of [...listeners]) {
        listener(state, previous);
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};
