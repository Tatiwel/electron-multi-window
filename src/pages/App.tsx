import React, { useEffect, useState, type FormEvent } from 'react';
import MessageItem from '../components/MessageItem/MessageItem';
import { useAppStore } from '../hooks';
import { windowService } from '../services';
import { hasDraft } from '../../shared/reducer';
import '../assets/styles/global.css';
import '../assets/styles/app.css';

const App: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const [inputValue, setInputValue] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleCreateMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = inputValue.trim();
    if (!value) {
      return;
    }
    dispatch({ type: 'message/create', value });
    setInputValue('');
  };

  // Starts editing and opens (or focuses) the child window of the message.
  const handleEditClick = (id: string) => {
    dispatch({ type: 'edit/start', id });
    windowService.openWindow(id);
  };

  const handleEditingChange = (id: string, value: string) => {
    dispatch({ type: 'edit/draft', id, value });
  };

  const handleSave = (id: string) => {
    dispatch({ type: 'edit/save', id });
  };

  const handleCancel = (id: string) => {
    dispatch({ type: 'edit/cancel', id });
  };

  // The main process closes the child window of a deleted message.
  const handleDelete = (id: string) => {
    dispatch({ type: 'message/delete', id });
  };

  // Modal helpers
  const openModal = (text: string) => {
    setModalMessage(text);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalMessage('');
  };

  // close modal on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalOpen) closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  const { messages, editing } = state;

  return (
    <div className="app-container">
      <h1>Type Something:</h1>
      <form onSubmit={handleCreateMessage}>
        <input
          type="text"
          placeholder="Type here."
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          className="input-field"
        />
        <button type="submit" className="btn-submit">
          Create a Message
        </button>
      </form>

      <div className="message-display">
        <h2>Last Messages:</h2>
        {messages.length === 0 ? (
          <h4 className="no_messages_yet">No messages yet!</h4>
        ) : (
          <div className="messages-grid">
            {/* Cabeçalho */}
            <div className="messages-header">
              <div>Index</div>
              <div>Message</div>
              {/* Keep header width consistent with CSS (.message-row > div.message-action) */}
              <div style={{ width: '96px' }}>Action</div>
            </div>
            {messages.map((message, index) => (
              <MessageItem
                key={message.id}
                index={index}
                message={message}
                isEditing={hasDraft(editing, message.id)}
                editingValue={editing[message.id]}
                onEdit={() => handleEditClick(message.id)}
                onDelete={() => handleDelete(message.id)}
                onSave={() => handleSave(message.id)}
                onCancel={() => handleCancel(message.id)}
                onEditingChange={(value) =>
                  handleEditingChange(message.id, value)
                }
                onPreview={() => openModal(message.value)}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className={`modal-overlay ${modalOpen ? 'open' : ''}`} onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} aria-label="Close">×</button>
            <div className="modal-message-body">{modalMessage}</div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
