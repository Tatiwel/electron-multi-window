import { defineConfig } from 'vite';
import path from 'node:path';
import electron from 'vite-plugin-electron/simple';
import react from '@vitejs/plugin-react';

export default defineConfig({
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
  build: {
    rolldownOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'html/index.html'),
        newWindow: path.resolve(import.meta.dirname, 'html/newWindow.html'),
      },
    },
  },
});
