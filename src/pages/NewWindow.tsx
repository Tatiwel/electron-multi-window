import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/newwindow.css';

const NewWindow: React.FC = () => {
  const [userMessage, setUserMessage] = useState('');

  useEffect(() => {
    // inicializa com o valor passado ao abrir
    const initHandler = (_e: any, value: string) => {
      setUserMessage(value);
    };
    // sincroniza atualizações subsequentes
    const updateHandler = (_e: any, value: string) => {
      setUserMessage(value);
    };

    window.ipcRenderer.on('init-value', initHandler);
    window.ipcRenderer.on('update-value', updateHandler);

    return () => {
      window.ipcRenderer.off('init-value', initHandler);
      window.ipcRenderer.off('update-value', updateHandler);
    };
  }, []);

  return (
    <div className="newwindow-container">
      <h1>User Message</h1>
      <div className="message-box">
        {userMessage || 'No messages received.'}
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
