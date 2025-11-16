import React, { useEffect, useRef, useState } from 'react';
import MessageItem from '../components/MessageItem/MessageItem';
import { useMessageManagement, useWindowManagement } from '../hooks';
import { windowService } from '../services';
import '../assets/styles/global.css';
import '../assets/styles/app.css';


const App: React.FC = () => {
  const {
    messages,
    inputValue,
    handleInputChange,
    handleCreateMessage,
    updateMessage,
    removeMessage,
  } = useMessageManagement();
  const {
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
  } = useWindowManagement();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Abre janela de edição e inicializa slot
  const handleEditClick = (id: string) => {
    const message = messages.find((msg) => msg.id === id);
    if (!message) return;
    startEditing(id, message.text);
  };

  // Sincroniza valor enquanto digita
  const handleEditingSync = (id: string, newValue: string) => {
    syncEditing(id, newValue);
  };

  // Salva edição de um slot específico
  const handleSave = (id: string) => {
    const editedValue = editingValues[id];
    if (editedValue === undefined) {
      return;
    }
    updateMessage(id, editedValue);
    finishEditing(id, editedValue);
  };

  // Cancela edição de um slot específico
  const handleCancel = (id: string) => {
    const message = messages.find((msg) => msg.id === id);
    if (!message) return;
    cancelEditing(id, message.text);
  };

  // Deleta mensagem + limpa qualquer slot aberto
  const handleDelete = (id: string) => {
    removeMessage(id);
    closeEditingWindow(id);
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

  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const unsubscribeStart = windowService.onStartEditingRequest(({ id, value }) => {
      startEditingFromRemote(id, value);
    });

    const unsubscribeSync = windowService.onSyncValueRequest(({ id, value }) => {
      syncEditingFromRemote(id, value);
    });

    const unsubscribeSave = windowService.onSaveEditingRequest(({ id, value }) => {
      updateMessage(id, value);
      finishEditingFromRemote(id, value);
    });

    const unsubscribeCancel = windowService.onCancelEditingRequest(({ id, value }) => {
      const message = messagesRef.current.find((msg) => msg.id === id);
      const originalValue = message?.text ?? value ?? '';
      cancelEditingFromRemote(id, originalValue);
    });

    return () => {
      unsubscribeStart();
      unsubscribeSync();
      unsubscribeSave();
      unsubscribeCancel();
    };
  }, [
    cancelEditingFromRemote,
    finishEditingFromRemote,
    startEditingFromRemote,
    syncEditingFromRemote,
    updateMessage,
  ]);

  return (
    <div className="app-container">
      <h1>Type Something:</h1>
      <form onSubmit={handleCreateMessage}>
        <input
          type="text"
          placeholder="Type here."
          value={inputValue}
          onChange={handleInputChange}
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
                isEditing={message.id in editingValues}
                editingValue={editingValues[message.id]}
                onEdit={() => handleEditClick(message.id)}
                onDelete={() => handleDelete(message.id)}
                onSave={() => handleSave(message.id)}
                onCancel={() => handleCancel(message.id)}
                onEditingChange={(event) =>
                  handleEditingSync(message.id, event.target.value)
                }
                onPreview={() => openModal(message.text)}
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
