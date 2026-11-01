import { CheckCircle2, AlertTriangle, XCircle, ShieldAlert, HelpCircle } from 'lucide-react';
import type { FactCheckVerdict } from '../../types/factcheck.types';

interface CredibilityScoreDialProps {
  credibilityRating: number;
  verdict: FactCheckVerdict;
  confidenceScore: number;
}

const VERDICT_MAP: Record<
  FactCheckVerdict,
  { label: string; badgeClass: string; icon: any; summary: string }
> = {
  VERIFIED_TRUE: {
    label: 'Verified true',
    badgeClass: 'badge-settled',
    icon: CheckCircle2,
    summary: 'Corroborated by official government gazettes and trusted registry facts.',
  },
  MISLEADING: {
    label: 'Misleading context',
    badgeClass: 'badge-accent',
    icon: AlertTriangle,
    summary: 'Contains partial truths mixed with outdated, misattributed, or inaccurate context.',
  },
  FALSE_CLAIM: {
    label: 'False information',
    badgeClass: 'border-rule bg-paper text-ink',
    icon: XCircle,
    summary: 'Directly contradicted by official statutory sources and canonical fact registries.',
  },
  SYNTHETIC_OR_MANIPULATED: {
    label: 'Manipulated / deepfake media',
    badgeClass: 'border-accent bg-accent-soft text-ink',
    icon: ShieldAlert,
    summary: 'High probability of synthetic generative AI manipulation or spliced media assets.',
  },
  UNVERIFIED: {
    label: 'Unverified claim',
    badgeClass: 'badge',
    icon: HelpCircle,
    summary: 'Insufficient official evidence available to issue an authoritative determination.',
  },
};

export function CredibilityScoreDial({
  credibilityRating,
  verdict,
  confidenceScore,
}: CredibilityScoreDialProps) {
  const conf = VERDICT_MAP[verdict] || VERDICT_MAP.UNVERIFIED;
  const VerdictIcon = conf.icon;

  // SVG circular arc calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (credibilityRating / 100) * circumference;

  const getDialColor = (score: number) => {
    if (score >= 80) return 'oklch(48% 0.11 150)'; // Green
    if (score >= 50) return 'oklch(70% 0.19 40)'; // Tangerine
    return 'oklch(18% 0.006 60)'; // Ink
  };

  return (
    <div className="surface p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-rule pb-4">
        <div>
          <h4 className="font-display text-base sm:text-lg font-semibold text-ink">
            Algorithmic truth verification and credibility score
          </h4>
        </div>

        <div className={`badge ${conf.badgeClass}`}>
          <VerdictIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{conf.label}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* SVG Circular Dial */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="h-28 w-28 -rotate-90 transform" aria-label={`Credibility score dial: ${credibilityRating} out of 100`}>
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke="oklch(88% 0.013 85)"
              strokeWidth="7"
              fill="transparent"
            />
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke={getDialColor(credibilityRating)}
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{ transition: 'stroke-dashoffset 800ms ease-out' }}
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="font-mono text-2xl font-semibold text-ink">
              {credibilityRating}
            </span>
            <span className="font-body text-[10px] text-muted">
              / 100
            </span>
          </div>
        </div>

        {/* Verdict Explanation & Confidence */}
        <div className="space-y-2 flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-display text-base font-semibold text-ink">
              {conf.label}
            </span>
            <span className="badge">
              Confidence: {confidenceScore}%
            </span>
          </div>

          <p className="font-body text-xs sm:text-sm text-muted leading-relaxed">
            {conf.summary}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CredibilityScoreDial;
