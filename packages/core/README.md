# @electron-multi-window/core

Building blocks for Electron apps with several windows kept in sync: a store in the main process as the single source of truth, a window manager keyed by hash route, and a typed, validated IPC bridge with React hooks on the renderer side.

> This package is not published yet. It lives in this workspace as `private` and is consumed with `"@electron-multi-window/core": "workspace:*"`; it will be published once the API settles.

## Entry points

The package has one entry per process, so each bundle only pulls what runs there:

| Import | Runs in | Depends on |
|--------|---------|------------|
| `@electron-multi-window/core/shared` | anywhere | nothing |
| `@electron-multi-window/core/main` | main process | `electron` |
| `@electron-multi-window/core/preload` | preload script | `electron` |
| `@electron-multi-window/core/renderer` | renderer | `react` (optional peer) |

`main` never imports `react` and `renderer` never imports `electron`. Built with `tsc` to ESM plus `.d.ts` in `dist/` (`bun run build`).

## How it fits together

```
renderer ──dispatch(action)──▶ store:dispatch ──▶ registerIpc: known sender? isAction? authorize(ctx, action)?
                                                      │
                                                      ▼
                                       store.dispatch → reducer → changed?
                                                      │
every window ◀──── store:changed (whole state) ◀──────┘   then store.subscribe listeners
```

| Channel (`CHANNELS`) | Direction | Payload |
|---------|-----------|---------|
| `store:get` (`STORE_GET`) | renderer → main (invoke) | — → state |
| `store:dispatch` (`STORE_DISPATCH`) | renderer → main | action |
| `store:changed` (`STORE_CHANGED`) | main → every window | state |
| `window:open` (`WINDOW_OPEN`) | main window → main | `{ route }` |
| `window:close` (`WINDOW_CLOSE`) | any window → main | `{ route }` |

## API

### `./shared`

```ts
function createRoutes<const D extends Record<string, string>>(definitions: D): Routes<D[keyof D]>;

interface Routes<P extends string> {
  patterns: readonly P[];
  matchRoute(pattern: P, path: string): RouteParams | null;
  resolveRoute(path: string): ResolvedRoute<P> | null;
  buildRoute(pattern: P, params?: RouteParams): string; // throws on a missing or invalid param
}
type RouteParams = Record<string, string>;
interface ResolvedRoute<P extends string> { pattern: P; params: RouteParams }

const CHANNELS: {
  STORE_GET: 'store:get'; STORE_DISPATCH: 'store:dispatch'; STORE_CHANGED: 'store:changed';
  WINDOW_OPEN: 'window:open'; WINDOW_CLOSE: 'window:close';
};
const BRIDGE_KEY: 'electronAPI';

function isObject(x: unknown): x is Record<string, unknown>;
function isNonEmptyString(x: unknown): x is string;
function isWindowRoutePayload(x: unknown): x is { route: string };

interface ElectronApi<S, A> {
  getState(): Promise<S>;
  dispatch(action: A): void;
  onStateChanged(callback: (state: S) => void): Unsubscribe;
  openWindow(route: string): void;
  closeWindow(route: string): void;
}
type Unsubscribe = () => void;
```

Patterns start with `/`; a segment starting with `:` is a parameter whose value is limited to `[A-Za-z0-9_-]`.

### `./main`

```ts
function createStore<S, A>(reducer: (state: S, action: A) => S, initialState: S): Store<S, A>;

interface Store<S, A> {
  getState(): S;
  dispatch(action: A): void;                       // broadcasts store:changed when the state changed
  subscribe(listener: (state: S, previous: S) => void): Unsubscribe;
}

function createWindowManager<P extends string>(options: {
  routes: Routes<P>;
  windowOptions?: Partial<Record<P, BrowserWindowConstructorOptions>>;
  preloadPath: string;
  indexHtmlPath: string;                           // loaded as indexHtmlPath#route
  devServerUrl?: string;                           // loaded as devServerUrl#route when set
  onWindowClosed?: (route: string) => void;
}): WindowManager<P>;

interface WindowManager<P extends string> {
  routes: Routes<P>;
  open(route: string): BrowserWindow | null;       // focuses it if open; null for an unknown route
  close(route: string): void;
  focus(route: string): boolean;
  getRoute(webContents: WebContents): string | null;
  getAll(): { route: string; window: BrowserWindow }[];
  closeAll(): void;
}

function registerIpc<S, A, P extends string>(options: {
  store: Store<S, A>;
  windows: WindowManager<P>;
  getMainWindow: () => BrowserWindow | null;
  isAction: (x: unknown) => x is A;
  authorize: (ctx: SenderContext<P>, action: A) => boolean;
  canOpenWindow?: (route: string, resolved: ResolvedRoute<P>) => boolean;
}): () => void;                                    // removes the handlers

type SenderContext<P extends string> =
  | { kind: 'main' }
  | { kind: 'child'; route: string; pattern: P; params: RouteParams };
```

