import { create } from 'zustand';
import type { UserDto } from '../types/identity.types';

interface AuthState {
  token: string | null;
  user: UserDto | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserDto) => void;
  updateUser: (user: Partial<UserDto>) => void;
  clearAuth: () => void;
}

const STORAGE_KEY = 'civic_pulse_auth';

function loadPersistedState(): { token: string | null; user: UserDto | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    const parsed = JSON.parse(raw);
    return { token: parsed.token ?? null, user: parsed.user ?? null };
  } catch {
    return { token: null, user: null };
  }
}

const initial = loadPersistedState();

export const useAuthStore = create<AuthState>((set) => ({
  token: initial.token,
  user: initial.user,
  isAuthenticated: Boolean(initial.token && initial.user),

  setAuth: (token, user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
    set({ token, user, isAuthenticated: true });
  },

  updateUser: (updates) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...updates };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ token: state.token, user: updatedUser })
      );
      return { user: updatedUser };
    });
  },

  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ token: null, user: null, isAuthenticated: false });
  },
}));

