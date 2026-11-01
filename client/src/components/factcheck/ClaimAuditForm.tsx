import { useState } from 'react';
import { Upload } from 'lucide-react';
import { factcheckApi } from '../../api/factcheck.api';
import { showToast } from '../feedback/ToastContainer';
import type { ForensicAuditReportDto } from '../../types/factcheck.types';

interface ClaimAuditFormProps {
  onAuditComplete: (report: ForensicAuditReportDto) => void;
}

export function ClaimAuditForm({ onAuditComplete }: ClaimAuditFormProps) {
  const [claimText, setClaimText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      if (file.type.startsWith('image/')) {
        setMediaPreview(URL.createObjectURL(file));
      } else {
        setMediaPreview(null);
      }
    }
  };

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimText.trim()) {
      showToast('Please enter the statement or claim to audit.', 'error');
      return;
    }

    setIsAuditing(true);
    const fd = new FormData();
    fd.append('claim_text', claimText.trim());
    if (sourceUrl.trim()) {
      fd.append('source_url', sourceUrl.trim());
    }
    if (mediaFile) {
      fd.append('media_file', mediaFile);
    }

    try {
      const res = await factcheckApi.auditClaim(fd);
      if (res.data) {
        onAuditComplete(res.data);
        showToast('Forensic audit and truth cross-examination complete', 'success');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Audit failed';
      showToast(msg, 'error');
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="surface p-5 sm:p-6 space-y-5">
      <div className="border-b border-rule pb-4">
        <h3 className="font-display text-base sm:text-lg font-semibold text-ink">
          Audit public claim and media provenance
        </h3>
        <p className="font-body text-xs text-muted mt-1">
          Cross-examines claims against official gazettes, verifies C2PA Content Credentials, and computes Error Level Analysis (ELA) deepfake heatmaps.
        </p>
      </div>

      <form onSubmit={handleAudit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-muted">Claim statement *</label>
          <textarea
            rows={3}
            required
            value={claimText}
            onChange={(e) => setClaimText(e.target.value)}
            placeholder="Paste viral claim, quote, circular text, or policy rumor to verify…"
            className="input-modern"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted">Claim source URL (optional)</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://t.me/... or https://x.com/..."
              className="input-modern"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted">Media asset to audit (image / video keyframe)</label>
            <div className="flex items-center gap-2">
              <label className="btn-secondary flex-1 cursor-pointer truncate">
                <Upload className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{mediaFile ? mediaFile.name : 'Attach media asset'}</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {mediaFile && (
                <button
                  type="button"
                  onClick={() => {
                    setMediaFile(null);
                    setMediaPreview(null);
                  }}
                  className="btn-ghost text-xs text-accent"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {mediaPreview && (
          <div className="rounded-card overflow-hidden border border-rule h-32 bg-paper-3 w-48">
            <img
              src={mediaPreview}
              alt="Media preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-rule">
          <button
            type="submit"
            disabled={isAuditing}
            className="btn-primary w-full sm:w-auto"
          >
            {isAuditing ? 'Auditing and computing ELA…' : 'Run forensic audit'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ClaimAuditForm;
