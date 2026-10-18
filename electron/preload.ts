import { contextBridge, ipcRenderer } from 'electron';
import {
  IPC,
  type ClosePayload,
  type EditPayload,
  type EditingStatePayload,
  type ElectronAPI,
  type IpcChannel,
} from '../shared/ipc';

const exposeListener = <T>(
  channel: IpcChannel,
  callback: (payload: T) => void
) => {
  const listener = (_event: Electron.IpcRendererEvent, payload: T) => {
    callback(payload);
  };

  ipcRenderer.on(channel, listener);

  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
};

const electronAPI: ElectronAPI = {
  openNewWindow: (payload) => ipcRenderer.send(IPC.OPEN_NEW_WINDOW, payload),
  updateValue: (payload) => ipcRenderer.send(IPC.UPDATE_VALUE, payload),
  closeWindow: (payload) => ipcRenderer.send(IPC.CLOSE_WINDOW, payload),
  requestStartEditing: (payload) =>
    ipcRenderer.send(IPC.CHILD_REQUEST_EDIT, payload),
  requestSyncValue: (payload) =>
    ipcRenderer.send(IPC.CHILD_SYNC_EDIT_VALUE, payload),
  requestSaveEditing: (payload) =>
    ipcRenderer.send(IPC.CHILD_SAVE_EDIT, payload),
  requestCancelEditing: (payload) =>
    ipcRenderer.send(IPC.CHILD_CANCEL_EDIT, payload),
  getCurrentValue: () => ipcRenderer.invoke(IPC.GET_CURRENT_VALUE),
  notifyEditingState: (payload) =>
    ipcRenderer.send(IPC.NOTIFY_EDITING_STATE, payload),
  onInitValue: (callback) =>
    exposeListener<EditPayload>(IPC.INIT_VALUE, callback),
  onUpdateValue: (callback) =>
    exposeListener<EditPayload>(IPC.UPDATE_VALUE, callback),
  onEditWindowClosed: (callback) =>
    exposeListener<ClosePayload>(IPC.EDIT_WINDOW_CLOSED, callback),
  onEditingStateChange: (callback) =>
    exposeListener<EditingStatePayload>(IPC.EDITING_STATE_CHANGED, callback),
  onStartEditingRequest: (callback) =>
    exposeListener<EditPayload>(IPC.CHILD_REQUEST_EDIT, callback),
  onSyncValueRequest: (callback) =>
    exposeListener<EditPayload>(IPC.CHILD_SYNC_EDIT_VALUE, callback),
  onSaveEditingRequest: (callback) =>
    exposeListener<EditPayload>(IPC.CHILD_SAVE_EDIT, callback),
  onCancelEditingRequest: (callback) =>
    exposeListener<EditPayload>(IPC.CHILD_CANCEL_EDIT, callback),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
