# electron-window-stream

<div align="center">
  <img src="public/electron-vite.svg" width="80" alt="Electron Logo" />
  <img src="public/vite.svg" width="60" alt="Vite Logo" />
  <img src="public/react.svg" width="60" alt="React Logo" />
</div>

<p align="center">
  <b>A generic, reusable library for managing multi-window Electron applications with IPC communication and state synchronization</b><br/>
  <a href="https://github.com/Tatiwel/electron-multi-window">GitHub Repository</a>
</p>

---

## 📋 Table of Contents

- [About the Library](#-about-the-library)
- [Key Features](#-key-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Demo Application](#-demo-application)
- [Architecture](#-architecture)
- [Technologies Used](#️-technologies-used)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ About the Library

**electron-window-stream** is a TypeScript-first library that abstracts the complexity of managing multiple windows in Electron applications. It provides:

- **Generic Event Bus**: A unified IPC communication layer that replaces multiple specific channels
- **Window Pool Management**: Easy creation and management of child windows with initial data
- **State Synchronization**: Automatic syncing of state across windows using React hooks
- **SPA Router**: Hash-based routing for rendering different content in child windows without multiple HTML files

Perfect for building sophisticated desktop applications with real-time multi-window synchronization.

---

## 🚀 Key Features

### Main Process
- **`createWindowManager`**: Factory function for managing windows with a Map-based registry
- **Event Bus**: Generic IPC channel supporting `{ channel, payload, targetId }` message envelope
- **Window Lifecycle Hooks**: `onWindowCreated` and `onWindowClosed` callbacks
- **Broadcast/Send**: Send messages to all windows or specific targets

### Preload Script
- **Generic API**: `window.electronWindow` with `send`, `on`, `create`, `close` methods
- **No Domain-Specific Names**: Fully decoupled from business logic ("Edit", "Save", etc.)
- **Type-Safe**: Full TypeScript support with generics

### React Hooks
- **`useWindowPool`**: Create and manage child windows with initial data and configuration
- **`useWindowSync<T>`**: Synchronize state across windows subscribing to the same channel
- **`useWindowInit<T>`**: Access window ID, initial data, and route in child windows
- **`useWindowChannel<T>`**: Subscribe to specific channels with automatic cleanup

### Router
- **`WindowRouter`**: SPA-based routing using URL hash (`#/path`)
- **Route Configuration**: Define components for different paths
- **Single HTML Entry**: No need for multiple HTML files

---

## 📦 Installation

```bash
npm install electron-window-stream
# or
yarn add electron-window-stream
# or
bun add electron-window-stream
```

### Peer Dependencies

```json
{
  "peerDependencies": {
    "electron": ">=20.0.0",
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  }
}
```

---

## 🚀 Quick Start

### 1. Main Process Setup

```typescript
// electron/main.ts
import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { createWindowManager } from 'electron-window-stream/main';

const windowManager = createWindowManager({
  preloadPath: path.join(__dirname, 'preload.mjs'),
  devServerUrl: process.env.VITE_DEV_SERVER_URL,
  rendererDist: path.join(process.env.APP_ROOT, 'dist'),
  defaultOptions: { width: 600, height: 400 },
});

// Optional: Listen to window events
windowManager.onWindowCreated((id, win) => {
  console.log(`Window ${id} created`);
});

windowManager.onWindowClosed((id) => {
  console.log(`Window ${id} closed`);
});

// Create main window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(/* your URL */);

  mainWindow.on('closed', () => {
    windowManager.closeAllWindows();
  });
}

app.whenReady().then(createWindow);
```

### 2. Preload Script Setup

```typescript
// electron/preload.ts
import 'electron-window-stream/preload';
```

### 3. Renderer Process (React)

#### Opening Windows with `useWindowPool`

```tsx
// src/components/MainWindow.tsx
import { useWindowPool } from 'electron-window-stream/renderer';

interface EditorData {
  text: string;
  title: string;
}

function MainWindow() {
  const { openWindow, closeWindow } = useWindowPool();

  const handleOpenEditor = () => {
    openWindow<EditorData>(
      'editor-1',                          // Unique window ID
      { text: 'Hello World', title: 'My Doc' },  // Initial data
      { width: 500, height: 400, path: '/editor' } // Window config
    );
  };

  return (
    <button onClick={handleOpenEditor}>
      Open Editor
    </button>
  );
}
```

#### Synchronizing State with `useWindowSync`

```tsx
// In any window
import { useWindowSync } from 'electron-window-stream/renderer';

interface SharedData {
  count: number;
  message: string;
}

function AnyComponent() {
  const [data, setData] = useWindowSync<SharedData>('shared-channel', {
    count: 0,
    message: '',
  });

  // When setData is called, ALL windows listening to 'shared-channel' receive the update
  const increment = () => {
    setData({ ...data!, count: data!.count + 1 });
  };

  return (
    <div>
      <p>Count: {data?.count}</p>
      <button onClick={increment}>Increment Everywhere</button>
    </div>
  );
}
```

#### Accessing Initial Data in Child Windows

```tsx
// src/pages/EditorPage.tsx
import { useWindowInit } from 'electron-window-stream/renderer';

interface EditorData {
  text: string;
  title: string;
}

function EditorPage() {
  const { windowId, data, route, isReady } = useWindowInit<EditorData>();

  if (!isReady) return <div>Loading...</div>;

  return (
    <div>
      <h1>Window: {windowId}</h1>
      <h2>{data?.title}</h2>
      <textarea defaultValue={data?.text} />
    </div>
  );
}
```

#### SPA Routing with `WindowRouter`

```tsx
// src/App.tsx
import { WindowRouter, type RouteConfig, type RouteProps } from 'electron-window-stream/renderer';

// Define route components
const EditorPage = ({ windowId, data }: RouteProps<EditorData>) => (
  <div>Editor for {windowId}</div>
);

const SettingsPage = ({ data }: RouteProps<SettingsData>) => (
  <div>Settings</div>
);

const MainPage = () => <div>Main Content</div>;

// Configure routes
const routes: RouteConfig[] = [
  { path: '/editor', component: EditorPage },
  { path: '/settings', component: SettingsPage },
];

function App() {
  return (
    <WindowRouter
      routes={routes}
      defaultComponent={MainPage}
      fallback={<div>Loading...</div>}
    />
  );
}
```

---

## 📚 API Reference

### Main Process

#### `createWindowManager(options)`

Creates a window manager instance.

```typescript
interface WindowManagerOptions {
  defaultOptions?: WindowOptions;  // Default BrowserWindow options
  preloadPath: string;             // Path to preload script
  devServerUrl?: string;           // Vite dev server URL
  rendererDist: string;            // Path to built renderer files
}

interface WindowManager {
  onWindowCreated: (callback: (id: string, window: BrowserWindow) => void) => () => void;
  onWindowClosed: (callback: (id: string) => void) => () => void;
  getWindow: (id: string) => BrowserWindow | undefined;
  getAllWindows: () => Map<string, BrowserWindow>;
  createWindow: (config: WindowConfig) => Promise<BrowserWindow>;
  closeWindow: (id: string) => void;
  closeAllWindows: () => void;
  broadcast: <T>(channel: string, payload: T, excludeId?: string) => void;
  send: <T>(targetId: string, channel: string, payload: T) => void;
}
```

### Preload API (`window.electronWindow`)

```typescript
interface ElectronWindowAPI {
  send: <T>(channel: string, data: T, targetId?: string) => void;
  on: <T>(channel: string, callback: (payload: T) => void) => () => void;
  create: (config: WindowConfig) => void;
  close: (windowId?: string) => void;
  getWindowId: () => string | null;
  getInitialData: <T>() => T | null;
  getRoute: () => string | null;
}
```

### React Hooks

#### `useWindowPool()`

```typescript
const { openWindow, closeWindow, closeSelf, getOpenWindows } = useWindowPool();

// Open a window
openWindow<T>(
  windowId: string,
  initialData?: T,
  options?: { width?: number; height?: number; x?: number; y?: number; path?: string }
);

// Close a specific window
closeWindow(windowId: string);

// Close the current window
closeSelf();

// Get list of windows opened by this instance
getOpenWindows(): string[];
```

#### `useWindowSync<T>(channel, initialValue?)`

```typescript
const [data, setData] = useWindowSync<MyData>('channel-name', { initial: 'value' });

// setData broadcasts to all windows listening to 'channel-name'
setData({ updated: 'value' });
```

#### `useWindowSyncWithTarget<T>(channel, targetId, initialValue?)`

```typescript
const [data, setData] = useWindowSyncWithTarget<MyData>('channel', 'target-window-id');

// setData sends only to the specified target window
```

#### `useWindowInit<T>()`

```typescript
const { windowId, data, route, isReady } = useWindowInit<MyData>();
```

#### `useWindowChannel<T>(channel, callback)`

```typescript
useWindowChannel<MyData>('my-channel', (data) => {
  console.log('Received:', data);
});
```

#### `useWindowSend()`

```typescript
const { send, broadcast } = useWindowSend();

send<MyData>('target-id', 'channel', { data: 'value' });
broadcast<MyData>('channel', { data: 'value' });
```

### Components

#### `<WindowRouter>`

```typescript
interface RouteConfig {
  path: string;
  component: ComponentType<RouteProps>;
}

interface RouteProps<T = unknown> {
  windowId: string | null;
  data: T | null;
  route: string | null;
}

<WindowRouter
  routes={routes}
  defaultComponent={DefaultPage}
  fallback={<Loading />}
/>
```

#### `navigateTo(path)`

```typescript
navigateTo('/settings');  // Changes window.location.hash to #/settings
```

---

## 🎬 Demo Application

This repository includes a demo application showcasing all features:

### Running the Demo

```bash
# Clone the repository
git clone https://github.com/Tatiwel/electron-multi-window.git
cd electron-multi-window

# Install dependencies
npm install

# Start development mode
npm run dev
```

### Demo Features

<p align="center">
  <img src="demo/sync-ipc-demo.gif" width="600" alt="IPC Synchronization Demo" />
</p>

- Real-time message synchronization between windows
- Edit messages in dedicated child windows
- Multiple simultaneous child windows
- Window state tracking and cleanup

<p align="center">
  <img src="demo/window-control-demo.gif" width="600" alt="Window Control Demo" />
</p>

---

## 🏗️ Architecture

### Event Bus Design

Instead of multiple specific IPC channels, the library uses a single event bus channel that transports generic message envelopes:

```typescript
interface EventBusMessage<T = unknown> {
  channel: string;    // Logical channel name (e.g., 'user-data', 'settings')
  payload: T;         // Generic typed payload
  targetId?: string;  // Optional target window ID
  sourceId?: string;  // Source window ID
}
```

### Communication Flow

```
Main Window (useWindowPool, useWindowSync)
    ↓ (User Action)
window.electronWindow.send(channel, data)
    ↓ (IPC)
Main Process (createWindowManager Event Bus)
    ↓ (Broadcast/Send)
Child Windows (useWindowSync, useWindowChannel)
    ↓ (Bidirectional)
[All subscribed windows receive updates]
```

### Memory Leak Prevention

All hooks properly clean up their listeners using `useEffect` cleanup functions:

```typescript
useEffect(() => {
  const unsubscribe = api.on(channel, callback);
  return () => unsubscribe();  // Cleanup on unmount
}, [channel]);
```

---

## 🛠️ Technologies Used

- **[Electron](https://www.electronjs.org/)** - Cross-platform desktop framework
- **[React](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Vite](https://vitejs.dev/)** - Build tool with library mode support

---

## 🤝 Contributing

Contributions are welcome! Please follow the existing code style and add tests for new features.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**. See the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Daniel (Tatiwel)**
- GitHub: [@Tatiwel](https://github.com/Tatiwel)

---

<div align="center">
  <p>If you find this project helpful, please consider giving it a ⭐️</p>
  <p>Made with ❤️ by <a href="https://github.com/Tatiwel">Tatiwel</a></p>
</div>
