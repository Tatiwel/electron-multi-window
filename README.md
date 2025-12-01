# electron-multi-window

<div align="center">
  <img src="public/electron-vite.svg" width="80" alt="Electron Logo" />
  <img src="public/vite.svg" width="60" alt="Vite Logo" />
  <img src="public/react.svg" width="60" alt="React Logo" />
</div>

<p align="center">
  <b>A library for managing multiple Electron windows with bidirectional IPC communication and state synchronization</b><br/>
  <a href="https://github.com/Tatiwel/electron-multi-window">GitHub Repository</a>
</p>

---

## 📋 Table of Contents

- [About the Library](#-about-the-library)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
  - [Main Process](#main-process-api)
  - [Renderer Process](#renderer-process-api)
  - [React Hooks](#react-hooks)
- [Types](#-types)
- [Examples](#-examples)
- [Demo Application](#-demo-application)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ About the Library

`electron-multi-window` is a lightweight, functional library that simplifies:

- **Window Management**: Create, close, focus, and track multiple windows with a clean API
- **Bidirectional IPC**: Easy-to-use `emit`, `listen`, and `broadcast` functions that abstract Electron's IPC complexity
- **State Synchronization**: Built-in React hooks for synchronizing state across windows
- **Type Safety**: Full TypeScript support with comprehensive type definitions

### Key Features

- 🪟 **Simple Window Creation**: `createWindow({ route: 'editor.html', initialData: { id: '123' } })`
- 📡 **Easy IPC Communication**: `emit('channel', data)` and `listen('channel', callback)`
- 🔄 **State Sync**: `useSyncedState('theme', 'light')` - state that syncs across all windows
- 🎣 **React Hooks**: `useIPCListener`, `useWindowEvents`, `useAllWindows`, and more
- 📦 **Zero Configuration**: Works out of the box with sensible defaults
- 🔒 **Secure by Default**: Uses context isolation and proper preload scripts

---

## 📦 Installation

```bash
npm install electron-multi-window
# or
yarn add electron-multi-window
# or
bun add electron-multi-window
```

### Peer Dependencies

- `electron` >= 20.0.0
- `react` >= 17.0.0 (optional, only for React hooks)

---

## 🚀 Quick Start

### 1. Main Process Setup

```typescript
// main.ts
import { app, BrowserWindow } from 'electron';
import { initMultiWindow, createWindow } from 'electron-multi-window/main';
import path from 'path';

app.whenReady().then(() => {
  // Initialize the library
  initMultiWindow({
    preloadPath: path.join(__dirname, 'preload.js'),
    rendererDist: path.join(__dirname, '../dist'),
    devServerUrl: process.env.VITE_DEV_SERVER_URL, // Optional: for dev mode
  });

  // Create the main window
  createWindow({
    id: 'main',
    route: 'index.html',
    width: 1200,
    height: 800,
  });
});
```

### 2. Preload Script

```typescript
// preload.ts
import 'electron-multi-window/preload';

// That's it! The library automatically exposes the API to the renderer.
// You can add additional preload code below if needed.
```

### 3. Renderer Process (React)

```tsx
// App.tsx
import { 
  createWindow, 
  emit, 
  useIPCListener,
  useSyncedState 
} from 'electron-multi-window/renderer';

function App() {
  // State synchronized across all windows
  const [theme, setTheme] = useSyncedState('app:theme', 'light');

  // Listen for messages from other windows
  useIPCListener('document:updated', (data) => {
    console.log('Document updated:', data);
  });

  const openEditor = async () => {
    await createWindow({
      id: 'editor',
      route: 'editor.html',
      width: 800,
      height: 600,
      initialData: { documentId: '123', title: 'My Document' }
    });
  };

  const notifyOtherWindows = () => {
    emit('user:action', { action: 'clicked', timestamp: Date.now() });
  };

  return (
    <div className={theme}>
      <button onClick={openEditor}>Open Editor</button>
      <button onClick={notifyOtherWindows}>Notify Others</button>
      <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
    </div>
  );
}
```

---

## 📖 API Reference

### Main Process API

Import from `electron-multi-window/main`:

#### `initMultiWindow(options)`

Initialize the library. Must be called before creating windows.

```typescript
initMultiWindow({
  preloadPath: string;           // Path to preload script (required)
  rendererDist: string;          // Path to renderer dist folder (required)
  devServerUrl?: string;         // Dev server URL for development
  defaultWindowOptions?: Partial<WindowConfig>;  // Default options for all windows
});
```

#### `createWindow(config)`

Creates a new window with the specified configuration.

```typescript
const windowInfo = await createWindow({
  id?: string;           // Unique ID (auto-generated if not provided)
  title?: string;        // Window title
  width?: number;        // Width in pixels (default: 800)
  height?: number;       // Height in pixels (default: 600)
  x?: number;            // X position
  y?: number;            // Y position
  url?: string;          // URL to load (for remote content)
  filePath?: string;     // Local file path
  route?: string;        // Route/path appended to base URL
  show?: boolean;        // Show immediately (default: true)
  parentId?: string;     // Parent window ID for child windows
  modal?: boolean;       // Modal window
  initialData?: unknown; // Data passed to the window
  browserWindowOptions?: Partial<BrowserWindowConstructorOptions>;
});
```

#### `closeWindow(windowId)`

Closes a window by ID.

```typescript
closeWindow('editor-window');
```

#### `getAllWindows()`

Returns information about all active windows.

```typescript
const windows = getAllWindows();
// Returns: WindowInfo[]
```

#### `getWindow(windowId)`

Gets information about a specific window.

```typescript
const info = getWindow('main');
// Returns: WindowInfo | undefined
```

#### `focusWindow(windowId)`

Focuses a window by ID.

```typescript
focusWindow('editor-window');
```

#### `closeAllWindows()`

Closes all windows managed by the library.

#### `onWindowEvent(callback)`

Subscribe to window events in the main process.

```typescript
const unsubscribe = onWindowEvent((event) => {
  console.log(`Window ${event.windowId} was ${event.type}`);
});
```

#### `sendToWindow(windowId, channel, data)`

Send a message to a specific window from main process.

```typescript
sendToWindow('editor', 'config:update', { theme: 'dark' });
```

#### `broadcast(channel, data)`

Broadcast a message to all windows from main process.

```typescript
broadcast('app:notification', { message: 'Update available' });
```

---

### Renderer Process API

Import from `electron-multi-window/renderer`:

#### `createWindow(config)`

Create a new window from renderer process.

```typescript
const windowInfo = await createWindow({
  route: 'editor.html',
  initialData: { documentId: '123' }
});
```

#### `closeWindow(windowId)`

Close a window by ID.

```typescript
closeWindow('editor-window');
```

#### `closeCurrentWindow()`

Close the current window.

```typescript
await closeCurrentWindow();
```

#### `getAllWindows()`

Get all active windows.

```typescript
const windows = await getAllWindows();
```

#### `getWindow(windowId)`

Get a specific window's info.

```typescript
const info = await getWindow('main');
```

#### `focusWindow(windowId)`

Focus a window.

```typescript
focusWindow('main');
```

#### `getCurrentWindowId()`

Get the current window's ID.

```typescript
const myId = await getCurrentWindowId();
```

#### `getInitialData<T>()`

Get the data passed when the window was created.

```typescript
interface EditorData {
  documentId: string;
  title: string;
}

const data = await getInitialData<EditorData>();
```

#### `emit(channel, data, targetWindowId?)`

Send a message to other windows.

```typescript
// Send to a specific window
emit('document:updated', { id: '123', content: '...' }, 'main-window');

// Broadcast to all other windows
emit('user:activity', { action: 'typing' });
```

#### `broadcast(channel, data)`

Send a message to ALL windows including the current one.

```typescript
broadcast('theme:changed', { theme: 'dark' });
```

#### `listen(channel, callback)`

Listen for messages on a channel.

```typescript
const unsubscribe = listen('document:updated', (data, message) => {
  console.log(`Received from ${message.sourceWindowId}:`, data);
});

// Later: unsubscribe();
```

#### `onWindowEvent(callback)`

Listen for window lifecycle events.

```typescript
const unsubscribe = onWindowEvent((event) => {
  if (event.type === 'closed') {
    console.log(`Window ${event.windowId} was closed`);
  }
});
```

---

### React Hooks

Import from `electron-multi-window/renderer`:

#### `useCurrentWindowId()`

Get the current window's ID.

```tsx
const windowId = useCurrentWindowId();
```

#### `useInitialData<T>()`

Get initial data with loading state.

```tsx
const { data, isLoading, error } = useInitialData<EditorData>();

if (isLoading) return <Loading />;
if (error) return <Error message={error.message} />;

return <Editor documentId={data?.documentId} />;
```

#### `useIPCListener(channel, callback)`

Listen for messages with automatic cleanup.

```tsx
useIPCListener('document:updated', (data, message) => {
  console.log('Update from', message.sourceWindowId);
});
```

#### `useWindowEvents(callback, eventTypes?)`

Listen for window events.

```tsx
useWindowEvents((event) => {
  console.log(`Window ${event.windowId}: ${event.type}`);
}, ['created', 'closed']); // Optional filter
```

#### `useAllWindows()`

Get all windows with auto-refresh.

```tsx
const { windows, isLoading, refresh } = useAllWindows();

return (
  <ul>
    {windows.map(win => (
      <li key={win.id}>{win.title}</li>
    ))}
  </ul>
);
```

#### `useCreateWindow()`

Create windows with loading state.

```tsx
const { createWindow, isCreating, lastCreated, error } = useCreateWindow();

const handleOpen = async () => {
  await createWindow({ route: 'editor.html' });
};
```

#### `useEmit(channel)`

Get a stable emit function for a channel.

```tsx
const emitUpdate = useEmit('document:updated');

const handleChange = (content) => {
  emitUpdate({ id: documentId, content });
};
```

#### `useBroadcast(channel)`

Get a stable broadcast function for a channel.

```tsx
const broadcastTheme = useBroadcast('theme:changed');

const toggleTheme = () => {
  broadcastTheme({ theme: newTheme });
};
```

#### `useSyncedState(channel, initialValue)`

State that automatically syncs across all windows.

```tsx
// This state will be synchronized across all windows
const [sharedCounter, setSharedCounter] = useSyncedState('counter', 0);

return (
  <button onClick={() => setSharedCounter(c => c + 1)}>
    Count: {sharedCounter}
  </button>
);
```

---

## 📝 Types

```typescript
interface WindowConfig {
  id?: string;
  title?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  url?: string;
  filePath?: string;
  route?: string;
  show?: boolean;
  parentId?: string;
  modal?: boolean;
  initialData?: unknown;
  browserWindowOptions?: Partial<BrowserWindowConstructorOptions>;
}

interface WindowInfo {
  id: string;
  title: string;
  isVisible: boolean;
  isFocused: boolean;
  isDestroyed: boolean;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface IPCMessage<T = unknown> {
  channel: string;
  data: T;
  sourceWindowId?: string;
  targetWindowId?: string;
  timestamp: number;
}

type WindowEventType = 
  | 'created' | 'closed' | 'focused' | 'blurred' 
  | 'moved' | 'resized' | 'minimized' | 'maximized' | 'restored';

interface WindowEvent {
  type: WindowEventType;
  windowId: string;
  timestamp: number;
  data?: unknown;
}
```

---

## 📚 Examples

### Multi-Window Chat Application

```tsx
// MainWindow.tsx
import { createWindow, useAllWindows } from 'electron-multi-window/renderer';

function MainWindow() {
  const { windows } = useAllWindows();
  
  const openChat = async (userId: string) => {
    await createWindow({
      id: `chat-${userId}`,
      route: 'chat.html',
      initialData: { userId },
      width: 400,
      height: 500,
    });
  };

  return (
    <div>
      <h2>Active Chats: {windows.length}</h2>
      <button onClick={() => openChat('user-123')}>New Chat</button>
    </div>
  );
}

// ChatWindow.tsx
import { useInitialData, useIPCListener, emit } from 'electron-multi-window/renderer';

function ChatWindow() {
  const { data } = useInitialData<{ userId: string }>();
  const [messages, setMessages] = useState([]);

  useIPCListener('chat:message', (msg) => {
    if (msg.userId === data?.userId) {
      setMessages(prev => [...prev, msg]);
    }
  });

  const sendMessage = (text: string) => {
    emit('chat:message', { userId: data?.userId, text });
  };

  return <ChatUI messages={messages} onSend={sendMessage} />;
}
```

### Synchronized Settings Across Windows

```tsx
import { useSyncedState } from 'electron-multi-window/renderer';

function SettingsPanel() {
  const [settings, setSettings] = useSyncedState('app:settings', {
    theme: 'light',
    fontSize: 14,
    showSidebar: true,
  });

  return (
    <div className={settings.theme}>
      <select 
        value={settings.theme}
        onChange={(e) => setSettings(s => ({ ...s, theme: e.target.value }))}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      
      <input
        type="range"
        value={settings.fontSize}
        onChange={(e) => setSettings(s => ({ ...s, fontSize: +e.target.value }))}
      />
    </div>
  );
}
```

---

## 🎬 Demo Application

This repository includes a complete demo application showcasing the library's capabilities.

### Running the Demo

```bash
# Clone the repository
git clone https://github.com/Tatiwel/electron-multi-window.git
cd electron-multi-window

# Install dependencies
npm install

# Run the demo
npm run dev
```

### Demo Features

<p align="center">
  <img src="demo/sync-ipc-demo.gif" width="600" alt="IPC Synchronization Demo" />
</p>

- **Real-time synchronization** between main and child windows
- **Message creation and editing** with live updates
- **Multi-window state management**
- **UUID-based window tracking**

<p align="center">
  <img src="demo/window-control-demo.gif" width="600" alt="Window Control Demo" />
</p>

---

## 📂 Project Structure

```
electron-multi-window/
├── src/
│   ├── lib/                    # 📦 Library source code
│   │   ├── main/              # Main process API
│   │   │   ├── windowManager.ts
│   │   │   └── index.ts
│   │   ├── renderer/          # Renderer process API
│   │   │   ├── multiWindow.ts
│   │   │   ├── hooks.ts
│   │   │   └── index.ts
│   │   ├── preload/           # Preload script
│   │   │   ├── preload.ts
│   │   │   └── index.ts
│   │   ├── shared/            # Shared types
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── index.ts           # Main entry point
│   │
│   ├── pages/                  # Demo app pages
│   ├── components/             # Demo app components
│   ├── hooks/                  # Demo app hooks
│   └── services/               # Demo app services
│
├── electron/                   # Demo app Electron setup
├── html/                       # Demo app HTML files
├── public/                     # Static assets
├── demo/                       # Demo GIFs
│
├── package.json                # NPM package configuration
├── tsconfig.lib.json          # TypeScript config for library
├── tsconfig.json              # TypeScript config for demo
└── vite.config.ts             # Vite configuration
```

---

## 🛠️ Development

### Building the Library

```bash
npm run build:lib
```

This compiles the library to `dist/lib/` with TypeScript declarations.

### Building Everything (Library + Demo)

```bash
npm run build
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start demo app in development mode |
| `npm run build` | Build library and demo app |
| `npm run build:lib` | Build library only |
| `npm run build:example` | Build demo app only |
| `npm run lint` | Run ESLint |

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit using conventional commits: `feat: add new feature`
4. Push and create a Pull Request

For detailed guidelines, see [CONTRIBUTING.md](.github/CONTRIBUTING.md)

---

## 📄 License

This project is licensed under the **ISC License**. See the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Daniel (Tatiwel)**
- GitHub: [@Tatiwel](https://github.com/Tatiwel)
- Project: [electron-multi-window](https://github.com/Tatiwel/electron-multi-window)

---

<div align="center">
  <p>If you find this project helpful, please consider giving it a ⭐️</p>
  <p>Made with ❤️ by <a href="https://github.com/Tatiwel">Tatiwel</a></p>
</div>
