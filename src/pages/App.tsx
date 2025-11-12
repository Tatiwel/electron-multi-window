import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import EditIcon from '../assets/icons/edit-icon.svg';
import TrashIcon from '../assets/icons/trash-icon.svg';
import SaveIcon from '../assets/icons/save-icon.svg';
import CancelIcon from '../assets/icons/cancel-icon.svg';
import '../assets/styles/global.css';
import '../assets/styles/app.css';

// Note: electron types and preload expose `window.ipcRenderer` elsewhere in the
// project; no custom window augmentation is required here.


const App: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<{ id: string; text: string }[]>([]);
  const [editingValues, setEditingValues] = useState<Record<string, string>>(
    {}
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Cria nova mensagem
  const handleCreateMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const newMessage = { id: uuidv4(), text: inputValue };
    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');
  };

  // Atualiza input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Abre janela de edição e inicializa slot
  const handleEditClick = (id: string) => {
    const message = messages.find((msg) => msg.id === id);
    if (!message) return;
    setEditingValues((prev) => ({ ...prev, [id]: message.text }));
    window.ipcRenderer.send('open-new-window', {
      id,
      value: message.text,
    });
  };

  // Sincroniza valor enquanto digita
  const handleEditingSync = (id: string, newValue: string) => {
    setEditingValues((prev) => ({ ...prev, [id]: newValue }));
    window.ipcRenderer.send('update-value', { id, value: newValue });
  };

  // Salva edição de um slot específico
  const handleSave = (id: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, text: editingValues[id] } : msg
      )
    );
    setEditingValues((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  // Cancela edição de um slot específico
  const handleCancel = (id: string) => {
    const message = messages.find((msg) => msg.id === id);
    if (!message) return;
    window.ipcRenderer.send('update-value', {
      id,
      value: message.text,
    });
    window.ipcRenderer.send('close-window', { id });
    setEditingValues((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  // Deleta mensagem + limpa qualquer slot aberto
  const handleDelete = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
    setEditingValues((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    window.ipcRenderer.send('close-window', { id });
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
              <div key={message.id} className="message-row">
                <div className="message-index">{index + 1}.</div>

                {message.id in editingValues ? (
                  <>
                    <div className="message-text">
                      <input
                        type="text"
                        value={editingValues[message.id]}
                        onChange={(e) =>
                          handleEditingSync(message.id, e.target.value)
                        }
                        className="input-edit"
                      />
                    </div>
                    <div className="message-action">
                      <button
                        onClick={() => handleSave(message.id)}
                        className="btn-save"
                      >
                        <img
                          src={SaveIcon}
                          alt="Save"
                          className="action-icon"
                        />
                      </button>
                      <button
                        onClick={() => handleCancel(message.id)}
                        className="btn-cancel"
                      >
                        <img
                          src={CancelIcon}
                          alt="Cancel"
                          className="action-icon"
                        />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="message-text"
                      role="button"
                      tabIndex={0}
                      title={typeof message.text === 'string' ? 'Click to view full message' : ''}
                      onClick={() => openModal(message.text)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') openModal(message.text);
                      }}
                    >
                      {message.text}
                    </div>
                    <div className="message-action">
                      <button
                        onClick={() => handleEditClick(message.id)}
                        className="btn-edit"
                      >
                        <img
                          src={EditIcon}
                          alt="Edit"
                          className="action-icon"
                        />
                      </button>
                      <button
                        onClick={() => handleDelete(message.id)}
                        className="btn-delete"
                      >
                        <img
                          src={TrashIcon}
                          alt="Delete"
                          className="action-icon"
                        />
                      </button>
                    </div>
                  </>
                )}
              </div>
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
