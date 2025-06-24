# Electron Multiple Synchronized Windows

<div align="center">
  <img src="public/electron-vite.svg" width="80" alt="Electron Logo" />
  <img src="public/vite.svg" width="60" alt="Vite Logo" />
  <img src="public/react.svg" width="60" alt="React Logo" />
</div>

<p align="center">
  <b>Desktop application with multiple real-time synchronized windows</b><br/>
  <a href="https://github.com/Tatiwel/electron-multi-window">GitHub Repository</a>
</p>

---

## ✨ About the Project

This project demonstrates how to create a modern Electron application with React, TypeScript, and Vite, allowing multiple windows synchronized via IPC. Perfect for those who want to expand the desktop experience beyond a single window!

---

## 🤝 Contributing

We follow a structured workflow to keep development organized.

- For urgent fixes, branch from `master` using the `fix/` prefix.
- For new features, chores, or refactors, branch from `development` using `feature/`, `chore/`, or `refactor/`.
- Use semantic commit messages such as `fix: ...`, `feat: ...`, `chore: ...`, and `refactor: ...`.
- Commit messages are checked automatically via **commitlint** when you commit.
- Running `npm install` or `bun install` sets up these hooks automatically.

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for full guidelines.

---

## 🚀 Features

- **Main Window:** Enter data and open new windows.
- **Secondary Windows:** Display and synchronize data in real time.
- **Instant Synchronization:** Efficient communication between all windows.
- **Modern Interface:** Responsive and intuitive UI.

---

## 🛠️ Technologies Used

- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Bun](https://bun.sh/) (alternative package manager/runtime)

---

## 📦 Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended) **or** [Bun](https://bun.sh/) (v1+)

---

## 📝 How to Run

### Using Bun

```pwsh
# Clone the repository
git clone https://github.com/Tatiwel/electron-multi-window.git

# Enter the project folder
cd electron-multi-window

# Install dependencies
bun install

# Run in development mode
bun run dev
```

### Using npm

```pwsh
# Clone the repository
git clone https://github.com/Tatiwel/electron-multi-window.git

# Enter the project folder
cd electron-multi-window

# Install dependencies
npm install

# Run in development mode
npm run dev
```

---

## 📂 Project Structure

```
electron-multi-window/
├── electron/           # Electron main process code (main/preload)
├── src/
│   ├── pages/          # React components (App, newWindow)
│   └── assets/         # Styles and icons
├── public/             # Public assets
├── demo/               # GIFs and demos
├── dist-electron/      # Electron build
├── index.html          # Main HTML
├── newWindow.html      # Secondary window HTML
├── package.json        # Configurations and scripts
└── ...
```

---

## 🎬 Demos

<p align="center">
  <img src="demo/sync-ipc-demo.gif" width="500" alt="IPC Sync Demo" />
</p>

**Synchronized Windows:**
This project consists of creating multiple synchronized windows using Electron, React, TypeScript, and Vite. Each window can interact and share data in real time, providing a seamless multi-window desktop experience. The application is designed to allow users to open, manage, and synchronize several windows simultaneously, removing the limitation of working with only a single window.

<p align="center">
  <img src="demo/window-control-demo.gif" width="500" alt="Window Control Demo" />
</p>

**Window Index Management:**
A robust window index management system is implemented to ensure that each window is correctly referenced. This prevents issues such as actions being executed on non-existent windows or overwriting indices of closed windows. With this approach, any update or action is always directed to the correct window, maintaining data integrity and a smooth user experience.

---

## 👤 Author

Developed by [Daniel (Tatiwel)](https://github.com/Tatiwel)

---

## 📄 License

This project is licensed under the ISC license. See the [package.json](package.json) file for more details.

---

## 🔗 Pure Electron Version

If you are interested in the same synchronized multi-window logic implemented using pure Electron (JavaScript only, no frameworks), check out the dedicated branch:

👉 [pure-electron branch on GitHub](https://github.com/Tatiwel/electron-multi-window/tree/pure-electron)

This branch demonstrates the core synchronization logic without React, TypeScript, or Vite, for those who prefer a minimal and framework-free approach.

---
