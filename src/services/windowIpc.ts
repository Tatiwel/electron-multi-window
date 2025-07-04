export function openNewWindow(id: string, value: string) {
  window.ipcRenderer.send('open-new-window', { id, value });
}

export function updateWindowValue(id: string, value: string) {
  window.ipcRenderer.send('update-value', { id, value });
}

export function closeWindow(id: string) {
  window.ipcRenderer.send('close-window', { id });
}
