# Security Policy

## Supported Versions

This project is under active development and only the latest version (main branch) is officially supported with security updates. Older versions and branches may not receive security patches.

| Version/Branch | Supported |
| -------------- | --------- |
| main           | ✅        |
| pure-electron  | ✅        |
| others         | ❌        |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

- **Do not open public issues for security vulnerabilities.**
- Instead, email the maintainer directly at [danieldandez@gmail.com](mailto:danieldandez@gmail.com) with details of the issue.
- Please include as much information as possible to help reproduce and address the vulnerability (steps, code, environment, etc).
- You will receive an initial response within 7 days. Further updates will be provided as the issue is investigated and resolved.
- If the vulnerability is confirmed, a fix will be prepared and released as soon as possible. You will be credited unless you request otherwise.

## Security Best Practices

- This project uses Electron, React, TypeScript, and Vite. All dependencies are kept up to date to minimize known vulnerabilities.
- The Electron app uses `contextIsolation: true` and `nodeIntegration: false` for improved renderer security.
- Only the IPC channels defined in the preload script are exposed to the renderer process.
- No remote code execution or auto-update features are present by default.
- Always review and test third-party dependencies before use.

## Responsible Disclosure

We ask that you act in good faith and give us a reasonable time to address any security issues before public disclosure.

Thank you for helping keep this project and its users safe!
