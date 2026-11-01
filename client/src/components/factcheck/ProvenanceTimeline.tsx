import { ExternalLink, CheckCircle2, ShieldAlert, BookOpen } from 'lucide-react';
import type { EvidenceCitationDto, ProvenanceNodeDto } from '../../types/factcheck.types';

interface ProvenanceTimelineProps {
  citations: EvidenceCitationDto[];
  provenanceNodes: ProvenanceNodeDto[];
}

export function ProvenanceTimeline({ citations, provenanceNodes }: ProvenanceTimelineProps) {
  return (
    <div className="surface p-5 sm:p-6 space-y-6">
      {/* Evidence Citations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted" aria-hidden="true" />
            <h4 className="font-display text-base font-semibold text-ink">
              Official statutory citations and registries
            </h4>
          </div>
          <span className="font-body text-xs text-muted">
            {citations.length} verified sources matched
          </span>
        </div>

        {citations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {citations.map((cite, idx) => (
              <div key={idx} className="surface p-3.5 border-l-2 border-l-ink space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink truncate max-w-[200px]">
                    {cite.source_authority}
                  </span>
                  <span className="badge font-mono">
                    {Math.round(cite.similarity_score * 100)}% match
                  </span>
                </div>

                <p className="font-body text-xs text-muted leading-relaxed">
                  "{cite.canonical_fact}"
                </p>

                {cite.reference_url && (
                  <a
                    href={cite.reference_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-body text-xs text-ink hover:underline font-medium"
                  >
                    <span>Inspect authority record</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="surface p-4 text-center text-xs text-muted font-body">
            No matching statutory citations found in canonical registry.
          </div>
        )}
      </div>

      {/* Provenance Audit Steps */}
      {provenanceNodes && provenanceNodes.length > 0 && (
        <div className="space-y-3.5 border-t border-rule pt-4">
          <span className="badge">Cryptographic provenance chain</span>

          <div className="relative pl-5 space-y-3 border-l-2 border-rule ml-2">
            {provenanceNodes.map((node, idx) => {
              const isVerified = node.status === 'VERIFIED';
              return (
                <div key={idx} className="relative space-y-1 text-xs font-body">
                  <span
                    className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-paper-2 ${
                      isVerified ? 'bg-green' : 'bg-muted'
                    }`}
                    aria-hidden="true"
                  />

                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">
                      {(node.label || node.step_name || 'Verification checkpoint').toLowerCase()}
                    </span>
                    {node.stage && (
                      <span className="font-body text-[11px] text-muted">
                        via {node.stage}
                      </span>
                    )}
                  </div>

                  {node.detail && (
                    <p className="text-muted leading-relaxed">
                      {node.detail}
                    </p>
                  )}

                  <div className="flex items-center gap-3 pt-0.5 text-[11px] text-muted">
                    <span className="font-mono">
                      {node.timestamp ? new Date(node.timestamp).toLocaleString() : 'Statutory audit'}
                    </span>
                    <span className="flex items-center gap-1">
                      {isVerified ? (
                        <span className="text-green font-medium flex items-center gap-0.5">
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Signature valid
                        </span>
                      ) : (
                        <span className="text-muted flex items-center gap-0.5">
                          <ShieldAlert className="h-3 w-3" aria-hidden="true" /> Unsigned node
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProvenanceTimeline;
