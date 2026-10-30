# Electron Multiple Synchronized Windows

<div align="center">
  <img src="apps/demo/public/electron-vite.svg" width="80" alt="Electron Logo" />
  <img src="apps/demo/public/vite.svg" width="60" alt="Vite Logo" />
  <img src="apps/demo/public/react.svg" width="60" alt="React Logo" />
</div>

<p align="center">
  <b>Several Electron windows kept in sync in real time, with the main process as the single source of truth</b><br/>
  <a href="https://github.com/Tatiwel/electron-multi-window">GitHub Repository</a>
</p>

---

## What this repository is

A desktop app where a main window lists messages and every message can be edited in its own child window. Every keystroke shows up in the other windows at once. The state lives in a store in the main process; windows dispatch actions over a typed, validated IPC bridge and render the whole state they get back. Each window loads the same `index.html` and picks its screen from a hash route (`#/`, `#/message/<id>`).

The reusable part of that design (store, window manager, IPC bridge, routes and React hooks) is being split out as a library, [`@electron-multi-window/core`](packages/core), and the app is its first consumer, [`apps/demo`](apps/demo).

## Two lines of the same app

| Branch | Stack | Latest tag |
|--------|-------|------------|
| [`master`](https://github.com/Tatiwel/electron-multi-window/tree/master) | React 19 + TypeScript 7 + Vite 8, Bun workspace (this README) | `v2.0.0` |
| [`pure-electron`](https://github.com/Tatiwel/electron-multi-window/tree/pure-electron) | Plain JavaScript, no framework, no bundler | `pure-electron-v2.0.0` |

Both lines implement the same behaviour and run the same Playwright end-to-end suite of 17 scenarios (`apps/demo/tests/e2e/sync.spec.ts` here, `tests/e2e/sync.spec.ts` on `pure-electron`).

## Workspace

This is a [Bun workspace](https://bun.sh/docs/pm/workspaces): one `bun.lock` at the root, tooling shared from the root.

```
electron-multi-window/
├── packages/
│   └── core/                  # @electron-multi-window/core 0.1.0 (private)
│       └── src/
│           ├── shared/        # createRoutes, CHANNELS, guards, ElectronApi types
│           ├── main/          # createStore, createWindowManager, registerIpc
│           ├── preload/       # exposeElectronApi
│           └── renderer/      # createRendererApi, useStore, useHashRoute, useDraftInput
├── apps/
│   └── demo/                  # @electron-multi-window/demo 2.1.0, the app
│       ├── electron/          # main.ts, preload.ts, rules.ts (authorization and effects)
│       ├── shared/            # state, actions, reducer, routes of the demo
│       ├── src/               # React screens, components, styles
│       ├── tests/e2e/         # the 17 Playwright scenarios
│       ├── electron-builder.json5
│       └── vite.config.ts
├── docs/                      # demo GIFs
├── package.json               # workspaces, aggregate scripts, shared tooling
├── bunfig.toml                # hoisted linker
├── tsconfig.base.json         # extended by every package
├── .oxlintrc.json             # oxlint config for packages/ and apps/
└── .github/, .husky/, .commitlintrc.cjs
```

The core is not published yet. The plan is to publish it once its API settles; until then it is `private` and consumed through `workspace:*`.

## Getting started

Prerequisites: [Bun](https://bun.sh/) 1.x and [Node.js](https://nodejs.org/) 20.19+ or 22.12+ (required by Vite 8).

```bash
git clone https://github.com/Tatiwel/electron-multi-window.git
cd electron-multi-window
bun install
bun run dev
```

## Scripts (run from the root)

| Command | What it does |
|---------|--------------|
| `bun run dev` | Builds the core, then starts the demo with hot reload |
| `bun run build` | Builds the core, then type-checks and bundles the demo (`dist/`, `dist-electron/`); no packaging |
| `bun run build:core` | Builds `packages/core` into `packages/core/dist` |
| `bun run package` | Builds, then packages the demo with electron-builder into `apps/demo/release/<version>/` (AppImage, NSIS or DMG for the current OS) |
| `bun run package:dir` | Builds, then packages the demo unpacked only (`apps/demo/release/<version>/linux-unpacked/` on Linux) |
| `bun run lint` | oxlint over the whole workspace, zero warnings allowed (also the pre-commit hook) |
| `bun run lint:ci` | Builds the core, then runs oxlint with the type-aware rules (`oxlint-tsgolint`); what CI runs |
| `bun run test:e2e` | Builds the core and bundles the demo, then runs the Playwright suite |
| `bun run test:e2e:headless` | Same suite under Xvfb, isolated from the desktop session (Wayland) |

A single package can also be targeted with `bun run --filter <name> <script>`, e.g. `bun run --filter @electron-multi-window/demo test:e2e:ui`.

## Contributing

Branch from `development` and open the pull request against it. Commits follow [Conventional Commits](https://www.conventionalcommits.org/) and only `feat:`, `fix:`, `chore:` and `refactor:` are accepted; Husky runs the lint on pre-commit and commitlint on commit-msg (installed by `bun install`). See [CONTRIBUTING.md](.github/CONTRIBUTING.md).

## Demos

<p align="center">
  <img src="docs/sync-ipc-demo.gif" width="600" alt="IPC Synchronization Demo" />
</p>

<p align="center">
  <img src="docs/window-control-demo.gif" width="600" alt="Window Control Demo" />
</p>

## License

ISC. See [LICENSE](LICENSE).

## Author

**Daniel (Tatiwel)** · [@Tatiwel](https://github.com/Tatiwel)
