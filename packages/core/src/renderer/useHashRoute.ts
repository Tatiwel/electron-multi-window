import { useMemo, useSyncExternalStore } from 'react';
import type { ResolvedRoute, Routes } from '../shared/index.js';

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};

// Path in the hash without the '#'; an empty hash is the home route.
const getPath = () => window.location.hash.slice(1) || '/';

/**
 * Route of this window, read from `location.hash` and kept current on
 * 'hashchange'. Null when the hash matches no registered pattern.
 */
export const useHashRoute = <P extends string>(
  routes: Routes<P>
): ResolvedRoute<P> | null => {
  const path = useSyncExternalStore(subscribe, getPath);
  return useMemo(() => routes.resolveRoute(path), [routes, path]);
};
