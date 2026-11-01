import { useState } from 'react';
import {
  ShieldCheck,
  History,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';
import { ClaimAuditForm } from '../components/factcheck/ClaimAuditForm';
import { CredibilityScoreDial } from '../components/factcheck/CredibilityScoreDial';
import { ForensicHeatmapViewer } from '../components/factcheck/ForensicHeatmapViewer';
import { ProvenanceTimeline } from '../components/factcheck/ProvenanceTimeline';
import { factcheckApi } from '../api/factcheck.api';
import { useAsyncData } from '../hooks/useAsyncData';
import { useAuthStore } from '../stores/auth.store';
import { showToast } from '../components/feedback/ToastContainer';
import type { ForensicAuditReportDto } from '../types/factcheck.types';

export function FactVerificationPage() {
  const { user, isAuthenticated } = useAuthStore();
  const isOfficerOrAdmin = isAuthenticated && (user?.role === 'OFFICER' || user?.role === 'ADMIN');

  const [activeTab, setActiveTab] = useState<'AUDIT' | 'FEED' | 'REGISTRY'>('AUDIT');
  const [currentReport, setCurrentReport] = useState<ForensicAuditReportDto | null>(null);

  // Officer canonical fact form state
  const [refCode, setRefCode] = useState('');
  const [canonicalFact, setCanonicalFact] = useState('');
  const [authorityName, setAuthorityName] = useState('Ministry of Information & Broadcasting');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Verified claims feed
  const { data: feed, refetch: refetchFeed } = useAsyncData<any[]>(
    async () => {
      const res = await factcheckApi.listFeed();
      return res.data || [];
    },
    []
  );

  const handleRegisterFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refCode.trim() || !canonicalFact.trim()) return;

    setIsRegistering(true);
    try {
      await factcheckApi.registerTrustedFact({
        reference_code: refCode.trim(),
        canonical_fact: canonicalFact.trim(),
        authority_name: authorityName.trim(),
        source_url: sourceUrl.trim(),
      });
      showToast('Canonical truth record indexed into pgvector registry', 'success');
      setRefCode('');
      setCanonicalFact('');
      setSourceUrl('');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to register fact';
      showToast(msg, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="container-page py-8 space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-rule pb-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            Fact verification and provenance studio
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="badge">Pillar 4 · Forensics and provenance</span>
            <p className="font-body text-xs sm:text-sm text-muted">
              Cross-examine viral narratives against Veritier API, detect synthetic deepfakes via ELA forensics, and verify C2PA Content Credentials.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 rounded-pill border border-rule bg-paper-2 p-1 shrink-0 shadow-subtle">
          <button
            type="button"
            onClick={() => setActiveTab('AUDIT')}
            className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'AUDIT'
                ? 'bg-ink text-paper-2 font-semibold'
                : 'text-muted hover:text-ink hover:bg-paper-3'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Audit claim</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FEED')}
            className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'FEED'
                ? 'bg-ink text-paper-2 font-semibold'
                : 'text-muted hover:text-ink hover:bg-paper-3'
            }`}
          >
            <History className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Verified feed ({feed?.length ?? 0})</span>
          </button>

          {isOfficerOrAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('REGISTRY')}
              className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'REGISTRY'
                  ? 'bg-ink text-paper-2 font-semibold'
                  : 'text-muted hover:text-ink hover:bg-paper-3'
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Index canonical fact</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab: AUDIT */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-6">
          <ClaimAuditForm onAuditComplete={(report) => setCurrentReport(report)} />

          {currentReport && (() => {
            const audit: any = currentReport.audit_result || currentReport;
            return (
              <div className="space-y-6 animate-fade-up">
                {/* Algorithmic Determination & Score */}
                <CredibilityScoreDial
                  credibilityRating={audit.credibility_rating ?? 50}
                  verdict={audit.verdict || 'UNVERIFIED'}
                  confidenceScore={audit.confidence_score ?? 80}
                />

                {/* Media Forensics & ELA Heatmap */}
                <ForensicHeatmapViewer
                  originalMediaUrl={currentReport.media_url || currentReport.media_file_url}
                  elaHeatmapUrl={audit.ela_heatmap_url || audit.authenticity_analysis?.ela_heatmap_url}
                  c2paStatus={audit.c2pa_status || audit.authenticity_analysis?.c2pa_status || 'MANIFEST_MISSING'}
                  c2paIssuer={audit.c2pa_issuer || audit.authenticity_analysis?.c2pa_issuer}
                  syntheticProbability={audit.synthetic_probability ?? audit.authenticity_analysis?.synthetic_probability ?? 0}
                  technicalFindings={audit.technical_findings || audit.authenticity_analysis?.technical_findings || []}
                />

                {/* Provenance Chain & Citations */}
                <ProvenanceTimeline
                  citations={audit.evidence_citations || []}
                  provenanceNodes={audit.provenance_nodes || []}
                />
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab: FEED */}
      {activeTab === 'FEED' && (
        <div className="space-y-4">
          <div className="surface p-3 flex items-center justify-between">
            <span className="font-body text-xs text-muted">
              Showing {feed?.length ?? 0} audited public claims and deepfake assessments
            </span>
            <button
              type="button"
              onClick={() => refetchFeed()}
              className="btn-secondary min-h-[36px] py-1 px-3 text-xs"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
              <span>Refresh feed</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feed?.map((item: any) => {
              const audit = item.audit_result || {};
              const isManipulated = audit.verdict === 'SYNTHETIC_OR_MANIPULATED';
              const isTrue = audit.verdict === 'VERIFIED_TRUE';

              return (
                <div key={item.id} className="surface p-4 space-y-3 hover:border-ink transition-colors">
                  <div className="flex items-center justify-between">
                    <span
                      className={`badge ${
                        isTrue
                          ? 'badge-settled'
                          : isManipulated
                          ? 'badge-accent'
                          : 'badge'
                      }`}
                    >
                      {(audit.verdict || 'UNVERIFIED').replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <span className="font-mono text-xs text-muted">
                      Score: {audit.credibility_rating ?? 50}/100
                    </span>
                  </div>

                  <p className="font-body text-xs font-medium text-ink line-clamp-3">
                    "{item.claim_text}"
                  </p>

                  {item.media_url && (
                    <div className="rounded-card overflow-hidden border border-rule h-28 bg-paper-3">
                      <img
                        src={item.media_url}
                        alt="Audit media"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="border-t border-rule pt-2.5 flex items-center justify-between text-xs text-muted">
                    <span className="font-body">C2PA: {(audit.c2pa_status || 'MANIFEST_MISSING').replace(/_/g, ' ').toLowerCase()}</span>
                    <span className="font-mono text-[11px]">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: REGISTRY */}
      {activeTab === 'REGISTRY' && isOfficerOrAdmin && (
        <div className="max-w-2xl mx-auto surface p-6 sm:p-7 space-y-5">
          <div className="border-b border-rule pb-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-base sm:text-lg font-semibold text-ink">
                Index canonical government fact
              </h3>
              <span className="badge">Authority administration</span>
            </div>
            <p className="font-body text-xs text-muted mt-1">
              Persist authoritative truth assertions into the pgvector registry for automated cross-examination against citizen claims.
            </p>
          </div>

          <form onSubmit={handleRegisterFact} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted">Reference circular code *</label>
              <input
                type="text"
                required
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
                placeholder="e.g. PIB-FACT-2026-088"
                className="input-modern"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted">Canonical fact statement *</label>
              <textarea
                rows={3}
                required
                value={canonicalFact}
                onChange={(e) => setCanonicalFact(e.target.value)}
                placeholder="Clear, authoritative statement refuting false claims or confirming official policy…"
                className="input-modern"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-muted">Issuing authority *</label>
                <input
                  type="text"
                  required
                  value={authorityName}
                  onChange={(e) => setAuthorityName(e.target.value)}
                  className="input-modern"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-muted">Gazette / Official URL *</label>
                <input
                  type="url"
                  required
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://pib.gov.in/…"
                  className="input-modern"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-rule">
              <button
                type="submit"
                disabled={isRegistering}
                className="btn-primary"
              >
                {isRegistering ? 'Embedding and indexing…' : 'Publish to verified registry'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default FactVerificationPage;
