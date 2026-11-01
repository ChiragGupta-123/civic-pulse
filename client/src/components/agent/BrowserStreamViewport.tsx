import { useState, useEffect } from 'react';
import {
  Monitor,
  CheckCircle2,
  Download,
  AlertCircle,
  KeyRound,
  FileCheck,
} from 'lucide-react';
import { useAgentSocket } from '../../hooks/useAgentSocket';
import { agentApi } from '../../api/agent.api';
import type { AgentRunDetailDto } from '../../types/agent.types';

interface BrowserStreamViewportProps {
  runId: string | null;
  onRefresh?: () => void;
}

const STEP_DEFINITIONS = [
  { step_number: 1, action: 'NAVIGATE', title: 'Portal navigation & session handshake' },
  { step_number: 2, action: 'FILL_FORM', title: 'Decrypt vault and fill form fields' },
  { step_number: 3, action: 'UPLOAD_DOCUMENT', title: 'Attach verified PDF certificates' },
  { step_number: 4, action: 'WAIT_HITL_OTP', title: 'Aadhaar / SMS OTP challenge' },
  { step_number: 5, action: 'EXTRACT_RECEIPT', title: 'Confirm and generate official receipt' },
];

export function BrowserStreamViewport({ runId }: BrowserStreamViewportProps) {
  const socketData = useAgentSocket(runId);
  const [initialDetail, setInitialDetail] = useState<AgentRunDetailDto | null>(null);

  useEffect(() => {
    if (runId) {
      agentApi.getRun(runId).then((res) => {
        if (res.data) setInitialDetail(res.data);
      }).catch(() => {});
    }
  }, [runId]);

  const status = socketData.currentStatus || initialDetail?.status || 'QUEUED';
  const steps = socketData.steps.length > 0 ? socketData.steps : (initialDetail?.steps || []);
  const screenshotUrl = socketData.latestScreenshotUrl || initialDetail?.hitl_screenshot_url || (steps.length > 0 ? steps[steps.length - 1].screenshot_url : null);
  const trackingId = socketData.trackingReceiptId || initialDetail?.tracking_receipt_id;
  const pdfUrl = socketData.receiptPdfUrl || initialDetail?.receipt_pdf_url;
  const error = socketData.errorDetail || initialDetail?.error_detail;

  return (
    <div className="surface p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-rule pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-pill bg-paper-3 text-ink">
            <Monitor className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-semibold text-ink">
                Playwright browser stream
              </h3>
              <span
                className={`badge ${
                  status === 'COMPLETED'
                    ? 'badge-settled'
                    : status === 'WAITING_FOR_HITL'
                    ? 'badge-accent'
                    : 'badge'
                }`}
              >
                {status.replace(/_/g, ' ').toLowerCase()}
              </span>
            </div>
            <p className="font-body text-xs text-muted">
              Live Chromium automation instance with real-time WebSocket telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span
            className={`h-2 w-2 rounded-full ${
              socketData.isConnected ? 'bg-green' : 'bg-muted'
            }`}
            aria-hidden="true"
          />
          <span className="text-muted font-body">
            {socketData.isConnected ? 'WebSocket stream active' : 'Stream standby'}
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-pill border border-error bg-paper-3 p-3 text-xs text-ink" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0 text-error" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Viewport Frame */}
      <div className="rounded-card overflow-hidden border border-ink bg-ink text-paper-2">
        <div className="p-2 border-b border-paper-3/20 flex items-center justify-between text-xs font-mono text-paper-3">
          <span className="truncate">Chromium session: {runId ? runId.slice(0, 16) : 'none'}</span>
          <span>Status: {status.toLowerCase()}</span>
        </div>

        <div className="relative min-h-[300px] flex items-center justify-center bg-ink">
          {screenshotUrl ? (
            <img
              src={screenshotUrl}
              alt="Live browser execution viewport"
              className="w-full h-auto object-contain max-h-[460px]"
            />
          ) : (
            <div className="text-center p-8 space-y-2 font-body text-xs text-paper-3">
              <Monitor className="h-8 w-8 mx-auto text-paper-3 opacity-60" aria-hidden="true" />
              <p className="font-medium">Viewport standby</p>
              <p className="text-paper-3/70 text-[11px]">Select a target public service and dispatch the worker to inspect execution.</p>
            </div>
          )}

          {status === 'WAITING_FOR_HITL' && (
            <div className="absolute inset-0 bg-ink/75 flex flex-col items-center justify-center p-6 text-center space-y-2">
              <KeyRound className="h-8 w-8 text-accent" aria-hidden="true" />
              <p className="font-display text-sm font-semibold text-paper-2">Execution paused: OTP challenge required</p>
              <p className="font-body text-xs text-paper-3 max-w-sm">
                Supply the verification code in the challenge prompt to resume form submission.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Downloadable Stamped Receipt */}
      {trackingId && (
        <div className="surface-sheet p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-l-2 border-l-green">
          <div className="flex items-center gap-2.5">
            <FileCheck className="h-5 w-5 text-green shrink-0" aria-hidden="true" />
            <div>
              <p className="font-display text-xs sm:text-sm font-semibold text-ink">
                Filing verified: tracking receipt generated
              </p>
              <p className="font-mono text-xs text-muted">
                Receipt ID: {trackingId}
              </p>
            </div>
          </div>

          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Download PDF receipt</span>
            </a>
          )}
        </div>
      )}

      {/* Execution Steps Progression */}
      <div className="space-y-2 pt-2">
        <h4 className="font-body text-xs font-medium text-muted">
          Execution pipeline progress
        </h4>
        <div className="ruled bg-paper border border-rule rounded-pill overflow-hidden">
          {STEP_DEFINITIONS.map((s) => {
            const stepRun = steps.find((st) => st.step_number === s.step_number);
            const isCompleted = stepRun?.status === 'COMPLETED';
            const isCurrent = stepRun?.status === 'RUNNING' || (status === 'WAITING_FOR_HITL' && s.step_number === 4);

            return (
              <div
                key={s.step_number}
                className={`p-3 flex items-center justify-between text-xs transition-colors ${
                  isCurrent ? 'bg-paper-3 font-semibold' : 'hover:bg-paper-2'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-semibold text-muted">
                    0{s.step_number}
                  </span>
                  <span className={isCompleted ? 'text-ink font-medium' : isCurrent ? 'text-ink font-semibold' : 'text-muted'}>
                    {s.title}
                  </span>
                </div>

                <div>
                  {isCompleted ? (
                    <span className="badge-settled">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Done
                    </span>
                  ) : isCurrent ? (
                    <span className="badge-accent">
                      In progress
                    </span>
                  ) : (
                    <span className="badge">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default BrowserStreamViewport;
