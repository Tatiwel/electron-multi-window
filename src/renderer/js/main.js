import { ROUTES } from '../../shared/routes.js';
import { getRoute, onRouteChange } from './route.js';
import { mountHome } from './home.js';
import { mountMessageWindow } from './message-window.js';
import { h } from './dom.js';

const root = document.getElementById('root');

const mountUnknownRoute = (container) => {
  document.title = 'Unknown route';
  container.append(h('div', { class: 'app-container' }, h('h1', {}, 'Unknown route')));
  return { destroy() {} };
};

// Same identity for the same screen and parameters, so a hash change that
// keeps them does not remount the screen.
const screenKey = (route) =>
  route === null ? 'unknown' : `${route.pattern} ${JSON.stringify(route.params)}`;

let current = null;
let currentKey = null;

/** Picks the screen of this window from its hash route. */
const render = () => {
  const route = getRoute();
  const key = screenKey(route);
  if (key === currentKey) {
    return;
  }
  current?.destroy();
  root.replaceChildren();
  currentKey = key;

  switch (route?.pattern) {
    case ROUTES.home:
      current = mountHome(root);
      break;
    case ROUTES.message:
      current = mountMessageWindow(root, route.params.id);
      break;
    default:
      current = mountUnknownRoute(root);
  }
};

onRouteChange(render);
render();
