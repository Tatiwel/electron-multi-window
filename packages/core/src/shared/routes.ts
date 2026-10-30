/**
 * Hash routes. Every window loads the same `index.html`; the hash after `#`
 * says which screen it shows.
 *
 * Paths always start with '/'. A pattern segment starting with ':' is a
 * parameter; parameter values are limited to [A-Za-z0-9_-].
 */

export type RouteParams = Record<string, string>;

export interface ResolvedRoute<P extends string = string> {
  pattern: P;
  params: RouteParams;
}

export interface Routes<P extends string = string> {
  /** Every registered pattern, in the order they were defined. */
  patterns: readonly P[];
  /**
   * Matches `path` against `pattern`. Returns the parameters on a match
   * ('/message/:id' vs '/message/abc' → { id: 'abc' }), otherwise null.
   */
  matchRoute: (pattern: P, path: string) => RouteParams | null;
  /** Tries every registered pattern; null when `path` matches none. */
  resolveRoute: (path: string) => ResolvedRoute<P> | null;
  /**
   * Fills the parameters of `pattern` ('/message/:id' + { id: 'abc' } →
   * '/message/abc'). Throws on a missing or invalid parameter value.
   */
  buildRoute: (pattern: P, params?: RouteParams) => string;
}

const PARAM_VALUE = /^[A-Za-z0-9_-]+$/;

const splitPath = (path: string) => path.split('/').slice(1);

const matchPattern = (pattern: string, path: string): RouteParams | null => {
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
};

const fillPattern = (pattern: string, params: RouteParams) => {
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
};

/**
 * Builds the route helpers for a set of named patterns, such as
 * `{ home: '/', message: '/message/:id' }`. Throws when a pattern does not
 * start with '/'.
 */
export function createRoutes<const D extends Record<string, string>>(
  definitions: D
): Routes<D[keyof D]> {
  type P = D[keyof D];
  const patterns = Object.values(definitions) as P[];
  for (const pattern of patterns) {
    if (!pattern.startsWith('/')) {
      throw new Error(`Route pattern "${pattern}" must start with "/".`);
    }
  }

  const resolveRoute = (path: string): ResolvedRoute<P> | null => {
    for (const pattern of patterns) {
      const params = matchPattern(pattern, path);
      if (params !== null) {
        return { pattern, params };
      }
    }
    return null;
  };

  return {
    patterns,
    matchRoute: matchPattern,
    resolveRoute,
    buildRoute: (pattern, params = {}) => fillPattern(pattern, params),
  };
}
