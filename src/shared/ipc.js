/**
 * IPC contract shared by the main process and the renderer. This file must
 * stay free of Electron, Node and DOM imports so that every side can import
 * it. The preload script cannot import ES modules, so it repeats the channel
 * names; keep both in sync.
 *
 * The main process owns the application state. Renderers dispatch actions
 * and receive the whole state back whenever it changes.
 *
 * Shapes, as plain objects:
 *   Message  { id: string, value: string }
 *   AppState { messages: Message[], editing: { [id]: draft } }
 *            A message is being edited iff its key exists in `editing`.
 *   Action   { type: 'message/create', value }
 *            { type: 'message/delete', id }
 *            { type: 'edit/start', id }
 *            { type: 'edit/draft', id, value }
 *            { type: 'edit/save', id }
 *            { type: 'edit/cancel', id }
 *   Payload of WINDOW_OPEN and WINDOW_CLOSE: { route }, an already resolved
 *            route such as '/message/abc'. See `routes.js`.
 *
 * `window.electronAPI`, exposed by `src/main/preload.cjs`:
 *   getState()            Promise of the whole AppState held by the main process
 *   dispatch(action)
 *   onStateChanged(cb)    returns an unsubscribe function
 *   openWindow(route)     opens, or focuses, the child window of the route
 *   closeWindow(route)    closes the child window of the route
 */

export const IPC = Object.freeze({
  // renderer -> main (invoke/handle)
  STORE_GET: 'store:get',
  // renderer -> main
  STORE_DISPATCH: 'store:dispatch',
  // main -> renderers
  STORE_CHANGED: 'store:changed',
  // renderer -> main
  WINDOW_OPEN: 'window:open',
  WINDOW_CLOSE: 'window:close',
});

// Runtime guards for payloads coming over IPC. Kept deliberately small; the
// project does not need a validation library.
const isRecord = (x) => typeof x === 'object' && x !== null;

const hasNonEmptyId = (x) => typeof x.id === 'string' && x.id.length > 0;

export const isWindowRoutePayload = (x) =>
  isRecord(x) && typeof x.route === 'string' && x.route.startsWith('/');

export const isAction = (x) => {
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
