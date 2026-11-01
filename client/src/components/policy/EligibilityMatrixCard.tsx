import { CheckCircle2, XCircle, AlertTriangle, Sparkles, BookOpen } from 'lucide-react';
import type { PolicyExplainerDto } from '../../types/policy.types';

interface EligibilityMatrixCardProps {
  explainer: PolicyExplainerDto;
}

export function EligibilityMatrixCard({ explainer }: EligibilityMatrixCardProps) {
  const verdictConfig = {
    ELIGIBLE: {
      label: 'Fully eligible',
      badgeClass: 'badge-settled',
      icon: CheckCircle2,
    },
    INELIGIBLE: {
      label: 'Not eligible',
      badgeClass: 'border-rule bg-paper text-muted',
      icon: XCircle,
    },
    PARTIAL_MATCH: {
      label: 'Partial match / conditional',
      badgeClass: 'badge-accent',
      icon: AlertTriangle,
    },
  }[explainer.eligibility_status] || {
    label: explainer.eligibility_status.toLowerCase(),
    badgeClass: 'badge',
    icon: Sparkles,
  };

  const VerdictIcon = verdictConfig.icon;

  return (
    <div className="surface p-5 sm:p-6 space-y-5">
      {/* Header & Verdict */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-rule pb-4">
        <div>
          <h3 className="font-display text-base sm:text-lg font-semibold text-ink">
            Eligibility evaluation and rights matrix
          </h3>
          <p className="font-body text-xs text-muted mt-0.5">
            Persona: <span className="font-medium text-ink">{explainer.persona_type.toLowerCase()}</span> · Language: {explainer.language_code}
          </p>
        </div>

        <div className={`badge ${verdictConfig.badgeClass}`}>
          <VerdictIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{verdictConfig.label}</span>
        </div>
      </div>

      {/* Plain Language Summary on Letter-folded sheet */}
      <div className="surface-sheet p-4 space-y-1.5 border-l-2 border-l-ink">
        <div className="flex items-center gap-2 text-xs font-medium text-ink">
          <BookOpen className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
          <span>Plain-language gazette summary</span>
        </div>
        <p className="font-body text-xs sm:text-sm text-ink leading-relaxed">
          {explainer.plain_language_summary}
        </p>
      </div>

      {/* Eligibility Matrix Criteria as Ruled Rows */}
      {explainer.eligibility_evaluation && explainer.eligibility_evaluation.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-body text-xs font-medium text-muted">
            Statutory criteria checklist
          </h4>
          <div className="ruled bg-paper border border-rule rounded-pill overflow-hidden">
            {explainer.eligibility_evaluation.map((evalItem, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 text-xs">
                <div className="space-y-0.5 max-w-md">
                  <span className="font-medium text-ink">{evalItem.rule}</span>
                  <div className="font-body text-[11px] text-muted">
                    Your profile value: <span className="font-mono text-ink">{evalItem.citizen_value}</span>
                  </div>
                  {evalItem.citation && (
                    <div className="font-body text-[11px] text-muted">
                      Citation: {evalItem.citation}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {evalItem.passed ? (
                    <span className="badge-settled">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Met
                    </span>
                  ) : (
                    <span className="badge">
                      <XCircle className="h-3 w-3 text-muted" aria-hidden="true" /> Not met
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EligibilityMatrixCard;
