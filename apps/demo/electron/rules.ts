import type { BrowserWindowConstructorOptions } from 'electron';
import type {
  SenderContext,
  Store,
  WindowManager,
} from '@electron-multi-window/core/main';
import type { ResolvedRoute } from '@electron-multi-window/core/shared';
import type { Action, AppState } from '../shared/ipc';
import { hasDraft } from '../shared/reducer';
import {
  buildRoute,
  resolveRoute,
  ROUTES,
  type RoutePattern,
} from '../shared/routes';

type DemoStore = Store<AppState, Action>;
type DemoWindows = WindowManager<RoutePattern>;

/**
 * Size and other options per screen. A route without an entry opens with
 * the BrowserWindow defaults.
 */
export const windowOptions: Partial<
  Record<RoutePattern, BrowserWindowConstructorOptions>
> = {
  [ROUTES.home]: { width: 800, height: 600 },
  [ROUTES.message]: { width: 600, height: 400 },
};

const hasMessage = (state: AppState, id: string) =>
  state.messages.some((message) => message.id === id);

// Route of a message window, or null when the id cannot be part of a route.
const messageRoute = (id: string) => {
  try {
    return buildRoute(ROUTES.message, { id });
  } catch {
    return null;
  }
};

/**
 * The main window may do anything. A child window may only edit the message
 * its route points to.
 */
export const authorize = (
  ctx: SenderContext<RoutePattern>,
  action: Action
) => {
  if (ctx.kind === 'main') {
    return true;
  }
  if (ctx.pattern !== ROUTES.message) {
    return false;
  }
  switch (action.type) {
    case 'edit/start':
    case 'edit/draft':
    case 'edit/save':
    case 'edit/cancel':
      return action.id === ctx.params.id;
    default:
      return false;
  }
};

/**
 * Whether the main window may open `route` right now. The home route is the
 * main window and is never opened twice; a message route needs an existing
 * message.
 */
export const canOpenWindow =
  (store: DemoStore) =>
  (_route: string, resolved: ResolvedRoute<RoutePattern>) => {
    switch (resolved.pattern) {
      case ROUTES.home:
        return false;
      case ROUTES.message:
        return hasMessage(store.getState(), resolved.params.id);
      default:
        return true;
    }
  };

/** Deleting a message closes its window. */
export const closeWindowsOfDeletedMessages = (
  store: DemoStore,
  windows: DemoWindows
) =>
  store.subscribe((state, previous) => {
    for (const message of previous.messages) {
      if (hasMessage(state, message.id)) {
        continue;
      }
      const route = messageRoute(message.id);
      if (route !== null) {
        windows.close(route);
      }
    }
  });

/**
 * Closing a message window discards its draft, which is what takes the main
 * window out of edit mode.
 */
export const discardDraftOfClosedWindow =
  (store: DemoStore) => (route: string) => {
    const resolved = resolveRoute(route);
    if (resolved?.pattern !== ROUTES.message) {
      return;
    }
    const { id } = resolved.params;
    if (hasDraft(store.getState().editing, id)) {
      store.dispatch({ type: 'edit/cancel', id });
    }
  };
