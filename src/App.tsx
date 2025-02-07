import React, { useState, useEffect } from 'react';

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [displayMessage, setDisplayMessage] = useState('');

  useEffect(() => {
    // Escuta o evento para exibir a mensagem na nova janela
    window.ipcRenderer.on('display-user-name', (_event, message) => {
      setDisplayMessage(message);
    });
    // Escuta atualizações do valor, se necessário
    window.ipcRenderer.on('update-value', (_event, message) => {
      setDisplayMessage(message);
    });

    return () => {
      window.ipcRenderer.off('display-user-name', () => {});
      window.ipcRenderer.off('update-value', () => {});
    };
  }, []);

  const handleSubmit = () => {
    if (inputValue.trim() !== '') {
      // Envia para o processo principal a requisição para abrir nova janela
      window.ipcRenderer.send('open-new-window', inputValue);
      // Atualiza o valor (caso a nova janela já esteja aberta e precise sincronizar)
      window.ipcRenderer.send('update-value', inputValue);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {displayMessage ? (
        <div>
          <h2>Informação Digitada:</h2>
          <p>{displayMessage}</p>
        </div>
      ) : (
        <div>
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
        </div>
      )}
    </div>
  );
};

export default App;
