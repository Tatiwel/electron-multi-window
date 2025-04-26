import React, { useState } from 'react';
import EditIcon from '../assets/edit-icon.svg';
import TrashIcon from '../assets/trash-icon.svg';
import SaveIcon from '../assets/save-icon.svg';
import CancelIcon from '../assets/cancel-icon.svg';
import '../styles/global.css';
import '../styles/app.css';

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Cria nova mensagem
  const handleCreateMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setMessages([...messages, inputValue]);
    setInputValue('');
  };

  // Atualiza o input por causa do value={inputValue}, caso nao tenha isso, o input não atualiza
  // e o valor fica fixo no que foi digitado na primeira vez
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Inicia a edição de uma linha
  const handleEditClick = (index: number) => {
    setEditingIndex(index);
    setEditingValue(messages[index]);
    window.ipcRenderer.send('open-new-window', messages[index]);
    window.ipcRenderer.send('update-value', messages[index]);
  };

  // Atualiza o valor enquanto edita
  const handleEditingSync = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingValue(e.target.value);
    window.ipcRenderer.send('update-value', e.target.value);
  };

  // Salva a edição
  const handleSave = () => {
    if (editingIndex === null) return;
    const updated = [...messages];
    updated[editingIndex] = editingValue;
    setMessages(updated);
    setEditingIndex(null);
    setEditingValue('');
  };

  // Cancela a edição
  const handleCancel = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  // Remove mensagem
  const handleDelete = (index: number) => {
    setMessages(messages.filter((_, i) => i !== index));
  };

  return (
    <div className="app-container">
      <h1>Type Something...</h1>
      <form onSubmit={handleCreateMessage}>
        <input
          type="text"
          placeholder="Type here..."
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
          <>
            <h4>No messages yet!</h4>
          </>
        ) : (
          <>
            <div className="messages-grid">
              {/* Cabeçalho */}
              <div className="messages-header">
                <div>Index</div>
                <div>Message</div>
                <div style={{ width: '60px' }}>Action</div>
              </div>

              {messages.map((message, index) => (
                <div key={index} className="message-row">
                  <div className="message-index">{index + 1}.</div>

                  {editingIndex === index ? (
                    <>
                      <div className="message-text">
                        <input
                          type="text"
                          value={editingValue}
                          onChange={handleEditingSync}
                          className="input-edit"
                        />
                      </div>
                      <div className="message-action">
                        <button onClick={handleSave} className="btn-save">
                          <img
                            src={SaveIcon}
                            alt="Save"
                            className="action-icon"
                          />
                        </button>
                        <button onClick={handleCancel} className="btn-cancel">
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
                      <div className="message-text">{message}</div>
                      <div className="message-action">
                        <button
                          onClick={() => handleEditClick(index)}
                          className="btn-edit"
                        >
                          <img
                            src={EditIcon}
                            alt="Edit"
                            className="action-icon"
                          />
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
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
          </>
        )}
      </div>
    </div>
  );
};

export default App;
