import React, { useState } from 'react';
import EditIcon from '../assets/edit-icon.svg';
import TrashIcon from '../assets/trash-icon.svg';
import '../styles/global.css';
import '../styles/app.css';

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Cria nova mensagem
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    window.ipcRenderer.send('open-new-window', inputValue);
    setMessages([...messages, inputValue]);
    //setInputValue('');
  };

  // Atualiza o input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    window.ipcRenderer.send('update-value', e.target.value);
  };

  // Inicia a edição de uma linha

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
    setEditingValue(messages[index]);
    window.ipcRenderer.send('open-new-window', messages[index]);
    window.ipcRenderer.send('update-value', messages[index]);
    console.log('Editing:', messages[index]);
    console.log(editingValue); // ainda estará desatualizado aqui
  };

  // const handleEditClick = (index: number) => {
  //   setEditingIndex(index);
  //   setEditingValue(messages[index]);
  //   window.ipcRenderer.send('open-new-window', editingValue);
  //   console.log('Editing:', messages[index]);
  //   console.log(editingValue);
  // };

  // Atualiza o valor enquanto edita
  const handleEditingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      <form onSubmit={handleCreate}>
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
        <div className="messages-grid">
          {/* Cabeçalho */}
          <div className="messages-header">
            <div>#</div>
            <div>Message</div>
            <div>Action</div>
          </div>

          {/* Linhas de mensagem */}
          {messages.map((message, index) => (
            <div key={index} className="message-row">
              <div className="message-index">{index + 1}.</div>

              {editingIndex === index ? (
                <>
                  <div className="message-text">
                    <input
                      type="text"
                      value={editingValue}
                      onChange={handleEditingChange}
                      className="input-edit"
                    />
                  </div>
                  <div className="message-action">
                    <button onClick={handleSave} className="btn-save">
                      Save
                    </button>
                    <button onClick={handleCancel} className="btn-cancel">
                      Cancel
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
                      <img src={EditIcon} alt="Edit" className="action-icon" />
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
      </div>
    </div>
  );
};

export default App;
