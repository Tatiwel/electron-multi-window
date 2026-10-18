import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { useAppStore, useDraftInput } from '../hooks';
import { windowService } from '../services';
import { hasDraft } from '../../shared/reducer';
import EditIcon from '../assets/icons/edit-icon.svg';
import SaveIcon from '../assets/icons/save-icon.svg';
import CancelIcon from '../assets/icons/cancel-icon.svg';
import '../assets/styles/newWindow.css';

const NewWindow: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const [messageId, setMessageId] = useState<string | null>(null);
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);

  const messageBoxRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  // Height of the box in read mode, kept so edit mode does not shrink it.
  const readHeightRef = useRef<number | null>(null);

  // Ask the main process which message this window belongs to.
  useEffect(() => {
    let active = true;
    windowService
      .getWindowContext()
      .then((context) => {
        if (active && context) {
          setMessageId(context.messageId);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to fetch the window context:', error);
      });
    return () => {
      active = false;
    };
  }, []);

  // Everything below is derived from the store. If the message is deleted
  // the window shows nothing; the main process closes it anyway.
  const message =
    messageId === null
      ? undefined
      : state.messages.find((item) => item.id === messageId);
  const userMessage = message?.value ?? '';
  const storeDraft =
    messageId !== null && hasDraft(state.editing, messageId)
      ? state.editing[messageId]
      : undefined;
  const isEditing = storeDraft !== undefined;

  const draft = useDraftInput(storeDraft ?? '', (value) => {
    if (messageId !== null) {
      dispatch({ type: 'edit/draft', id: messageId, value });
    }
  });

  useLayoutEffect(() => {
    if (isEditing) {
      setLockedHeight((prev) => prev ?? readHeightRef.current);
      return;
    }
    setLockedHeight(null);
    readHeightRef.current = messageBoxRef.current?.clientHeight ?? null;
  }, [isEditing, userMessage]);

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
    if (messageId !== null) {
      dispatch({ type: 'edit/start', id: messageId });
    }
  };

  const handleSave = () => {
    if (messageId !== null) {
      dispatch({ type: 'edit/save', id: messageId });
    }
  };

  const handleCancel = () => {
    if (messageId !== null) {
      dispatch({ type: 'edit/cancel', id: messageId });
    }
  };

  const renderContent = () => {
    if (isEditing) {
      return (
        <textarea
          ref={editorRef}
          className="message-editor"
          value={draft.value}
          onChange={draft.handleChange}
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
