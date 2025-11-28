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
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);

  const messageIdRef = useRef<string | null>(null);
  const isEditingRef = useRef(false);
  const messageBoxRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

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
      if (isEditing) {
        setLockedHeight((prev) => {
          if (prev !== null) {
            return prev;
          }
          const container = messageBoxRef.current;
          return container ? container.clientHeight : null;
        });
      } else {
        setLockedHeight(null);
      }
      setMessageId(id);
      setIsEditing(isEditing);
      setUserMessage(value);
      setDraftMessage(value);
      setInitialMessage(value);
    };

    const unsubscribeInit = windowService.onInitValue(initHandler);
    const unsubscribeUpdate = windowService.onUpdateValue(updateHandler);
    const unsubscribeEditingState = windowService.onEditingStateChange(editingStateHandler);

    windowService.requestCurrentValue();

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

  useEffect(() => {
    if (!isEditing) {
      return;
    }
    const editor = editorRef.current;
    if (editor) {
      window.requestAnimationFrame(() => {
        editor.scrollTop = 0;
      });
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditing) {
      return;
    }

    const container = messageBoxRef.current;
    if (container) {
      container.scrollTop = 0;
    }

    window.scrollTo(0, 0);
  }, [userMessage, messageId, isEditing]);

  const handleStartEditing = () => {
    if (!messageIdRef.current) {
      return;
    }
    const container = messageBoxRef.current;
    setLockedHeight(container ? container.clientHeight : null);
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

  const handleDraftChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
        <textarea
          ref={editorRef}
          className="message-editor"
          value={draftMessage}
          onChange={handleDraftChange}
          placeholder="Type your message"
          autoFocus
          style={lockedHeight ? { minHeight: `${lockedHeight}px` } : undefined}
        />
      );
    }

    return userMessage || 'No messages received.';
  };

  return (
    <div className="newWindow-container">
      <h1>User Message</h1>
      <div
        ref={messageBoxRef}
        className={`message-box ${isEditing ? 'editing' : ''}`}
        style={lockedHeight ? { minHeight: `${lockedHeight}px` } : undefined}
      >
        {renderContent()}
      </div>
      <div className="newWindow-actions">
        {isEditing ? (
          <>
            <button
              type="button"
              className="btn-icon btn-save"
              onClick={handleSave}
              aria-label="Save message"
            >
              <img src={SaveIcon} alt="" className="action-icon" />
            </button>
            <button
              type="button"
              className="btn-icon btn-cancel"
              onClick={handleCancel}
              aria-label="Cancel and revert changes"
            >
              <img src={CancelIcon} alt="" className="action-icon" />
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn-icon btn-edit"
            onClick={handleStartEditing}
            aria-label="Edit message"
            disabled={!messageId}
          >
            <img src={EditIcon} alt="" className="action-icon" />
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
