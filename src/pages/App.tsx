import React, { useState } from 'react';
import EditIcon from '../assets/edit-icon.svg';
import TrashIcon from '../assets/trash-icon.svg';
import '../styles/global.css';
import '../styles/app.css';

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<string[]>([]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (inputValue.trim() !== '') {
      window.ipcRenderer.send('open-new-window', inputValue);
      window.ipcRenderer.send('update-value', inputValue);

      // Atualiza o estado com a nova mensagem
      setMessages([...messages, inputValue]);

      //setInputValue(''); // Opcional: Limpar o campo de entrada após o envio
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    window.ipcRenderer.send('update-value', newValue);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit(event as unknown as React.FormEvent);
    }
  };

  return (
    <div className="app-container">
      <h1>Type Something...</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Digite algo..."
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="input-field"
        />
        <button type="submit" className="btn-submit">
          Send
        </button>
      </form>
      <div className="message-display">
        <h2>Last Messages:</h2>
        <div className="messages-grid">
          {/* Linha de cabeçalho */}
          <div className="messages-header">
            <div>#</div>
            <div>Message</div>
            <div>Action</div>
          </div>
          {messages.map((message, index) => (
            <div key={index} className="message-row">
              <div className="message-index">{index + 1}.</div>
              <div className="message-text">{message}</div>
              {/* adicione um botao de editar */}
              <div className="message-action">
                <button
                  onClick={() => {
                    const updatedMessages = messages.filter(
                      (_, i) => i !== index
                    );
                    setMessages(updatedMessages);
                  }}
                  className="btn-delete"
                >
                  <img src={TrashIcon} alt="Delete" className="action-icon" />
                </button>
                <button
                  onClick={() => {
                    const updatedMessages = [...messages];
                    updatedMessages[index] =
                      prompt('Edit message:', message) || message;
                    setMessages(updatedMessages);
                  }}
                  className="btn-edit"
                >
                  <img src={EditIcon} alt="Edit" className="action-icon" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
