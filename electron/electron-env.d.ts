/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  electronAPI: {
    openNewWindow: (payload: { id: string; value: string }) => void
    updateValue: (payload: { id: string; value: string }) => void
    closeWindow: (payload: { id: string }) => void
    onInitValue: (
      callback: (payload: { id: string; value: string }) => void
    ) => () => void
    onUpdateValue: (
      callback: (payload: { id: string; value: string }) => void
    ) => () => void
    onEditWindowClosed: (
      callback: (payload: { id: string }) => void
    ) => () => void
  }
}
