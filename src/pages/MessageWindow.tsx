import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAppStore, useDraftInput } from '../hooks';
import { hasDraft } from '../../shared/reducer';
import EditIcon from '../assets/icons/edit-icon.svg';
import SaveIcon from '../assets/icons/save-icon.svg';
import CancelIcon from '../assets/icons/cancel-icon.svg';

interface MessageWindowProps {
  /** Id of the message, taken from the route '/message/:id'. */
  id: string;
}

/** Child window screen, route `ROUTES.message`. */
const MessageWindow: React.FC<MessageWindowProps> = ({ id: messageId }) => {
  const { state, dispatch } = useAppStore();
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);

  const messageBoxRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  // Height of the box in read mode, kept so edit mode does not shrink it.
  const readHeightRef = useRef<number | null>(null);

  useEffect(() => {
    document.title = 'Edit Message';
  }, []);

  // Everything below is derived from the store. If the message is deleted
  // the window shows nothing; the main process closes it anyway.
  const message = state.messages.find((item) => item.id === messageId);
  const userMessage = message?.value ?? '';
  const storeDraft = hasDraft(state.editing, messageId)
    ? state.editing[messageId]
    : undefined;
  const isEditing = storeDraft !== undefined;

  const draft = useDraftInput(storeDraft ?? '', (value) => {
    dispatch({ type: 'edit/draft', id: messageId, value });
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
    dispatch({ type: 'edit/start', id: messageId });
  };

  const handleSave = () => {
    dispatch({ type: 'edit/save', id: messageId });
  };

  const handleCancel = () => {
    dispatch({ type: 'edit/cancel', id: messageId });
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
          >
            <img src={EditIcon} alt="" className="action-icon" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageWindow;
