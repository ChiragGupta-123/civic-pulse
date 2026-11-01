import { useState } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import { policyApi } from '../../api/policy.api';
import { showToast } from '../feedback/ToastContainer';
import type { PolicyDocType, PolicySummaryDto, PolicyTargetGroup } from '../../types/policy.types';

interface PolicyUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: (policy: PolicySummaryDto) => void;
}

export function PolicyUploadModal({ isOpen, onClose, onUploaded }: PolicyUploadModalProps) {
  const [title, setTitle] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [issuingBody, setIssuingBody] = useState('');
  const [docType, setDocType] = useState<PolicyDocType>('GOVT_NOTIFICATION');
  const [targetGroup, setTargetGroup] = useState<PolicyTargetGroup>('CITIZEN');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !referenceCode || !issuingBody) {
      setErrorMsg('Please fill in all required text fields.');
      return;
    }
    if (!file) {
      setErrorMsg('Please select a PDF document to upload.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('reference_code', referenceCode);
    formData.append('issuing_body', issuingBody);
    formData.append('doc_type', docType);
    formData.append('target_group', targetGroup);
    formData.append('file', file);

    try {
      const res = await policyApi.uploadPolicy(formData);
      if (res.data) {
        showToast('Policy document uploaded and indexed successfully', 'success');
        onUploaded(res.data);
        onClose();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to upload policy';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="w-full max-w-lg surface p-6 sm:p-7 space-y-4 animate-fade-up shadow-lift">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-pill bg-paper-3 text-ink">
              <Upload className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-ink">Upload gazette or policy</h3>
              <p className="font-body text-xs text-muted">PDF ingestion and clause indexing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-pill p-1 text-muted hover:bg-paper-3 hover:text-ink"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-pill border border-error bg-paper-3 p-3 text-xs text-ink" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0 text-error" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted">Document title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. National Apprenticeship Promotion Scheme Gazette"
              className="input-modern"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted">Reference code *</label>
              <input
                type="text"
                required
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                placeholder="e.g. GAZ-2026-NAPS-01"
                className="input-modern"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted">Issuing authority *</label>
              <input
                type="text"
                required
                value={issuingBody}
                onChange={(e) => setIssuingBody(e.target.value)}
                placeholder="e.g. Ministry of Skill Development"
                className="input-modern"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted">Document type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as PolicyDocType)}
                className="input-modern cursor-pointer"
              >
                <option value="GOVT_NOTIFICATION">Government notification</option>
                <option value="SCHEME_GUIDELINE">Scheme guideline</option>
                <option value="CIRCULAR">Administrative circular</option>
                <option value="GAZETTE_ACT">Statutory gazette act</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted">Target audience</label>
              <select
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value as PolicyTargetGroup)}
                className="input-modern cursor-pointer"
              >
                <option value="CITIZEN">General citizen</option>
                <option value="MSME_ENTERPRISE">Small business (MSME)</option>
                <option value="OFFICER">Municipal officer</option>
                <option value="VULNERABLE_SECTION">Vulnerable section</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted">Gazette PDF document *</label>
            <div className="rounded-pill border border-dashed border-rule p-4 text-center hover:bg-paper-3 transition-colors cursor-pointer relative">
              <input
                type="file"
                required
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-xs">
                  <span className="font-medium text-ink truncate max-w-xs">{file.name}</span>
                  <span className="badge">Change</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="h-5 w-5 mx-auto text-muted" aria-hidden="true" />
                  <p className="font-body text-xs font-medium text-ink">Click to browse or drop official gazette PDF</p>
                  <p className="font-mono text-[10px] text-muted">PDF up to 25MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-rule pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Ingesting…' : 'Upload and index'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PolicyUploadModal;
