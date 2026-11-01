import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { useAuthStore } from '../stores/auth.store';
import { usePreferencesStore } from '../stores/preferences.store';
import { useLiveTaskStore } from '../stores/liveTask.store';
import type { UserDto } from '../types/identity.types';

// In-memory localStorage mock for node test environment
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

describe('Zustand Client Stores', () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: storageMock,
      writable: true,
    });
  });

  beforeEach(() => {
    globalThis.localStorage.clear();
    useAuthStore.getState().clearAuth();
    useLiveTaskStore.getState().clearHitl();
    useLiveTaskStore.getState().setActiveRun(null);
  });

  it('manages auth store state and local storage persistence', () => {
    const mockUser: UserDto = {
      id: 'u-123',
      email: 'citizen@example.com',
      full_name: 'Rajesh Kumar',
      role: 'CITIZEN',
      preferred_language: 'hi-IN',
    };

    useAuthStore.getState().setAuth('mock-jwt-token-xyz', mockUser);

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().token).toBe('mock-jwt-token-xyz');
    expect(useAuthStore.getState().user?.full_name).toBe('Rajesh Kumar');

    // Update user profile
    useAuthStore.getState().updateUser({ full_name: 'Rajesh Sharma' });
    expect(useAuthStore.getState().user?.full_name).toBe('Rajesh Sharma');

    // Clear auth
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('manages regional language preferences in preferences store', () => {
    expect(usePreferencesStore.getState().language).toBeDefined();

    usePreferencesStore.getState().setLanguage('ta-IN');
    expect(usePreferencesStore.getState().language).toBe('ta-IN');

    usePreferencesStore.getState().setLanguage('mr-IN');
    expect(usePreferencesStore.getState().language).toBe('mr-IN');
  });

  it('manages live task execution and HITL prompt state', () => {
    const liveTask = useLiveTaskStore.getState();
    expect(liveTask.activeRunId).toBeNull();
    expect(liveTask.hitlRequired).toBe(false);

    useLiveTaskStore.getState().setActiveRun('run-uuid-456', 'RUNNING');
    expect(useLiveTaskStore.getState().activeRunId).toBe('run-uuid-456');
    expect(useLiveTaskStore.getState().activeRunStatus).toBe('RUNNING');

    useLiveTaskStore.getState().setHitlRequired('Enter 6-digit SMS OTP', 'https://example.com/captcha.png');
    expect(useLiveTaskStore.getState().hitlRequired).toBe(true);
    expect(useLiveTaskStore.getState().hitlPrompt).toBe('Enter 6-digit SMS OTP');
    expect(useLiveTaskStore.getState().hitlScreenshotUrl).toBe('https://example.com/captcha.png');
    expect(useLiveTaskStore.getState().activeRunStatus).toBe('WAITING_FOR_HITL');

    useLiveTaskStore.getState().clearHitl();
    expect(useLiveTaskStore.getState().hitlRequired).toBe(false);
    expect(useLiveTaskStore.getState().hitlPrompt).toBeNull();
  });
});
