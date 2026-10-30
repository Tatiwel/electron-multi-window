import React, { useEffect } from 'react';
import { useHashRoute } from '../hooks';
import { ROUTES } from '../../shared/routes';
import Home from './App';
import MessageWindow from './MessageWindow';

const UnknownRoute: React.FC = () => {
  useEffect(() => {
    document.title = 'Unknown route';
  }, []);

  return (
    <div className="app-container">
      <h1>Unknown route</h1>
    </div>
  );
};

/** Picks the screen of this window from its hash route. */
const Root: React.FC = () => {
  const route = useHashRoute();

  switch (route?.pattern) {
    case ROUTES.home:
      return <Home />;
    case ROUTES.message:
      return <MessageWindow key={route.params.id} id={route.params.id} />;
    default:
      return <UnknownRoute />;
  }
};

export default Root;
