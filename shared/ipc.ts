/**
 * IPC contract shared by the main process, the preload script and the
 * renderer. This file must stay free of Electron, Node and DOM imports so
 * that every side can bundle it.
 *
 * The main process owns the application state. Renderers dispatch actions
 * and receive the whole state back whenever it changes.
 */

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

/** What a child window learns about itself from the main process. */
export type WindowContext = { messageId: string };

/**
 * Payload of `WINDOW_OPEN` and `WINDOW_CLOSE`: an already resolved route,
 * such as '/message/abc'. See `shared/routes.ts`.
 */
export type WindowRoutePayload = { route: string };

export type Unsubscribe = () => void;

export const IPC = {
  // renderer -> main (invoke/handle)
  STORE_GET: 'store:get',
  // renderer -> main
  STORE_DISPATCH: 'store:dispatch',
  // main -> renderers
  STORE_CHANGED: 'store:changed',
  // renderer -> main
  WINDOW_OPEN: 'window:open',
  WINDOW_CLOSE: 'window:close',
  // renderer -> main (invoke/handle)
  WINDOW_CONTEXT: 'window:context',
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];

/** Shape of `window.electronAPI`, as exposed by `electron/preload.ts`. */
export interface ElectronAPI {
  /** Resolves with the whole application state held by the main process. */
  getState: () => Promise<AppState>;
  dispatch: (action: Action) => void;
  onStateChanged: (callback: (state: AppState) => void) => Unsubscribe;
  /** Opens, or focuses, the child window of the given route. */
  openWindow: (route: string) => void;
  /** Closes the child window of the given route. */
  closeWindow: (route: string) => void;
  /** Resolves with the message this (child) window belongs to, or null. */
  getWindowContext: () => Promise<WindowContext | null>;
}

// Runtime guards for payloads coming over IPC. Kept deliberately small; the
// project does not need a validation library.
const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null;

const hasNonEmptyId = (x: Record<string, unknown>) =>
  typeof x.id === 'string' && x.id.length > 0;

export const isWindowRoutePayload = (x: unknown): x is WindowRoutePayload =>
  isRecord(x) && typeof x.route === 'string' && x.route.startsWith('/');

export const isAction = (x: unknown): x is Action => {
  if (!isRecord(x)) {
    return false;
  }
  switch (x.type) {
    case 'message/create':
      return typeof x.value === 'string';
    case 'message/delete':
    case 'edit/start':
    case 'edit/save':
    case 'edit/cancel':
      return hasNonEmptyId(x);
    case 'edit/draft':
      return hasNonEmptyId(x) && typeof x.value === 'string';
    default:
      return false;
  }
};
