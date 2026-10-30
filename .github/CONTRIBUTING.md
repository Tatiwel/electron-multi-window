# Contributing to Electron Multi-Window

Thank you for your interest in contributing to this project! Your help is greatly appreciated. Please read the following guidelines to make the contribution process smooth and effective.

## 📚 About the Project

This project demonstrates how to create a modern Electron application with React, TypeScript, and Vite, allowing multiple windows synchronized via IPC. It is designed for users and developers who want to expand the desktop experience beyond a single window. For more details, see the [README](../README.md).

## 🛠️ How to Contribute

1. **Fork the repository** and clone it locally.
2. **Choose the base branch and create your working branch**
   - For urgent fixes or changes already in production, start from `master` and use the prefix `fix/`.
   - For new features, chores, or refactors, start from `development` and use `feature/`, `chore/`, or `refactor/`.
   Example:
   ```bash
   git checkout master
   git checkout -b fix/typo-correction
   ```
   or
   ```bash
   git checkout development
   git checkout -b feature/my-new-idea
   # or a maintenance task
   git checkout -b chore/update-dependencies
   ```
3. **Install dependencies** (choose one):
   - With Bun:
     ```pwsh
     bun install
     ```
   - The repository is a Bun workspace (`workspace:*` dependencies), so npm is not supported.
4. **Run the project locally**:
   - With Bun:
     ```pwsh
     bun run dev
     ```
5. **Make your changes** and ensure everything works as expected.
6. **Lint and format your code**:
   - The project uses oxlint with TypeScript and React rules (`.oxlintrc.json`). Run:
     ```pwsh
     bun run lint
     ```
   - CI runs `bun run lint:ci`, which adds the type-aware rules; run it before opening a pull request.
7. **Commit your changes** using [semantic commit messages](https://www.conventionalcommits.org/en/v1.0.0/):
   ```
   fix: brief description of the correction
   feat: brief description of the feature
   chore: brief description of maintenance work
   refactor: brief description of the refactor
   ```
   Add a longer description in the commit body when necessary.
   Commit messages are validated automatically with `commitlint`.
   After installing dependencies (`bun install`), Git hooks are set up via Husky so commits that don't follow the format are rejected.
   If a commit fails, the console will mention the missing prefix and suggest a valid example, such as `fix: correct typo`.
8. **Push your branch** and open a Pull Request (PR) on GitHub.

## 🧑‍💻 Code Style

- Follow the existing code style and structure.
- Use TypeScript for all source files.
- Use React functional components and hooks.
- Keep code modular and well-documented.
- Run the linter before submitting your PR.

## 🧪 Testing

- Run the Playwright end-to-end suite from the root: `bun run test:e2e` (or `bun run test:e2e:headless` under Xvfb).
- If you add new features, please update or add relevant tests in `apps/demo/tests/e2e/`.

## 📁 Project Structure

- `packages/core/`: `@electron-multi-window/core`, the reusable store, window manager, IPC bridge and React hooks
- `apps/demo/`: the app (Electron main and preload, React screens, e2e tests, packaging)
- `docs/`: Demo GIFs
- See the [README](../README.md#workspace) for more details.

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
