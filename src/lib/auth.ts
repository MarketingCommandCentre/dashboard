const TOKEN_KEY = 'msa_jwt';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Ignore storage failures (private mode / quota).
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore.
  }
}

/**
 * Fired when the API client receives a 401/403. The AuthContext listens for
 * this to clear the token and show the login screen.
 */
export const AUTH_UNAUTHORIZED_EVENT = 'msa:auth-unauthorized';

export function emitUnauthorized(): void {
  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
}
