import { BrowserWindow } from 'electron';
import { randomUUID } from 'node:crypto';
import { IPC } from '../shared/ipc.js';
import { reducer } from '../shared/reducer.js';

// `message/create` gets the id here, so the reducer stays pure.
const toReducerAction = (action) =>
  action.type === 'message/create' ? { ...action, id: randomUUID() } : action;

const broadcast = (state) => {
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
 *
 * `dispatch` applies the action and broadcasts the new state when it changed.
 */
export const createStore = (initial) => {
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
