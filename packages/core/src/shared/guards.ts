import type { WindowRoutePayload } from './types.js';

// Runtime guards for payloads coming over IPC. Kept deliberately small; the
// package does not need a validation library.

export const isObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null;

export const isNonEmptyString = (x: unknown): x is string =>
  typeof x === 'string' && x.length > 0;

export const isWindowRoutePayload = (x: unknown): x is WindowRoutePayload =>
  isObject(x) && typeof x.route === 'string' && x.route.startsWith('/');
