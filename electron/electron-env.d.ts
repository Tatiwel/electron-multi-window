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
type RendererEditPayload = { id: string; value: string };
type RendererClosePayload = { id: string };
type RendererEditingStatePayload = {
  id: string;
  value: string;
  isEditing: boolean;
};

interface Window {
  electronAPI: {
    openNewWindow: (payload: RendererEditPayload) => void
    updateValue: (payload: RendererEditPayload) => void
    closeWindow: (payload: RendererClosePayload) => void
    requestStartEditing: (payload: RendererEditPayload) => void
    requestSyncValue: (payload: RendererEditPayload) => void
    requestSaveEditing: (payload: RendererEditPayload) => void
    requestCancelEditing: (payload: RendererEditPayload) => void
    requestCurrentValue: () => void
    notifyEditingState: (payload: RendererEditingStatePayload) => void
    onInitValue: (callback: (payload: RendererEditPayload) => void) => () => void
    onUpdateValue: (callback: (payload: RendererEditPayload) => void) => () => void
    onEditWindowClosed: (
      callback: (payload: RendererClosePayload) => void
    ) => () => void
    onEditingStateChange: (
      callback: (payload: RendererEditingStatePayload) => void
    ) => () => void
    onStartEditingRequest: (
      callback: (payload: RendererEditPayload) => void
    ) => () => void
    onSyncValueRequest: (
      callback: (payload: RendererEditPayload) => void
    ) => () => void
    onSaveEditingRequest: (
      callback: (payload: RendererEditPayload) => void
    ) => () => void
    onCancelEditingRequest: (
      callback: (payload: RendererEditPayload) => void
    ) => () => void
  }
}
