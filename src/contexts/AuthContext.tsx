import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { getCurrentUser, discordLoginUrl } from '@/lib/api';
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  AUTH_UNAUTHORIZED_EVENT,
} from '@/lib/auth';
import type { DiscordUser } from '@/types';

const DEV_NO_AUTH = import.meta.env.VITE_DEV_NO_AUTH === 'true';

interface AuthContextValue {
  user: DiscordUser | null;
  currentUserId: string | null;
  isAuthenticated: boolean;
  /** True until the initial bootstrap (token + /api/auth/user) completes. */
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Read `?token` from the URL on boot, store it, and strip it from history. */
function captureTokenFromUrl(): void {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (token) {
    setAuthToken(token);
    params.delete('token');
    const query = params.toString();
    const newUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
  }, []);

  const login = useCallback(() => {
    window.location.href = discordLoginUrl();
  }, []);

  useEffect(() => {
    captureTokenFromUrl();

    let cancelled = false;

    async function bootstrap() {
      if (DEV_NO_AUTH) {
        if (!cancelled) setIsLoading(false);
        return;
      }
      const token = getAuthToken();
      if (!token) {
        if (!cancelled) setIsLoading(false);
        return;
      }
      try {
        const me = await getCurrentUser();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) {
          clearAuthToken();
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void bootstrap();

    const onUnauthorized = () => {
      if (!cancelled) setUser(null);
    };
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);

    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const currentUserId = user?.id ? String(user.id) : null;
    return {
      user,
      currentUserId,
      isAuthenticated: DEV_NO_AUTH || user !== null,
      isLoading,
      login,
      logout,
    };
  }, [user, isLoading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
