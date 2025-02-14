import React, { useState, useEffect } from 'react';
import '../styles/global.css';

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [displayMessage, setDisplayMessage] = useState('');

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUpdateValue = (_event: any, message: string) => {
      setDisplayMessage(message);
    };

    window.ipcRenderer.on('update-value', handleUpdateValue);

    return () => {
      window.ipcRenderer.off('update-value', handleUpdateValue);
    };
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (inputValue.trim() !== '') {
      window.ipcRenderer.send('open-new-window', inputValue);
      window.ipcRenderer.send('update-value', inputValue);
      setInputValue(''); // Limpa o campo de entrada após o envio
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit(event as unknown as React.FormEvent);
    }
  };

  return (
    <div className="app-container">
      <h1>Digite algo</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Digite algo..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="input-field"
        />
        <button type="submit" className="btn-submit">
          Enviar
        </button>
      </form>
      {displayMessage && (
        <div className="message-display">
          <h2>Última mensagem enviada:</h2>
          <p>{displayMessage}</p>
        </div>
      )}
    </div>
  );
};

export default App;
