import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  type EditPayload,
  type EditingStatePayload,
  windowService,
} from '../services';
import EditIcon from '../assets/icons/edit-icon.svg';
import SaveIcon from '../assets/icons/save-icon.svg';
import CancelIcon from '../assets/icons/cancel-icon.svg';
import '../assets/styles/newWindow.css';

const NewWindow: React.FC = () => {
  const [messageId, setMessageId] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const messageIdRef = useRef<string | null>(null);
  const isEditingRef = useRef(false);

  useEffect(() => {
    const initHandler = ({ id, value }: EditPayload) => {
      messageIdRef.current = id;
      isEditingRef.current = false;
      setMessageId(id);
      setIsEditing(false);
      setUserMessage(value);
      setDraftMessage(value);
      setInitialMessage(value);
    };

    const updateHandler = ({ id, value }: EditPayload) => {
      const currentId = messageIdRef.current;
      if (currentId && id !== currentId) {
        return;
      }
      messageIdRef.current = id;
      setMessageId(id);
      setUserMessage(value);
      setDraftMessage(value);
      if (!isEditingRef.current) {
        setInitialMessage(value);
      }
    };

    const editingStateHandler = ({ id, value, isEditing }: EditingStatePayload) => {
      const currentId = messageIdRef.current;
      if (currentId && id !== currentId) {
        return;
      }
      messageIdRef.current = id;
      isEditingRef.current = isEditing;
      setMessageId(id);
      setIsEditing(isEditing);
      setUserMessage(value);
      setDraftMessage(value);
      setInitialMessage(value);
    };

    const unsubscribeInit = windowService.onInitValue(initHandler);
    const unsubscribeUpdate = windowService.onUpdateValue(updateHandler);
    const unsubscribeEditingState = windowService.onEditingStateChange(editingStateHandler);

    return () => {
      unsubscribeInit();
      unsubscribeUpdate();
      unsubscribeEditingState();
    };
  }, []);

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  useEffect(() => {
    messageIdRef.current = messageId;
  }, [messageId]);

  const handleStartEditing = () => {
    if (!messageIdRef.current) {
      return;
    }
    const currentValue = userMessage;
    setIsEditing(true);
    isEditingRef.current = true;
    setInitialMessage(currentValue);
    setDraftMessage(currentValue);
    windowService.requestStartEditing({
      id: messageIdRef.current,
      value: currentValue,
    });
  };

  const handleDraftChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!messageIdRef.current) {
      return;
    }
    const value = event.target.value;
    setDraftMessage(value);
    setUserMessage(value);
    windowService.requestSyncValue({ id: messageIdRef.current, value });
  };

  const handleSave = () => {
    if (!messageIdRef.current) {
      return;
    }
    windowService.requestSaveEditing({
      id: messageIdRef.current,
      value: draftMessage,
    });
  };

  const handleCancel = () => {
    if (!messageIdRef.current) {
      return;
    }
    setDraftMessage(initialMessage);
    setUserMessage(initialMessage);
    windowService.requestCancelEditing({
      id: messageIdRef.current,
      value: initialMessage,
    });
  };

  const renderContent = () => {
    if (isEditing) {
      return (
        <input
          className="message-input"
          type="text"
          value={draftMessage}
          onChange={handleDraftChange}
          placeholder="Type your message"
          autoFocus
        />
      );
    }

    return userMessage || 'No messages received.';
  };

  return (
    <div className="newWindow-container">
      <h1>User Message</h1>
      <div className={`message-box ${isEditing ? 'editing' : ''}`}>
        {renderContent()}
      </div>
      <div className="newWindow-actions">
        {isEditing ? (
          <>
            <button
              type="button"
              className="action-button save"
              onClick={handleSave}
              aria-label="Salvar mensagem"
            >
              <img src={SaveIcon} alt="" />
            </button>
            <button
              type="button"
              className="action-button cancel"
              onClick={handleCancel}
              aria-label="Voltar sem salvar"
            >
              <img src={CancelIcon} alt="" />
            </button>
          </>
        ) : (
          <button
            type="button"
            className="action-button edit"
            onClick={handleStartEditing}
            aria-label="Editar mensagem"
            disabled={!messageId}
          >
            <img src={EditIcon} alt="" />
          </button>
        )}
      </div>
    </div>
  );
};

// Monta o componente na div com id "root"
ReactDOM.createRoot(document.getElementById('newWindowRoot')!).render(
  <React.StrictMode>
    <NewWindow />
  </React.StrictMode>
);

export default NewWindow;
