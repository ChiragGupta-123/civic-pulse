import { create } from 'zustand';
import type { RegionalLanguageCode } from '../types/common.types';

interface PreferencesState {
  language: RegionalLanguageCode;
  setLanguage: (lang: RegionalLanguageCode) => void;
}

const STORAGE_KEY = 'civic_pulse_preferences';

function loadLanguage(): RegionalLanguageCode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 'hi-IN';
    const parsed = JSON.parse(raw);
    return parsed.language ?? 'hi-IN';
  } catch {
    return 'hi-IN';
  }
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  language: loadLanguage(),
  setLanguage: (language) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ language }));
    set({ language });
  },
}));

