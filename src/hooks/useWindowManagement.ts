import { useCallback, useState } from 'react';
import { windowService } from '../services';

interface EditState {
  [id: string]: string;
}

export const useWindowManagement = () => {
  const [editingValues, setEditingValues] = useState<EditState>({});

  const startEditing = useCallback((id: string, initialValue: string) => {
    setEditingValues((prev) => ({ ...prev, [id]: initialValue }));
    windowService.openEditWindow({ id, value: initialValue });
  }, []);

  const syncEditing = useCallback((id: string, value: string) => {
    setEditingValues((prev) => ({ ...prev, [id]: value }));
    windowService.syncEditValue({ id, value });
  }, []);

  const finishEditing = useCallback((id: string) => {
    setEditingValues((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const cancelEditing = useCallback((id: string, originalValue: string) => {
    windowService.syncEditValue({ id, value: originalValue });
    windowService.closeEditWindow({ id });
    setEditingValues((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const closeEditingWindow = useCallback((id: string) => {
    windowService.closeEditWindow({ id });
    setEditingValues((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  return {
    editingValues,
    startEditing,
    syncEditing,
    finishEditing,
    cancelEditing,
    closeEditingWindow,
  };
};
