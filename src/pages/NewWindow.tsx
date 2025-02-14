import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/newwindow.css';

const NewWindow: React.FC = () => {
  const [userMessage, setUserMessage] = useState('');

  useEffect(() => {
    window.ipcRenderer.on('display-user-name', (_event, message) => {
      setUserMessage(message);
    });
    window.ipcRenderer.on('update-value', (_event, message) => {
      setUserMessage(message);
    });
    return () => {
      window.ipcRenderer.off('display-user-name', () => {});
      window.ipcRenderer.off('update-value', () => {});
    };
  }, []);

  return (
    <div className="newwindow-container">
      <h1>Mensagem do Usuário</h1>
      <div className="message-box">
        {userMessage || 'Nenhuma mensagem recebida.'}
      </div>
    </div>
  );
};

// Monta o componente na div com id "root"
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NewWindow />
  </React.StrictMode>
);

export default NewWindow;
