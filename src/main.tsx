import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './pages/App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message);
});
