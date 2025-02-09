import React, { useState, useEffect } from 'react';

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [displayMessage, setDisplayMessage] = useState('');

  useEffect(() => {
    window.ipcRenderer.on('update-value', (_event, message) => {
      setDisplayMessage(message);
    });

    return () => {
      window.ipcRenderer.off('update-value', () => {});
    };
  }, []);

  const handleSubmit = () => {
    if (inputValue.trim() !== '') {
      // Envia a requisição para abrir a nova janela com o dado
      window.ipcRenderer.send('open-new-window', inputValue);
      // Também atualiza o dado (caso queira sincronizar)
      window.ipcRenderer.send('update-value', inputValue);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Digite algo</h1>
      <input
        type="text"
        placeholder="Digite algo..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        style={{ padding: '10px', fontSize: '16px', width: '300px' }}
      />
      <button
        onClick={handleSubmit}
        style={{ padding: '10px 20px', marginLeft: '10px' }}
      >
        Enviar
      </button>
      {displayMessage && (
        <div style={{ marginTop: '20px' }}>
          <h2>Última mensagem enviada:</h2>
          <p>{displayMessage}</p>
        </div>
      )}
    </div>
  );
};

export default App;
