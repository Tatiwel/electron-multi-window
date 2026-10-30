/**
 * State, actions and bridge type of the demo. This file must stay free of
 * Electron, Node and DOM imports so that every side can bundle it. Channel
 * names and the generic guards come from `@electron-multi-window/core`.
 *
 * The main process owns the application state. Renderers dispatch actions
 * and receive the whole state back whenever it changes.
 */
import {
  isNonEmptyString,
  isObject,
  type ElectronApi,
} from '@electron-multi-window/core/shared';

export type Message = { id: string; value: string };

export type AppState = {
  messages: Message[];
  /** Draft per message id. A message is being edited iff its key exists. */
  editing: Record<string, string>;
};

export type Action =
  | { type: 'message/create'; value: string }
  | { type: 'message/delete'; id: string }
  | { type: 'edit/start'; id: string }
  | { type: 'edit/draft'; id: string; value: string }
  | { type: 'edit/save'; id: string }
  | { type: 'edit/cancel'; id: string };

export type ActionType = Action['type'];

/** Shape of `window.electronAPI`, as exposed by `electron/preload.ts`. */
export type ElectronAPI = ElectronApi<AppState, Action>;

export const isAction = (x: unknown): x is Action => {
  if (!isObject(x)) {
    return false;
  }
  switch (x.type) {
    case 'message/create':
      return typeof x.value === 'string';
    case 'message/delete':
    case 'edit/start':
    case 'edit/save':
    case 'edit/cancel':
      return isNonEmptyString(x.id);
    case 'edit/draft':
      return isNonEmptyString(x.id) && typeof x.value === 'string';
    default:
      return false;
  }
};
