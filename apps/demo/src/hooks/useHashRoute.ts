import { useMemo, useSyncExternalStore } from 'react';
import { resolveRoute, type ResolvedRoute } from '../../shared/routes';

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};

// Path in the hash without the '#'; an empty hash is the home route.
const getPath = () => window.location.hash.slice(1) || '/';

/**
 * Route of this window, read from `location.hash` and kept current on
 * 'hashchange'. Null when the hash matches no known route.
 */
export const useHashRoute = (): ResolvedRoute | null => {
  const path = useSyncExternalStore(subscribe, getPath);
  return useMemo(() => resolveRoute(path), [path]);
};
