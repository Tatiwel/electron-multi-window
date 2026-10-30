import { resolveRoute } from '../../shared/routes.js';

// Path in the hash without the '#'; an empty hash is the home route.
const getPath = () => window.location.hash.slice(1) || '/';

/**
 * Route of this window, read from `location.hash`. Null when the hash
 * matches no known route.
 */
export const getRoute = () => resolveRoute(getPath());

/** Calls `callback` on 'hashchange'; returns an unsubscribe function. */
export const onRouteChange = (callback) => {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
};
