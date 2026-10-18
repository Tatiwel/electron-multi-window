/**
 * Hash routes shared by the main process and the renderer. Every window loads
 * the same `index.html`; the hash after `#` says which screen it shows.
 * This file must stay free of Electron, Node and DOM imports so that every
 * side can bundle it.
 *
 * Paths always start with '/'. A pattern segment starting with ':' is a
 * parameter; parameter values are limited to [A-Za-z0-9_-].
 */

export const ROUTES = {
  home: '/',
  message: '/message/:id',
} as const;

export type RoutePattern = (typeof ROUTES)[keyof typeof ROUTES];

export type RouteParams = Record<string, string>;

export type ResolvedRoute = { pattern: RoutePattern; params: RouteParams };

const PARAM_VALUE = /^[A-Za-z0-9_-]+$/;

const PATTERNS = Object.values(ROUTES) as RoutePattern[];

const splitPath = (path: string) => path.split('/').slice(1);

/**
 * Matches `path` against `pattern`. Returns the parameters on a match
 * ('/message/:id' vs '/message/abc' → { id: 'abc' }), otherwise null.
 */
export function matchRoute(
  pattern: RoutePattern,
  path: string
): RouteParams | null {
  if (!path.startsWith('/')) {
    return null;
  }
  if (pattern === '/' || path === '/') {
    return pattern === path ? {} : null;
  }

  const patternSegments = splitPath(pattern);
  const pathSegments = splitPath(path);
  if (patternSegments.length !== pathSegments.length) {
    return null;
  }

  const params: RouteParams = {};
  for (let i = 0; i < patternSegments.length; i++) {
    const expected = patternSegments[i];
    const actual = pathSegments[i];
    if (actual === '') {
      return null;
    }
    if (expected.startsWith(':')) {
      if (!PARAM_VALUE.test(actual)) {
        return null;
      }
      params[expected.slice(1)] = actual;
    } else if (expected !== actual) {
      return null;
    }
  }
  return params;
}

/** Tries every known pattern; null when `path` matches none. */
export function resolveRoute(path: string): ResolvedRoute | null {
  for (const pattern of PATTERNS) {
    const params = matchRoute(pattern, path);
    if (params !== null) {
      return { pattern, params };
    }
  }
  return null;
}

/**
 * Fills the parameters of `pattern` ('/message/:id' + { id: 'abc' } →
 * '/message/abc'). Throws on a missing or invalid parameter value.
 */
export function buildRoute(pattern: RoutePattern, params: RouteParams = {}) {
  if (pattern === '/') {
    return pattern;
  }
  return (
    '/' +
    splitPath(pattern)
      .map((segment) => {
        if (!segment.startsWith(':')) {
          return segment;
        }
        const name = segment.slice(1);
        const value = Object.prototype.hasOwnProperty.call(params, name)
          ? params[name]
          : undefined;
        if (value === undefined || !PARAM_VALUE.test(value)) {
          throw new Error(`Invalid value for route parameter "${name}".`);
        }
        return value;
      })
      .join('/')
  );
}
