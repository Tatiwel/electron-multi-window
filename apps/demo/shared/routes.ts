/**
 * Hash routes of the demo, shared by the main process and the renderer. The
 * matching itself is `createRoutes` from `@electron-multi-window/core`.
 */
import {
  createRoutes,
  type ResolvedRoute as CoreResolvedRoute,
} from '@electron-multi-window/core/shared';

export const ROUTES = {
  home: '/',
  message: '/message/:id',
} as const;

export type RoutePattern = (typeof ROUTES)[keyof typeof ROUTES];

export type ResolvedRoute = CoreResolvedRoute<RoutePattern>;

export const routes = createRoutes(ROUTES);

export const { matchRoute, resolveRoute, buildRoute } = routes;
