import { Eye, ShieldAlert, CheckCircle2, AlertTriangle, Layers, Cpu } from 'lucide-react';
import type { C2paStatus } from '../../types/factcheck.types';

interface ForensicHeatmapViewerProps {
  originalMediaUrl?: string | null;
  elaHeatmapUrl?: string | null;
  c2paStatus: C2paStatus;
  c2paIssuer?: string | null;
  syntheticProbability: number;
  technicalFindings: string[];
}

export function ForensicHeatmapViewer({
  originalMediaUrl,
  elaHeatmapUrl,
  c2paStatus,
  c2paIssuer,
  syntheticProbability,
  technicalFindings,
}: ForensicHeatmapViewerProps) {
  const synthPct = Math.round(
    syntheticProbability <= 1 ? syntheticProbability * 100 : syntheticProbability
  );

  const getC2paBadge = () => {
    switch (c2paStatus) {
      case 'MANIFEST_VALID':
        return (
          <div className="badge-settled">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>C2PA valid: cryptographic hardware provenance confirmed</span>
          </div>
        );
      case 'MANIFEST_TAMPERED':
        return (
          <div className="badge-accent">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
            <span>C2PA alert: digital signature mismatch / tampered manifest</span>
          </div>
        );
      case 'MANIFEST_MISSING':
      default:
        return (
          <div className="badge">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>C2PA missing: standard media without content credentials</span>
          </div>
        );
    }
  };

  return (
    <div className="surface p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-rule pb-4">
        <div>
          <h4 className="font-display text-base sm:text-lg font-semibold text-ink">
            Error Level Analysis (ELA) and C2PA media integrity audit
          </h4>
        </div>

        <div>{getC2paBadge()}</div>
      </div>

      {c2paIssuer && (
        <div className="font-body text-xs text-muted">
          Hardware signer / issuer: <span className="font-medium text-ink">{c2paIssuer}</span>
        </div>
      )}

      {/* Side-by-Side Media & Heatmap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Original */}
        <div className="surface p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-ink">
            <span>Original media asset</span>
            <Eye className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
          </div>

          <div className="h-52 w-full rounded-pill border border-rule bg-paper overflow-hidden flex items-center justify-center">
            {originalMediaUrl ? (
              <img
                src={originalMediaUrl}
                alt="Original media for audit"
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="font-body text-xs text-muted">No media asset uploaded</span>
            )}
          </div>
        </div>

        {/* ELA Heatmap */}
        <div className="surface p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-ink">
            <div className="flex items-center gap-1.5">
              <span>Forensic ELA heatmap</span>
              <span className="badge">
                <Layers className="h-3 w-3" aria-hidden="true" />
                Resaving delta
              </span>
            </div>
            <span className="font-mono text-xs text-muted">
              Synth risk: {synthPct}%
            </span>
          </div>

          <div className="h-52 w-full rounded-pill border border-rule bg-paper overflow-hidden flex items-center justify-center">
            {elaHeatmapUrl ? (
              <img
                src={elaHeatmapUrl}
                alt="Computed Error Level Analysis heatmap"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-4 space-y-1 text-muted">
                <Cpu className="h-6 w-6 mx-auto opacity-50" aria-hidden="true" />
                <span className="font-body text-xs block">Computed when media attached</span>
                <span className="font-body text-[11px] block">Error level compression differences highlighted in color bands</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Synthetic Probability Bar */}
      <div className="space-y-1.5 pt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-ink">Deepfake &amp; generative AI synthetic likelihood</span>
          <span className="font-mono text-xs font-semibold text-ink">
            {synthPct}% probability
          </span>
        </div>

        <div className="h-2 w-full bg-paper border border-rule rounded-pill overflow-hidden">
          <div
            className={`h-full ${
              synthPct > 65
                ? 'bg-accent'
                : synthPct > 35
                ? 'bg-contour'
                : 'bg-green'
            }`}
            style={{ width: `${synthPct}%`, transition: 'width 400ms ease-out' }}
          />
        </div>
      </div>

      {/* Technical Findings Bullet List */}
      {technicalFindings && technicalFindings.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-rule">
          <span className="font-body text-xs font-medium text-muted">Technical forensic findings</span>
          <ul className="space-y-1.5 text-xs text-ink font-body">
            {technicalFindings.map((finding, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-ink shrink-0 mt-1.5" aria-hidden="true" />
                <span className="leading-relaxed">{finding}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ForensicHeatmapViewer;
