import React, { useEffect, useState, type ReactNode, type ComponentType } from 'react';

/**
 * Route configuration for WindowRouter
 */
export interface RouteConfig {
  path: string;
  component: ComponentType<RouteProps>;
}

/**
 * Props passed to route components
 */
export interface RouteProps<T = unknown> {
  windowId: string | null;
  data: T | null;
  route: string | null;
}

/**
 * Props for WindowRouter component
 */
export interface WindowRouterProps<T = unknown> {
  routes: RouteConfig[];
  defaultComponent?: ComponentType<RouteProps<T>>;
  fallback?: ReactNode;
}

/**
 * Ensure electronWindow API is available
 */
const ensureElectronWindow = () => {
  if (!window.electronWindow) {
    throw new Error('electronWindow API is unavailable. Make sure the preload script is loaded correctly.');
  }
  return window.electronWindow;
};

/**
 * Get current route from URL hash
 */
const getCurrentRoute = (): string | null => {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#')) {
    return hash.slice(1);
  }
  return null;
};

/**
 * WindowRouter component for SPA-based window routing
 * 
 * This component renders different content based on the route/path
 * passed when the window was created. Uses hash-based routing.
 * 
 * @example
 * ```tsx
 * // Define routes
 * const routes: RouteConfig[] = [
 *   { path: '/editor', component: EditorPage },
 *   { path: '/settings', component: SettingsPage },
 *   { path: '/preview', component: PreviewPage },
 * ];
 * 
 * // Use in your app
 * function App() {
 *   return (
 *     <WindowRouter 
 *       routes={routes}
 *       defaultComponent={MainPage}
 *       fallback={<div>Loading...</div>}
 *     />
 *   );
 * }
 * ```
 */
export const WindowRouter = <T = unknown>({
  routes,
  defaultComponent: DefaultComponent,
  fallback,
}: WindowRouterProps<T>): ReactNode => {
  const [routeData, setRouteData] = useState<{
    windowId: string | null;
    data: T | null;
    route: string | null;
    isReady: boolean;
  }>({
    windowId: null,
    data: null,
    route: null,
    isReady: false,
  });

  useEffect(() => {
    // Try to get route from API or URL hash
    try {
      const api = ensureElectronWindow();
      const windowId = api.getWindowId();
      const data = api.getInitialData<T>();
      const apiRoute = api.getRoute();
      const hashRoute = getCurrentRoute();
      const route = apiRoute || hashRoute;

      if (windowId || route) {
        setRouteData({
          windowId,
          data,
          route,
          isReady: true,
        });
      } else {
        // Poll for data
        const checkInit = () => {
          const id = api.getWindowId();
          const d = api.getInitialData<T>();
          const r = api.getRoute() || getCurrentRoute();
          if (id || r) {
            setRouteData({
              windowId: id,
              data: d,
              route: r,
              isReady: true,
            });
            return true;
          }
          return false;
        };

        if (!checkInit()) {
          const intervalId = setInterval(() => {
            if (checkInit()) {
              clearInterval(intervalId);
            }
          }, 50);
          setTimeout(() => clearInterval(intervalId), 1000);

          return () => clearInterval(intervalId);
        }
      }
    } catch {
      // API not available, try hash-based routing
      const hashRoute = getCurrentRoute();
      setRouteData({
        windowId: null,
        data: null,
        route: hashRoute,
        isReady: true,
      });
    }
  }, []);

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const route = getCurrentRoute();
      setRouteData((prev) => ({
        ...prev,
        route,
      }));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!routeData.isReady) {
    return fallback ?? null;
  }

  const { windowId, data, route } = routeData;

  // Find matching route
  const matchedRoute = routes.find((r) => {
    if (route === r.path) return true;
    if (route && r.path.endsWith('*') && route.startsWith(r.path.slice(0, -1))) return true;
    return false;
  });

  if (matchedRoute) {
    const Component = matchedRoute.component;
    return React.createElement(Component, { windowId, data, route } as RouteProps<T>);
  }

  // Use default component if no route matches
  if (DefaultComponent) {
    return React.createElement(DefaultComponent, { windowId, data, route } as RouteProps<T>);
  }

  return fallback ?? null;
};

/**
 * Navigate to a different route (hash-based)
 */
export const navigateTo = (path: string): void => {
  window.location.hash = path;
};

/**
 * Get route parameters from current route
 * Simple implementation for basic route params
 */
export const getRouteParams = (pattern: string, currentRoute: string): Record<string, string> => {
  const patternParts = pattern.split('/');
  const routeParts = currentRoute.split('/');
  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const routePart = routeParts[i];

    if (patternPart.startsWith(':') && routePart) {
      const paramName = patternPart.slice(1);
      params[paramName] = routePart;
    }
  }

  return params;
};
