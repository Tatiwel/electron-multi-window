import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { type EditPayload, windowService } from '../services';
import '../assets/styles/newWindow.css';

const NewWindow: React.FC = () => {
  const [userMessage, setUserMessage] = useState('');

  useEffect(() => {
    // inicializa com o valor passado ao abrir
    const initHandler = ({ value }: EditPayload) => {
      setUserMessage(value);
    };
    // sincroniza atualizações subsequentes
    const updateHandler = ({ value }: EditPayload) => {
      setUserMessage(value);
    };

    const unsubscribeInit = windowService.onInitValue(initHandler);
    const unsubscribeUpdate = windowService.onUpdateValue(updateHandler);

    return () => {
      unsubscribeInit();
      unsubscribeUpdate();
    };
  }, []);

  return (
    <div className="newWindow-container">
      <h1>User Message</h1>
      <div className="message-box">
        {userMessage || 'No messages received.'}
      </div>
    </div>
  );
};

// Monta o componente na div com id "root"
ReactDOM.createRoot(document.getElementById('newWindowRoot')!).render(
  <React.StrictMode>
    <NewWindow />
  </React.StrictMode>
);

export default NewWindow;
