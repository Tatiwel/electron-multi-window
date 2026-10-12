# Electron Multiple Synchronized Windows

<div align="center">
  <img src="public/electron-vite.svg" width="80" alt="Electron Logo" />
  <img src="public/vite.svg" width="60" alt="Vite Logo" />
  <img src="public/react.svg" width="60" alt="React Logo" />
</div>

<p align="center">
  <b>Professional desktop application with multiple real-time synchronized windows</b><br/>
  <a href="https://github.com/Tatiwel/electron-multi-window">GitHub Repository</a>
</p>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Technologies Used](#️-technologies-used)
- [Prerequisites](#-prerequisites)
- [Installation & Usage](#-installation--usage)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [Development Workflow](#-development-workflow)
- [Contributing](#-contributing)
- [Demos](#-demos)
- [License](#-license)
- [Author](#-author)

---

## ✨ About the Project

This is a modern, production-ready Electron application that demonstrates advanced multi-window management with real-time synchronization. Built with React, TypeScript, and Vite, this project showcases best practices in desktop application development, including:

- **Clean Architecture**: Separation of concerns with services, hooks, and components
- **Type Safety**: Full TypeScript implementation across main and renderer processes
- **Modern Tooling**: Vite for lightning-fast builds and HMR (Hot Module Replacement)
- **Professional Workflows**: Git hooks, linting, and commit conventions

Perfect for developers looking to build sophisticated desktop applications that go beyond single-window limitations.

---

## 🚀 Key Features

### Window Management
- **Multi-Window Architecture**: Open and manage multiple synchronized child windows from the main window
- **Real-Time Synchronization**: Instant bidirectional communication between all windows via IPC (Inter-Process Communication)
- **Window State Tracking**: Robust index management ensures data integrity across window lifecycle events
- **Edit Mode**: Edit messages in dedicated child windows with live synchronization back to the main window

### User Experience
- **Intuitive Interface**: Clean, responsive UI built with React
- **Message Management**: Create, edit, and delete messages with UUID-based identification
- **Window Controls**: Open, focus, and close child windows programmatically
- **Editing State Indication**: Visual feedback when messages are being edited in child windows

### Technical Excellence
- **Context Isolation**: Secure IPC communication with proper preload scripts
- **Custom Hooks**: Reusable React hooks for window and message management
- **Service Layer**: Clean abstraction over Electron APIs
- **Handler Pattern**: Organized IPC handlers for maintainable code

---

## 🏗️ Architecture

The application follows a layered architecture pattern:

### Main Process (`electron/`)
- **`main.ts`**: Application entry point, window lifecycle management
- **`handlers/windowHandlers.ts`**: IPC communication handlers for window operations
- **`preload.ts`**: Secure bridge between main and renderer processes

### Renderer Process (`src/`)

#### **Services Layer** (`src/services/`)
- **`windowService.ts`**: Abstraction layer for window-related IPC operations
- Provides type-safe interfaces for all window operations
- Handles validation and error checking

#### **Hooks Layer** (`src/hooks/`)
- **`useWindowManagement.ts`**: React hook for managing window state and operations
- **`useMessageManagement.ts`**: React hook for message CRUD operations
- Encapsulates business logic and state management

#### **Components Layer** (`src/components/`)
- **`MessageItem/`**: Reusable message display component
- Modular, testable UI components

#### **Pages Layer** (`src/pages/`)
- **`App.tsx`**: Main window application logic
- **`newWindow.tsx`**: Child window application logic

### Communication Flow

```
Main Window (App.tsx)
    ↓ (User Action)
useWindowManagement Hook
    ↓ (Business Logic)
windowService
    ↓ (IPC Call)
electronAPI (preload.ts)
    ↓ (IPC Channel)
windowHandlers.ts (main process)
    ↓ (Window Management)
Child Window (newWindow.tsx)
    ↓ (Sync Back)
[Bidirectional Communication Loop]
```

---

## 🛠️ Technologies Used

### Core Framework
- **[Electron](https://www.electronjs.org/)** ^44.7.0 - Cross-platform desktop application framework
- **[React](https://react.dev/)** ^19.3.0 - UI library for building component-based interfaces
- **[TypeScript](https://www.typescriptlang.org/)** ^6.0.3 - Type-safe JavaScript superset

### Build Tools
- **[Vite](https://vitejs.dev/)** ^8.3.4 - Next-generation frontend build tool
- **[vite-plugin-electron](https://github.com/electron-vite/vite-plugin-electron)** ^1.1.2 - Electron integration for Vite
- **[electron-builder](https://www.electron.build/)** ^26.15.3 - Build and distribution tool

### Development Tools
- **[ESLint](https://eslint.org/)** ^10.12.0 - Code linting and quality enforcement
- **[Husky](https://typicode.github.io/husky/)** ^9.1.7 - Git hooks for pre-commit validation
- **[Commitlint](https://commitlint.js.org/)** ^21.2.3 - Enforce conventional commit messages
- **[Bun](https://bun.sh/)** - Package manager and script runner for the project

### Utilities
- **[UUID](https://github.com/uuidjs/uuid)** ^14.0.3 - Unique identifier generation

---

## 📦 Prerequisites

- **[Bun](https://bun.sh/)** v1.x (the project's package manager)
- **[Node.js](https://nodejs.org/)** v20.19+ or v22.12+ (required by Vite 8)

---

## 📝 Installation & Usage

```bash
# Clone the repository
git clone https://github.com/Tatiwel/electron-multi-window.git

# Navigate to the project directory
cd electron-multi-window

# Install dependencies
bun install

# Start development mode with hot reload
bun run dev
```

### Building for Production

```bash
# Build the application for distribution
bun run build
```

This will:
1. Compile TypeScript
2. Build the Vite project
3. Package the Electron application with electron-builder

Built applications will be available in the `dist/` directory.

---

## 📂 Project Structure

```
electron-multi-window/
├── .github/                    # GitHub configuration
│   ├── ISSUE_TEMPLATE/        # Issue templates
│   ├── CODE_OF_CONDUCT.md     # Code of conduct
│   ├── CONTRIBUTING.md        # Contribution guidelines
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── SECURITY.md            # Security policy
├── .husky/                     # Git hooks configuration
├── demo/                       # Demo GIFs and screenshots
├── electron/                   # Electron main process
│   ├── handlers/              # IPC handlers
│   │   └── windowHandlers.ts # Window management IPC logic
│   ├── main.ts                # Main process entry point
│   ├── preload.ts             # Preload script for secure IPC
│   └── electron-env.d.ts      # TypeScript definitions
├── html/                       # HTML entry points
│   ├── index.html             # Main window HTML
│   └── newWindow.html         # Child window HTML
├── public/                     # Static assets
│   ├── electron-vite.svg
│   ├── react.svg
│   └── vite.svg
├── src/                        # Renderer process (React app)
│   ├── assets/                # Styles and images
│   ├── components/            # Reusable React components
│   │   └── MessageItem/       # Message item component
│   ├── hooks/                 # Custom React hooks
│   │   ├── useMessageManagement.ts
│   │   ├── useWindowManagement.ts
│   │   └── index.ts
│   ├── pages/                 # Page components
│   │   ├── App.tsx            # Main window page
│   │   └── newWindow.tsx      # Child window page
│   ├── services/              # Service layer
│   │   ├── windowService.ts   # Window operations service
│   │   └── index.ts
│   ├── main.tsx               # React entry point (main window)
│   └── vite-env.d.ts          # Vite TypeScript definitions
├── .commitlintrc.cjs           # Commitlint configuration
├── eslint.config.js            # ESLint configuration (flat config)
├── .gitignore                  # Git ignore rules
├── electron-builder.json5      # Electron builder config
├── package.json                # Project metadata and scripts
├── tsconfig.json               # TypeScript configuration
├── tsconfig.node.json          # TypeScript config for Node
├── vite.config.ts              # Vite configuration
└── README.md                   # This file
```

---

## 🎯 Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start the application in development mode with hot reload |
| `bun run build` | Build the application for production |
| `bun run lint` | Run ESLint to check code quality |
| `bun run preview` | Preview the built application |
| `bun run test:e2e` | Build the app and run the Playwright end-to-end tests |
| `bun run test:e2e:ui` | Build the app and open the Playwright UI runner |

---

## 💻 Development Workflow

### Code Quality & Standards

This project enforces code quality through automated tools:

#### **Linting**
```bash
bun run lint
```
- ESLint checks TypeScript and React code
- Configured with React hooks rules and TypeScript-specific rules
- Maximum 0 warnings policy

#### **Commit Conventions**
Commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring

**Example**: `feat: add message editing in child windows`

Commitlint automatically validates commit messages via the Husky `commit-msg` hook.

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Branching Strategy

- **`master`**: Production-ready code
  - For urgent fixes, create branches with `fix/` prefix
- **`development`**: Active development branch
  - For new features, use `feature/` prefix
  - For refactoring, use `refactor/` prefix
  - For maintenance, use `chore/` prefix

### Contribution Steps

1. Fork the repository
2. Create a feature branch from `development`:
   ```bash
   git checkout development
   git checkout -b feature/your-feature-name
   ```
3. Make your changes following the code style
4. Run linting: `bun run lint`
5. Commit with conventional commit messages
6. Push to your fork and create a Pull Request to `development`

For detailed guidelines, see [CONTRIBUTING.md](.github/CONTRIBUTING.md)

### Setting Up Git Hooks

Git hooks are installed by the `prepare` script (`husky`), which runs automatically when you run:
```bash
bun install
```

This sets up:
- **Pre-commit**: Runs linting checks
- **Commit-msg**: Validates commit message format

---

## 🎬 Demos

### Real-Time Window Synchronization

<p align="center">
  <img src="demo/sync-ipc-demo.gif" width="600" alt="IPC Synchronization Demo" />
</p>

**What's happening here:**
- Messages created in the main window are instantly available
- Opening a child window to edit a message shows real-time updates
- Changes in the child window sync back to the main window immediately
- Multiple child windows can be opened simultaneously, all staying in sync

### Robust Window Management

<p align="center">
  <img src="demo/window-control-demo.gif" width="600" alt="Window Control Demo" />
</p>

**Technical Highlights:**
- Each window has a unique UUID identifier
- Window state is tracked in both main and renderer processes
- Proper cleanup when windows are closed
- Prevents race conditions and data corruption
- Safe handling of window lifecycle events

---

## 📄 License

This project is licensed under the **ISC License**. See the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Daniel (Tatiwel)**
- GitHub: [@Tatiwel](https://github.com/Tatiwel)
- Project: [electron-multi-window](https://github.com/Tatiwel/electron-multi-window)

---

## 🔗 Additional Resources

### Pure Electron Version

Interested in a framework-free implementation? Check out the pure Electron branch:

👉 **[pure-electron branch](https://github.com/Tatiwel/electron-multi-window/tree/pure-electron)**

The `pure-electron` branch is **version 1** of this project. It is frozen at the [`pure-electron-v1.0.0`](https://github.com/Tatiwel/electron-multi-window/tree/pure-electron-v1.0.0) tag and will be modernized after the React version.

This branch demonstrates the same synchronization logic using:
- Pure JavaScript (no TypeScript)
- No React or frontend frameworks
- Minimal dependencies
- Core Electron APIs only

Perfect for those who prefer a lightweight, framework-free approach or want to understand the underlying IPC mechanics without abstractions.

---

<div align="center">
  <p>If you find this project helpful, please consider giving it a ⭐️</p>
  <p>Made with ❤️ by <a href="https://github.com/Tatiwel">Tatiwel</a></p>
</div>
