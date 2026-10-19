# Electron Multi Window, pure Electron

The same application as the [`master`](https://github.com/Tatiwel/electron-multi-window) branch, written in plain JavaScript: no framework, no bundler, no TypeScript, no build step. Electron runs the files in `src/` as they are.

The app creates messages in a main window and edits each one in its own child window. Every window stays in sync: typing in one shows up in the others, saving or cancelling ends the edit everywhere, deleting a message closes its window, and closing a window discards its draft.

## Why this branch exists

To show that the design of the `master` branch does not depend on React. The state lives in the main process, a pure reducer changes it, the windows only dispatch actions and render what they receive, and one HTML page serves every window through hash routes. None of that needs a framework; this branch is the proof.

Both versions render the same DOM (same classes, `aria-label`s, placeholders, window titles, table and modal structure), so the **same Playwright e2e suite runs unchanged on both**. Only the fixture differs: here it launches Electron on the sources, with no build.

Version 1 of this branch (a single input mirrored into one window) is preserved at the [`pure-electron-v1.0.0`](https://github.com/Tatiwel/electron-multi-window/tree/pure-electron-v1.0.0) tag. Its demo is `misc/demo-pure-electron.gif`.

## Running it

Requires [Bun](https://bun.sh/) v1.x and Node.js (for the Playwright runner).

```bash
bun install
bun start
```

| Command | Description |
|---------|-------------|
| `bun start` | Start the application |
| `bun run test:e2e` | Run the Playwright e2e suite |
| `bun run test:e2e:headless` | Run the suite under Xvfb, isolated from the desktop session (Wayland) |

## Architecture

The main process is the single source of truth. `src/main/store.js` holds the whole state (`{ messages, editing }`) and is the only place that changes it. A renderer dispatches an action (`message/create`, `message/delete`, `edit/start`, `edit/draft`, `edit/save`, `edit/cancel`); the main process validates it, checks that the sender may perform it (a child window may only edit its own message), runs the pure reducer in `src/shared/reducer.js` and, when the state changed, broadcasts the new state to every window. A message is in edit mode exactly when `editing[id]` exists.

Every window loads `src/renderer/index.html` with a route in the hash. `src/renderer/js/main.js` resolves the hash with `src/shared/routes.js` and mounts the matching screen, or an "Unknown route" screen.

| Route | Pattern | Screen | Window |
|-------|---------|--------|--------|
| `ROUTES.home` | `/` (an empty hash counts as `/`) | `home.js` | Main window, 800×600 |
| `ROUTES.message` | `/message/:id` | `message-window.js` | Edit window of message `id`, 600×400 |

Every window runs with `contextIsolation: true`, `nodeIntegration: false` and `sandbox: true`. The renderer has no access to Node; it only sees `window.electronAPI`, exposed by the preload.

### IPC channels

| Channel | Direction | Payload |
|---------|-----------|---------|
| `store:get` | renderer → main (invoke) | — → the whole state |
| `store:dispatch` | renderer → main | an action |
| `store:changed` | main → every renderer | the whole state |
| `window:open` | main window → main | `{ route }`, e.g. `{ route: '/message/abc' }` (opens or focuses the window of that route) |
| `window:close` | renderer → main | `{ route }` |

`window:open` is accepted only from the main window and only for a route that resolves and is not `/`; `/message/:id` also needs an existing message. `window:close` is accepted from the main window for any route, or from a child for its own route.

### Files

```
src/
├── main/
│   ├── main.js            Entry point: creates the store and the main window
│   ├── store.js           createStore: state, reducer, ids, broadcast of store:changed
│   ├── windows.js         IPC handlers, validation, authorization, child windows keyed by route
│   └── preload.cjs        Exposes window.electronAPI (CommonJS, see below)
├── shared/                Imported by the main process and the renderer
│   ├── ipc.js             Channel names and the isAction / isWindowRoutePayload guards
│   ├── reducer.js         Pure (state, action) => state
│   └── routes.js          ROUTES, matchRoute, resolveRoute, buildRoute
└── renderer/
    ├── index.html         The single page loaded by every window
    ├── css/               global.css, app.css, newWindow.css
    ├── assets/icons/      Button icons
    └── js/
        ├── main.js        Picks the screen from the hash route
        ├── store.js       Mirror of the main-process state: getState, dispatch, subscribe
        ├── route.js       Route of this window, follows hashchange
        ├── home.js        Main window: create form, message table, modal
        ├── message-window.js  Child window: one message, read or edit mode
        ├── draft-input.js Local value of an edit input, so typing never loses a keystroke
        └── dom.js         Small element helper
tests/e2e/                 Playwright suite, the same scenarios as master
```

The main process and the renderer are ES modules (`"type": "module"`), and the renderer loads them with `<script type="module">` straight from `file://`. The preload is the exception: an ES module preload needs the sandbox turned off, so `preload.cjs` stays CommonJS and repeats the channel names of `src/shared/ipc.js`.

## Adding a new window

1. **Register the route** in `ROUTES` (`src/shared/routes.js`), e.g. `settings: '/settings'`. If the window needs its own size or other `BrowserWindow` options, add an entry for the pattern to `windowOptions` in `src/main/windows.js`.
2. **Create the screen** in `src/renderer/js/`, as a `mountX(container)` function that sets `document.title`, builds its DOM, subscribes to the store and returns `{ destroy }`. Mount it from `src/renderer/js/main.js` for its pattern.
3. **Open it** with `openWindow(buildRoute(ROUTES.settings))` from `src/renderer/js/store.js` (the main window is the only one allowed to open windows). Opening a route that is already open focuses its window.

## Compared with the React version

React gives the `master` branch declarative re-rendering: a screen is a function of the state and React works out which DOM nodes to touch. Here that work is manual: each screen keeps references to its nodes and patches them, keyed rows are moved only when out of place so a focused input is not detached, and the attributes React writes on its own (the `value` attribute of inputs, the text of a textarea) are written by hand to keep the DOM identical. TypeScript gives `master` checked types for the state, the actions and the `electronAPI` contract; here they are documented in comments and checked only at the IPC boundary, by the same runtime guards. Vite gives hot reload, a production build and packaging with electron-builder; this branch has none of that and runs the sources directly.

What this branch shows is that the design itself is plain Electron: one store in the main process, a pure reducer, five IPC channels, sender authorization, one page with hash routes. The framework is a convenience on top, not a requirement.

## License

ISC. See [LICENSE](LICENSE).
