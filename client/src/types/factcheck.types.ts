export type FactCheckVerdict =
  | 'VERIFIED_TRUE'
  | 'MISLEADING'
  | 'FALSE_CLAIM'
  | 'SYNTHETIC_OR_MANIPULATED'
  | 'UNVERIFIED';

export type C2paStatus =
  | 'MANIFEST_VALID'
  | 'MANIFEST_TAMPERED'
  | 'MANIFEST_MISSING';

export interface AuthenticityAnalysisDto {
  c2pa_status: C2paStatus;
  c2pa_issuer?: string | null;
  is_deepfake_suspected: boolean;
  synthetic_probability: number;
  ela_heatmap_url?: string | null;
  technical_findings: string[];
}

export interface EvidenceCitationDto {
  source_authority?: string;
  authority?: string;
  canonical_fact?: string;
  claim_rebuttal_or_fact?: string;
  reference_url?: string;
  source_url?: string;
  similarity_score: number;
}

export interface ProvenanceNodeDto {
  node_id?: string;
  step_name?: string;
  stage?: string;
  label?: string;
  detail?: string;
  status?: 'VERIFIED' | 'MANIPULATED' | 'UNVERIFIED' | string;
  timestamp?: string;
}

export interface ForensicAuditResultDto {
  id: string;
  claim_id: string;
  verdict: FactCheckVerdict;
  confidence_score: number;
  credibility_rating: number;
  c2pa_status: C2paStatus;
  c2pa_issuer?: string | null;
  is_deepfake_suspected: boolean;
  synthetic_probability: number;
  ela_heatmap_url?: string | null;
  technical_findings: string[];
  evidence_citations: EvidenceCitationDto[];
  provenance_nodes: ProvenanceNodeDto[];
  explanation_summary?: string;
  created_at: string;
}

export interface ForensicAuditReportDto {
  id?: string;
  audit_id?: string;
  claim_id?: string;
  claim_text: string;
  source_url?: string | null;
  media_type: 'TEXT_ONLY' | 'IMAGE' | 'VIDEO' | 'AUDIO' | string;
  media_file_url?: string | null;
  media_url?: string | null;
  status?: string;
  verdict?: FactCheckVerdict;
  confidence_score?: number;
  credibility_rating?: number;
  audit_result?: ForensicAuditResultDto;
  authenticity_analysis?: AuthenticityAnalysisDto;
  evidence_citations?: EvidenceCitationDto[];
  provenance_nodes?: ProvenanceNodeDto[];
  narrative_summary?: string;
  created_at: string;
}
