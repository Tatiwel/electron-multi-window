import React from 'react';
import ReactDOM from 'react-dom/client';
import Root from './pages/Root';
import './assets/styles/global.css';
import './assets/styles/app.css';
import './assets/styles/newWindow.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
