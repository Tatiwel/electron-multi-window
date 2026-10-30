# Electron Multi Window demo

The app of this repository, built on [`@electron-multi-window/core`](../../packages/core). For the overview, the two lines of the project (React/TypeScript and plain JavaScript) and the workspace layout, see the [root README](../../README.md).

The main window creates, edits and deletes messages; each message can be edited in its own child window, and every keystroke shows up in the other windows at once.

## What lives here and not in the core

| File | Contents |
|------|----------|
| `shared/ipc.ts` | `Message`, `AppState`, `Action`, `isAction` and the bridge type `ElectronAPI` |
| `shared/reducer.ts` | The pure reducer of messages and drafts (`editing[id]` exists ⇔ message `id` is being edited) |
| `shared/routes.ts` | `ROUTES` (`/` and `/message/:id`) passed to `createRoutes` |
| `electron/rules.ts` | `windowOptions`, `authorize`, `canOpenWindow` and the two effects below |
| `electron/main.ts` | Wires the store, the window manager and the IPC; generates message ids |
| `electron/preload.ts` | `exposeElectronApi()` |
| `src/api.ts` | The typed bridge and `useAppStore()` |
| `src/pages/`, `src/components/` | `Root` (screen per route), `Home`, `MessageWindow`, `MessageItem` |

Rules of the demo:

- `message/*` actions only from the main window; `edit/*` from a child window only for the message id in its own route.
- `window:open` for `/message/:id` only when that message exists; `/` is the main window and is never opened twice.
- Deleting a message closes its child window (`store.subscribe` compares the messages before and after).
- Closing a child window with the X discards its draft (`onWindowClosed` dispatches `edit/cancel`), which takes the main window out of edit mode.

| Route | Screen | Window |
|-------|--------|--------|
| `/` | `Home` (`src/pages/App.tsx`) | Main window, 800×600 |
| `/message/:id` | `MessageWindow` (`src/pages/MessageWindow.tsx`) | Edit window of message `id`, 600×400 |

## Adding a window

1. Create the screen in `src/pages/`, set `document.title` in a `useEffect`, and render it from `src/pages/Root.tsx` for its pattern.
2. Add the pattern to `ROUTES` in `shared/routes.ts`, and its size to `windowOptions` in `electron/rules.ts` if needed.
3. Open it with `api.openWindow(buildRoute(ROUTES.yourScreen))` from the main window, and allow it in `canOpenWindow`.

## Build and packaging

- The core is a `devDependency` and is bundled into `dist-electron/main.js` and `preload.mjs` by `vite-plugin-electron`; the packaged app contains only `dist/` and `dist-electron/` (plus the production `dependencies`).
- `package.json` sets `installConfig.hoistingLimits: "workspaces"`, so Bun keeps a complete `node_modules` here, where `electron-builder` expects it.
- `vite.config.ts` dedupes `react` and `react-dom`: the core is linked from `packages/core` and would otherwise resolve a second copy of React from the root.

## Scripts

Run them from the root (`bun run test:e2e`, …) so the core is built first, or here once it is:

| Command | What it does |
|---------|--------------|
| `bun run dev` | Vite dev server with the Electron app and hot reload |
| `bun run build` | `tsc`, `vite build` and `electron-builder` into `release/<version>/` |
| `bun run test:e2e` | `vite build`, then the 17 Playwright scenarios in `tests/e2e/` |
| `bun run test:e2e:ui` | Same, in the Playwright UI runner |
| `bun run test:e2e:headless` | The suite under Xvfb, isolated from the desktop session (Wayland) |
