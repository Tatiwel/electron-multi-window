export interface IPC {
  send(
    channel: 'open-new-window',
    payload: { id: string; value: string }
  ): void;
  send(channel: 'update-value', payload: { id: string; value: string }): void;
  send(channel: 'close-window', payload: { id: string }): void;
}

declare global {
  interface Window {
    IpcRenderer: IPC;
  }
}
