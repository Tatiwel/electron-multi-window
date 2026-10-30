import { defineConfig } from 'vite';
import path from 'node:path';
import electron from 'vite-plugin-electron/simple';
import react from '@vitejs/plugin-react';

// The renderer has a single entry, the root index.html; every window loads it
// with its own hash route (see shared/routes.ts).
export default defineConfig({
  // @electron-multi-window/core is a symlink to packages/core, so its imports
  // of react would resolve from the workspace root, while the demo has its own
  // copy (installConfig.hoistingLimits). One React instance for both.
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
      },
      preload: {
        input: path.join(import.meta.dirname, 'electron/preload.ts'),
      },
      renderer: process.env.NODE_ENV === 'test' ? undefined : {},
    }),
  ],
});
