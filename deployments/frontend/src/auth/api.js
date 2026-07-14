/**
 * Returns a `fetch`-compatible function that attaches a Bearer token to every
 * request when auth is enabled. When ``config.authDisabled`` is true (matching
 * the backend's ``AUTH_DISABLED=true``), token acquisition is skipped and the
 * plain global ``fetch`` is used — the backend accepts unauthenticated requests
 * in that mode.
 *
 * @param {object} config - Runtime frontend config object.
 * @param {Function} getAccessTokenSilently - Auth0 SDK method for obtaining
 *   an access token without user interaction. Unused when ``authDisabled``.
 * @returns {Function} An async `(url, options?) => Response` fetcher.
 */
export function createAuthenticatedFetcher(config, getAccessTokenSilently) {
  if (config.authDisabled) {
    return (url, options = {}) => fetch(url, options);
  }
  return async (url, options = {}) => {
    const token = await getAccessTokenSilently({
      authorizationParams: { audience: config.auth0.audience },
    });
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(url, { ...options, headers });
  };
}
