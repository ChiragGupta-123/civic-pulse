import { create } from 'zustand';
import { setAuthToken } from '@/api/httpClient';
import { fetchCurrentUser, loginRequest } from '@/api/identity.api';
import type { UserDto } from '@/types/identity.types';

const TOKEN_KEY = 'cp.auth.token';

type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'anonymous';

interface AuthState {
  token: string | null;
  user: UserDto | null;
  status: AuthStatus;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  bootstrap: () => Promise<void>;
}

function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

const initialToken = readStoredToken();
setAuthToken(initialToken);

export const useAuthStore = create<AuthState>((set, get) => ({
  token: initialToken,
  user: null,
  status: initialToken ? 'checking' : 'anonymous',
  error: null,

  login: async (email, password) => {
    set({ error: null });
    try {
      const response = await loginRequest({ email, password });
      window.localStorage.setItem(TOKEN_KEY, response.access_token);
      setAuthToken(response.access_token);
      set({ token: response.access_token, user: response.user, status: 'authenticated', error: null });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed.';
      set({ status: 'anonymous', token: null, user: null, error: message });
      return false;
    }
  },

  logout: () => {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage may be unavailable; the in-memory session still ends */
    }
    setAuthToken(null);
    set({ token: null, user: null, status: 'anonymous', error: null });
  },

  bootstrap: async () => {
    if (!get().token) {
      set({ status: 'anonymous' });
      return;
    }
    try {
      const response = await fetchCurrentUser();
      set({ user: response.data, status: 'authenticated' });
    } catch {
      get().logout();
    }
  },
}));
