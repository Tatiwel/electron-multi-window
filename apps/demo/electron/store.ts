import { BrowserWindow } from 'electron';
import { randomUUID } from 'node:crypto';
import { IPC, type Action, type AppState } from '../shared/ipc';
import { reducer, type ReducerAction } from '../shared/reducer';

export interface Store {
  getState: () => AppState;
  /** Applies the action and broadcasts the new state when it changed. */
  dispatch: (action: Action) => void;
}

const toReducerAction = (action: Action): ReducerAction =>
  action.type === 'message/create'
    ? { ...action, id: randomUUID() }
    : action;

const broadcast = (state: AppState) => {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
      win.webContents.send(IPC.STORE_CHANGED, state);
    }
  }
};

/**
 * Single source of truth for the application state. Lives in the main
 * process; every renderer dispatches actions here and receives the whole
 * state back through `STORE_CHANGED`.
 */
export const createStore = (initial: AppState): Store => {
  let state = initial;

  return {
    getState: () => state,
    dispatch: (action) => {
      const next = reducer(state, toReducerAction(action));
      if (next === state) {
        return;
      }
      state = next;
      broadcast(state);
    },
  };
};
