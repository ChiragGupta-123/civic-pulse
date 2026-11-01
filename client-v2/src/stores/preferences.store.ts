import { create } from 'zustand';

export interface LanguageOption {
  code: string;
  label: string;
  english: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en-IN', label: 'English', english: 'English' },
  { code: 'hi-IN', label: 'हिन्दी', english: 'Hindi' },
  { code: 'ta-IN', label: 'தமிழ்', english: 'Tamil' },
  { code: 'mr-IN', label: 'मराठी', english: 'Marathi' },
  { code: 'te-IN', label: 'తెలుగు', english: 'Telugu' },
  { code: 'bn-IN', label: 'বাংলা', english: 'Bengali' },
];

const LANGUAGE_KEY = 'cp.language';

function readLanguage(): string {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_KEY);
    if (stored && LANGUAGES.some((language) => language.code === stored)) return stored;
  } catch {
    /* fall through to default */
  }
  return 'en-IN';
}

interface PreferencesState {
  language: string;
  setLanguage: (code: string) => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  language: readLanguage(),
  setLanguage: (code) => {
    if (!LANGUAGES.some((language) => language.code === code)) return;
    try {
      window.localStorage.setItem(LANGUAGE_KEY, code);
    } catch {
      /* the selection still applies for this session */
    }
    set({ language: code });
  },
}));
