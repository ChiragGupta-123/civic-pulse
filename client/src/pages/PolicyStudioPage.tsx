import { useState } from 'react';
import {
  FileText,
  Search,
  Upload,
  Sparkles,
  ChevronRight,
  BookOpen,
  User,
  Building2,
  FileCheck2,
} from 'lucide-react';
import { policyApi } from '../api/policy.api';
import { useAsyncData } from '../hooks/useAsyncData';
import { usePreferencesStore } from '../stores/preferences.store';
import { PolicyUploadModal } from '../components/policy/PolicyUploadModal';
import { EligibilityMatrixCard } from '../components/policy/EligibilityMatrixCard';
import { RegionalVoicePlayer } from '../components/policy/RegionalVoicePlayer';
import { showToast } from '../components/feedback/ToastContainer';
import type { PolicySummaryDto, PolicyExplainerDto } from '../types/policy.types';

export function PolicyStudioPage() {
  const { language } = usePreferencesStore();

  const [search, setSearch] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('ALL');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [selectedPolicy, setSelectedPolicy] = useState<PolicySummaryDto | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<'CITIZEN' | 'SMALL_BUSINESS'>('CITIZEN');
  const [explainer, setExplainer] = useState<PolicyExplainerDto | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  // Fetch policies
  const { data: policies, status, refetch } = useAsyncData<PolicySummaryDto[]>(
    async () => {
      const res = await policyApi.listPolicies({
        search: search.trim() || undefined,
        doc_type: docTypeFilter !== 'ALL' ? docTypeFilter : undefined,
      });
      return res.data || [];
    },
    [search, docTypeFilter]
  );

  const handleSelectPolicy = (policy: PolicySummaryDto) => {
    setSelectedPolicy(policy);
    setExplainer(null);
  };

  const handleGenerateExplainer = async () => {
    if (!selectedPolicy) return;
    setIsExplaining(true);

    try {
      const res = await policyApi.explainPolicy(selectedPolicy.id, {
        language_code: language,
        persona_type: selectedPersona,
        citizen_profile: {
          occupation: 'Student / Farmer',
          annual_income: 180000,
          state: 'Delhi',
          category: 'General',
          is_msme: selectedPersona === 'SMALL_BUSINESS',
        },
      });

      if (res.data) {
        setExplainer(res.data);
        showToast('Personalized policy explainer generated', 'success');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to generate explainer';
      showToast(msg, 'error');
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="container-page py-8 space-y-6 animate-fade-up">
      <PolicyUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploaded={(newPolicy) => {
          refetch();
          setSelectedPolicy(newPolicy);
        }}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-rule pb-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            Multilingual policy studio
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="badge">Pillar 1 · Notification intelligence</span>
            <p className="font-body text-xs sm:text-sm text-muted">
              Break down official government circulars into citizen-friendly summaries, assess eligibility against your vault, and generate regional audio.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsUploadModalOpen(true)}
          className="btn-primary self-start sm:self-auto"
        >
          <Upload className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Upload gazette PDF</span>
        </button>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Policy Search & Catalog */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search & Filter Bar */}
          <div className="surface p-3 space-y-2.5">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-muted absolute left-3 top-3.5" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search gazettes, schemes, circulars…"
                className="input-modern pl-9"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { code: 'ALL', label: 'All policies' },
                { code: 'GOVT_NOTIFICATION', label: 'Government notification' },
                { code: 'SCHEME_GUIDELINE', label: 'Scheme guideline' },
                { code: 'CIRCULAR', label: 'Circular' },
              ].map((dt) => (
                <button
                  key={dt.code}
                  type="button"
                  onClick={() => setDocTypeFilter(dt.code)}
                  className={`rounded-pill px-3 py-1 font-body text-xs font-medium whitespace-nowrap transition-colors ${
                    docTypeFilter === dt.code
                      ? 'bg-ink text-paper-2 font-semibold'
                      : 'border border-rule bg-paper-2 text-muted hover:bg-paper-3 hover:text-ink'
                  }`}
                >
                  {dt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Policy Catalog List as Ruled Docket */}
          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {status === 'loading' && (
              <div className="surface p-8 text-center text-xs text-muted">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-rule border-t-ink mb-2" />
                <p>Loading policy gazettes…</p>
              </div>
            )}

            {status === 'empty' && (
              <div className="surface p-8 text-center text-xs text-muted">
                <FileText className="h-7 w-7 text-muted mx-auto mb-2 opacity-60" aria-hidden="true" />
                <p className="font-semibold text-ink">No policy documents found</p>
                <p className="text-muted mt-0.5">Try a different search query or upload a new PDF.</p>
              </div>
            )}

            {policies?.map((policy) => {
              const isSelected = selectedPolicy?.id === policy.id;
              return (
                <div
                  key={policy.id}
                  onClick={() => handleSelectPolicy(policy)}
                  className={`surface p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-ink bg-paper-3 shadow-card'
                      : 'hover:border-ink hover:bg-paper-3'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="badge">
                      {policy.reference_code}
                    </span>
                    <span className="badge">
                      {policy.doc_type.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>

                  <h3 className="font-display text-sm font-semibold text-ink mt-1.5 line-clamp-2">
                    {policy.title}
                  </h3>

                  <p className="font-body text-xs text-muted mt-1 flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 shrink-0 text-muted" aria-hidden="true" />
                    <span className="truncate">{policy.issuing_body}</span>
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-rule pt-2 text-xs text-muted">
                    <span className="font-mono text-[11px]">{policy.clause_count} clauses</span>
                    <span className="text-ink font-medium flex items-center gap-0.5">
                      Select <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Explainer Viewer & Eligibility Evaluation */}
        <div className="lg:col-span-7 space-y-4">
          {selectedPolicy ? (
            <div className="space-y-4 animate-fade-up">
              {/* Selected Policy Overview Header */}
              <div className="surface p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-rule pb-2.5">
                  <span className="badge">
                    Selection: {selectedPolicy.reference_code}
                  </span>
                  <span className="font-body text-xs text-muted">
                    Target: {selectedPolicy.target_group.toLowerCase()}
                  </span>
                </div>

                <div>
                  <h2 className="font-display text-lg font-semibold text-ink">
                    {selectedPolicy.title}
                  </h2>
                  <p className="font-body text-xs text-muted mt-0.5">
                    Issuing authority: {selectedPolicy.issuing_body}
                  </p>
                </div>

                {/* Persona Selector & Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-rule">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-xs text-muted font-medium">Persona:</span>
                    <div className="flex gap-1 rounded-pill border border-rule p-0.5 bg-paper">
                      <button
                        type="button"
                        onClick={() => setSelectedPersona('CITIZEN')}
                        className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-medium transition-colors ${
                          selectedPersona === 'CITIZEN'
                            ? 'bg-paper-2 text-ink shadow-subtle font-semibold'
                            : 'text-muted hover:text-ink'
                        }`}
                      >
                        <User className="h-3 w-3" aria-hidden="true" /> Citizen
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPersona('SMALL_BUSINESS')}
                        className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-medium transition-colors ${
                          selectedPersona === 'SMALL_BUSINESS'
                            ? 'bg-paper-2 text-ink shadow-subtle font-semibold'
                            : 'text-muted hover:text-ink'
                        }`}
                      >
                        <Building2 className="h-3 w-3" aria-hidden="true" /> Small business (MSME)
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateExplainer}
                    disabled={isExplaining}
                    className="btn-primary"
                  >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{isExplaining ? 'Synthesizing…' : 'Generate explainer'}</span>
                  </button>
                </div>
              </div>

              {/* Vernacular Audio Synthesizer Player */}
              {explainer && (
                <RegionalVoicePlayer
                  audioUrl={explainer.audio_explainer_url}
                  durationSec={explainer.audio_duration_sec}
                  languageCode={explainer.language_code}
                  policyTitle={selectedPolicy.title}
                />
              )}

              {/* Explainer Result & Eligibility Matrix */}
              {explainer ? (
                <EligibilityMatrixCard explainer={explainer} />
              ) : (
                <div className="surface p-10 text-center text-muted space-y-2">
                  <BookOpen className="h-7 w-7 text-muted mx-auto opacity-60" aria-hidden="true" />
                  <p className="font-semibold text-ink text-sm">
                    Ready to generate explainer
                  </p>
                  <p className="font-body text-xs text-muted max-w-sm mx-auto">
                    Click “Generate explainer” above to personalize this notification, assess eligibility against your vault, and produce neural voice audio in your selected language.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* No Policy Selected Empty State */
            <div className="surface p-12 text-center text-muted space-y-3">
              <FileCheck2 className="h-9 w-9 text-muted mx-auto opacity-60" aria-hidden="true" />
              <div>
                <p className="font-semibold text-ink text-sm">
                  Select a policy from the catalog
                </p>
                <p className="font-body text-xs text-muted mt-1 max-w-sm mx-auto">
                  Choose any government notification or circular on the left to inspect ingested legal clauses, rights entitlements, and personalized benefits.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PolicyStudioPage;
