import { useCallback, useState } from 'react';
import { windowService } from '../services';

interface EditState {
  [id: string]: string;
}

export const useWindowManagement = () => {
  const [editingValues, setEditingValues] = useState<EditState>({});

  const setEditingEntry = useCallback((id: string, value: string) => {
    setEditingValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const removeEditingEntry = useCallback((id: string) => {
    setEditingValues((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const dispatchEditingState = useCallback(
    (id: string, isEditing: boolean, value: string) => {
      windowService.notifyEditingState({ id, isEditing, value });
    },
    []
  );

  const startEditing = useCallback(
    (id: string, initialValue: string) => {
      setEditingEntry(id, initialValue);
      windowService.openEditWindow({ id, value: initialValue });
      dispatchEditingState(id, true, initialValue);
    },
    [dispatchEditingState, setEditingEntry]
  );

  const startEditingFromRemote = useCallback(
    (id: string, initialValue: string) => {
      setEditingEntry(id, initialValue);
      dispatchEditingState(id, true, initialValue);
    },
    [dispatchEditingState, setEditingEntry]
  );

  const syncEditing = useCallback(
    (id: string, value: string) => {
      setEditingEntry(id, value);
      windowService.syncEditValue({ id, value });
    },
    [setEditingEntry]
  );

  const syncEditingFromRemote = useCallback(
    (id: string, value: string) => {
      setEditingEntry(id, value);
    },
    [setEditingEntry]
  );

  const finishEditing = useCallback(
    (id: string, finalValue: string) => {
      removeEditingEntry(id);
      dispatchEditingState(id, false, finalValue);
    },
    [dispatchEditingState, removeEditingEntry]
  );

  const finishEditingFromRemote = useCallback(
    (id: string, finalValue: string) => {
      removeEditingEntry(id);
      dispatchEditingState(id, false, finalValue);
    },
    [dispatchEditingState, removeEditingEntry]
  );

  const cancelEditing = useCallback(
    (id: string, originalValue: string) => {
      windowService.syncEditValue({ id, value: originalValue });
      removeEditingEntry(id);
      dispatchEditingState(id, false, originalValue);
    },
    [dispatchEditingState, removeEditingEntry]
  );

  const cancelEditingFromRemote = useCallback(
    (id: string, originalValue: string) => {
      windowService.syncEditValue({ id, value: originalValue });
      removeEditingEntry(id);
      dispatchEditingState(id, false, originalValue);
    },
    [dispatchEditingState, removeEditingEntry]
  );

  const closeEditingWindow = useCallback((id: string) => {
    windowService.closeEditWindow({ id });
    removeEditingEntry(id);
  }, [removeEditingEntry]);

  return {
    editingValues,
    startEditing,
    startEditingFromRemote,
    syncEditing,
    syncEditingFromRemote,
    finishEditing,
    finishEditingFromRemote,
    cancelEditing,
    cancelEditingFromRemote,
    closeEditingWindow,
  };
};