- The store broadcasts to every live `BrowserWindow`, then calls the listeners. A reducer that returns the same reference means nothing changed.
- The window manager keeps one window per route. It always sets `preload`, `contextIsolation: true` and `nodeIntegration: false`, registers `closed` before loading, closes a window that fails to load, ignores destroyed windows and only forgets a route if the closing window still owns it.
- `registerIpc` only answers the main window and the windows of the manager. Only the main window may open windows, and only routes that resolve (then `canOpenWindow`, if given). A window may close itself; the main window may close any. What a sender may dispatch is entirely up to `authorize`.

### `./preload`

```ts
function exposeElectronApi(): void;   // window.electronAPI with the five methods
```

### `./renderer`

```ts
function createRendererApi<S, A>(): ElectronApi<S, A>;
function useStore<S, A>(api: ElectronApi<S, A>, initialState: S): { state: S; dispatch: (action: A) => void };
function useHashRoute<P extends string>(routes: Routes<P>): ResolvedRoute<P> | null;
function useDraftInput(storeValue: string, onChange: (value: string) => void): {
  value: string;
  handleChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};
```

`useDraftInput` gives an input a local value so the window that is typing never waits for the round trip, while values typed in other windows still come through: values it sent are recognised when the store echoes them back, anything else replaces the local value.

## Minimal example

A counter shown in a main window and in a `/details` window.

`shared/app.ts`

```ts
import { createRoutes, isObject } from '@electron-multi-window/core/shared';

export type State = { count: number };
export type Action = { type: 'increment' };

export const initialState: State = { count: 0 };
export const reducer = (state: State, action: Action): State =>
  action.type === 'increment' ? { count: state.count + 1 } : state;
export const isAction = (x: unknown): x is Action => isObject(x) && x.type === 'increment';

export const ROUTES = { home: '/', details: '/details' } as const;
export const routes = createRoutes(ROUTES);
```

`electron/main.ts`

```ts
import { app, type BrowserWindow } from 'electron';
import path from 'node:path';
import { createStore, createWindowManager, registerIpc } from '@electron-multi-window/core/main';
import { initialState, isAction, reducer, ROUTES, routes } from '../shared/app';

const store = createStore(reducer, initialState);
const windows = createWindowManager({
  routes,
  windowOptions: { [ROUTES.home]: { width: 800, height: 600 } },
  preloadPath: path.join(import.meta.dirname, 'preload.mjs'),
  indexHtmlPath: path.join(import.meta.dirname, '../dist/index.html'),
  devServerUrl: process.env.VITE_DEV_SERVER_URL,
});

let mainWindow: BrowserWindow | null = null;
registerIpc({
  store,
  windows,
  getMainWindow: () => mainWindow,
  isAction,
  authorize: (ctx) => ctx.kind === 'main', // only the main window may change the state
});

app.whenReady().then(() => {
  mainWindow = windows.open(ROUTES.home);
  mainWindow?.on('closed', () => windows.closeAll());
});
```

`electron/preload.ts`

```ts
import { exposeElectronApi } from '@electron-multi-window/core/preload';

exposeElectronApi();
```

`src/App.tsx`

```tsx
import { createRendererApi, useHashRoute, useStore } from '@electron-multi-window/core/renderer';
import { initialState, ROUTES, routes, type Action, type State } from '../shared/app';

const api = createRendererApi<State, Action>();

export const App = () => {
  const route = useHashRoute(routes);
  const { state, dispatch } = useStore(api, initialState);

  if (route?.pattern === ROUTES.details) {
    return <p>Count: {state.count}</p>;
  }
  return (
    <>
      <button onClick={() => dispatch({ type: 'increment' })}>{state.count}</button>
      <button onClick={() => api.openWindow(routes.buildRoute(ROUTES.details))}>Details</button>
    </>
  );
};
```

[`apps/demo`](../../apps/demo) is a complete app built on this package, with per-window authorization and side effects.
