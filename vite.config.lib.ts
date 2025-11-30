import { defineConfig } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

/**
 * Vite configuration for building electron-window-stream as a library
 * 
 * Usage:
 *   npm run build:lib
 * 
 * Output:
 *   dist-lib/
 *     - index.js (ESM)
 *     - index.cjs (CommonJS)
 *     - main/
 *     - preload/
 *     - renderer/
 *     - types/
 *     - *.d.ts (TypeScript declarations)
 */
export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['lib/**/*.ts', 'lib/**/*.tsx'],
      outDir: 'dist-lib',
      // Do not bundle all types into a single file; preserve the folder structure
      // for proper module resolution with the exports field in package.json
      rollupTypes: false,
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, 'lib/index.ts'),
        'main/index': path.resolve(__dirname, 'lib/main/index.ts'),
        'preload/preload': path.resolve(__dirname, 'lib/preload/preload.ts'),
        'renderer/index': path.resolve(__dirname, 'lib/renderer/index.ts'),
      },
      name: 'ElectronWindowStream',
      formats: ['es', 'cjs'],
    },
    outDir: 'dist-lib',
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'electron',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          electron: 'electron',
        },
        preserveModules: false,
      },
    },
    sourcemap: true,
    minify: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'lib'),
    },
  },
});
