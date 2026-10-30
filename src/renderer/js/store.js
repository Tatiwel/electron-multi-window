/**
 * Mirror of the main-process store. The first `subscribe` subscribes to
 * state changes and then asks for the current state; afterwards every change
 * pushed by the main process replaces the whole state and is passed to every
 * listener.
 */

const EMPTY_STATE = { messages: [], editing: {} };

let state = EMPTY_STATE;
let started = false;
const listeners = new Set();

const electronAPI = () => {
  if (!window.electronAPI) {
    throw new Error('electronAPI is unavailable in the current context.');
  }
  return window.electronAPI;
};

const setState = (next) => {
  state = next;
  for (const listener of listeners) {
    listener(state);
  }
};

const start = () => {
  if (started) {
    return;
  }
  started = true;

  // Subscribe before asking so no change slips between the two.
  electronAPI().onStateChanged(setState);
  electronAPI()
    .getState()
    .then(setState)
    .catch((error) => {
      console.error('Failed to fetch the application state:', error);
    });
};

export const getState = () => state;

export const dispatch = (action) => {
  electronAPI().dispatch(action);
};

/** Calls `listener(state)` on every change; returns an unsubscribe function. */
export const subscribe = (listener) => {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
  };
};

/** Opens, or focuses, the window of a resolved route ('/message/abc'). */
export const openWindow = (route) => {
  electronAPI().openWindow(route);
};

export const closeWindow = (route) => {
  electronAPI().closeWindow(route);
};
