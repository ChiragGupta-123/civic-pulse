import { create } from 'zustand';

export interface LiveTaskState {
  activeRunId: string | null;
  activeRunStatus: string | null;
  hitlRequired: boolean;
  hitlPrompt: string | null;
  hitlScreenshotUrl: string | null;
  setActiveRun: (runId: string | null, status?: string | null) => void;
  setHitlRequired: (prompt: string | null, screenshotUrl: string | null) => void;
  clearHitl: () => void;
}

export const useLiveTaskStore = create<LiveTaskState>((set) => ({
  activeRunId: null,
  activeRunStatus: null,
  hitlRequired: false,
  hitlPrompt: null,
  hitlScreenshotUrl: null,

  setActiveRun: (activeRunId, activeRunStatus = null) => {
    set({ activeRunId, activeRunStatus });
  },

  setHitlRequired: (hitlPrompt, hitlScreenshotUrl) => {
    set({
      hitlRequired: true,
      hitlPrompt,
      hitlScreenshotUrl,
      activeRunStatus: 'WAITING_FOR_HITL',
    });
  },

  clearHitl: () => {
    set({
      hitlRequired: false,
      hitlPrompt: null,
      hitlScreenshotUrl: null,
    });
  },
}));

