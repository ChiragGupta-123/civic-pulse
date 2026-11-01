import { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { useLiveTaskStore } from '../../stores/liveTask.store';
import { agentApi } from '../../api/agent.api';
import { showToast } from '../feedback/ToastContainer';

export function HitlObstacleModal() {
  const { activeRunId, hitlRequired, hitlPrompt, hitlScreenshotUrl, clearHitl } = useLiveTaskStore();
  const [userInput, setUserInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!hitlRequired || !activeRunId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    setIsSubmitting(true);
    try {
      await agentApi.submitHitl(activeRunId, {
        obstacle_type: 'OTP',
        user_input: userInput.trim(),
      });
      showToast('Verification code supplied. Agent resumed.', 'success');
      clearHitl();
      setUserInput('');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to submit verification';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="w-full max-w-md surface p-6 sm:p-7 space-y-4 animate-fade-up shadow-lift border-t-4 border-t-accent">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-pill bg-paper-3 text-ink">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-ink">
                SMS and Aadhaar OTP verification
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={clearHitl}
            className="rounded-pill p-1 text-muted hover:bg-paper-3 hover:text-ink"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Prompt details */}
        <div className="rounded-pill border border-rule bg-paper p-3.5 space-y-1 text-xs text-ink">
          <p className="font-semibold">{hitlPrompt || 'Portal requires 6-digit one-time password'}</p>
          <p className="text-[11px] text-muted">
            Check your mobile device or use test code <code className="font-mono font-semibold bg-paper-2 px-1 py-0.5 rounded border border-rule">998877</code> in dev mode.
          </p>
        </div>

        {/* Obstacle screenshot if available */}
        {hitlScreenshotUrl && (
          <div className="rounded-card overflow-hidden border border-rule max-h-40 bg-paper-3">
            <img
              src={hitlScreenshotUrl}
              alt="Government portal verification obstacle"
              className="w-full h-full object-contain"
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted">Verification code *</label>
            <input
              type="text"
              required
              autoFocus
              maxLength={10}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="e.g. 998877"
              className="input-modern font-mono text-center tracking-widest text-base"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-rule pt-3">
            <button
              type="button"
              onClick={clearHitl}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              Dismiss
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Relaying code…' : 'Submit and resume'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HitlObstacleModal;
