# Contributing to Electron Multi-Window

Thank you for your interest in contributing to this project! Your help is greatly appreciated. Please read the following guidelines to make the contribution process smooth and effective.

## 📚 About the Project

This project demonstrates how to create a modern Electron application with React, TypeScript, and Vite, allowing multiple windows synchronized via IPC. It is designed for users and developers who want to expand the desktop experience beyond a single window. For more details, see the [README](../README.md).

## 🛠️ How to Contribute

1. **Fork the repository** and clone it locally.
2. **Create a new branch** for your feature or bugfix:
   ```pwsh
   git checkout -b feature/your-feature-name
   ```
3. **Install dependencies** (choose one):
   - With Bun:
     ```pwsh
     bun install
     ```
   - With npm:
     ```pwsh
     npm install
     ```
4. **Run the project locally**:
   - With Bun:
     ```pwsh
     bun run dev
     ```
   - With npm:
     ```pwsh
     npm run dev
     ```
5. **Make your changes** and ensure everything works as expected.
6. **Lint and format your code**:
   - The project uses ESLint with TypeScript and React rules. Run:
     ```pwsh
     bun run lint
     # or
     npm run lint
     ```
7. **Commit your changes** with clear and descriptive messages.
8. **Push your branch** and open a Pull Request (PR) on GitHub.

## 🧑‍💻 Code Style

- Follow the existing code style and structure.
- Use TypeScript for all source files.
- Use React functional components and hooks.
- Keep code modular and well-documented.
- Run the linter before submitting your PR.

## 🧪 Testing

- Manual testing is recommended for UI and window synchronization features.
- If you add new features, please update or add relevant tests if possible.

## 📁 Project Structure

- `electron/`: Electron main and preload scripts
- `src/`: React app (pages, assets, styles)
- `public/`: Static assets
- `demo/`: Demo GIFs
- See [README](../README.md#project-structure) for more details.

## 💡 Suggestions & Issues

- For bugs, open an [issue](https://github.com/Tatiwel/electron-multi-window/issues) with clear steps to reproduce.
- For feature requests, describe your idea and its use case.

## 🤝 Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to foster a welcoming and respectful community.

## 📬 Contact

For questions, suggestions, or private discussions, contact the maintainer:

- Daniel (Tatiwel) — [danieldandez@gmail.com](mailto:danieldandez@gmail.com)

---

Thank you for helping make this project better!
