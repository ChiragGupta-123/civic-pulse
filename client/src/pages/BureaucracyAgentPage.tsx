import { useState } from 'react';
import {
  Play,
  Shield,
  History,
} from 'lucide-react';
import { CitizenVaultForm } from '../components/agent/CitizenVaultForm';
import { BrowserStreamViewport } from '../components/agent/BrowserStreamViewport';
import { agentApi } from '../api/agent.api';
import { useAsyncData } from '../hooks/useAsyncData';
import { useLiveTaskStore } from '../stores/liveTask.store';
import { showToast } from '../components/feedback/ToastContainer';
import type { BureaucracyServiceCode, AgentRunDetailDto } from '../types/agent.types';

const SERVICES: Array<{ code: BureaucracyServiceCode; title: string; desc: string }> = [
  {
    code: 'SCHOLARSHIP_RENEWAL',
    title: 'National scholarship renewal',
    desc: 'Annual renewal for higher education merit scholarships with income certificate relay',
  },
  {
    code: 'MSME_LICENSE',
    title: 'MSME enterprise license',
    desc: 'Udyam registration and statutory compliance renewal for small enterprises',
  },
  {
    code: 'WELFARE_SUBSIDY',
    title: 'DBT citizen welfare subsidy',
    desc: 'Direct Benefit Transfer subsidy enrollment for eligible citizen bank accounts',
  },
];

export function BureaucracyAgentPage() {
  const [selectedService, setSelectedService] = useState<BureaucracyServiceCode>('SCHOLARSHIP_RENEWAL');
  const [isLaunching, setIsLaunching] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const { setActiveRun } = useLiveTaskStore();

  const { data: runs, refetch: refetchRuns } = useAsyncData<AgentRunDetailDto[]>(
    async () => {
      const res = await agentApi.listRuns();
      return res.data || [];
    },
    []
  );

  const handleLaunchAgent = async () => {
    setIsLaunching(true);
    try {
      const res = await agentApi.createRun({
        service_code: selectedService,
      });

      if (res.data) {
        setActiveRunId(res.data.run_id);
        setActiveRun(res.data.run_id, 'RUNNING');
        showToast('Autonomous worker launched! Streaming browser steps…', 'success');
        refetchRuns();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to start agent';
      showToast(msg, 'error');
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="container-page py-8 space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-rule pb-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            Autonomous bureaucracy agent
          </h1>
          <p className="font-body text-xs sm:text-sm text-muted mt-1">
            Automates form-filling across legacy government portals using your encrypted data vault, streaming live browser execution with Human-in-the-Loop OTP verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge">Pillar 3: Autonomous workers</span>
          <span className="badge-settled">
            <Shield className="h-3 w-3 mr-1" aria-hidden="true" /> Zero PII leakage
          </span>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Citizen Data Vault & History */}
        <div className="lg:col-span-5 space-y-5">
          <CitizenVaultForm />

          {/* Past Runs History as Ruled Docket */}
          {runs && runs.length > 0 && (
            <div className="surface p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-rule pb-2.5">
                <span className="flex items-center gap-1.5 font-body text-xs font-medium text-ink">
                  <History className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                  Past execution runs
                </span>
                <span className="font-mono text-xs text-muted">
                  {runs.length} recorded
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {runs.map((r) => (
                  <div
                    key={r.run_id}
                    onClick={() => setActiveRunId(r.run_id)}
                    className={`rounded-pill border p-2.5 text-xs cursor-pointer transition-colors ${
                      activeRunId === r.run_id
                        ? 'border-ink bg-paper-3 font-medium'
                        : 'border-rule bg-paper-2 hover:bg-paper-3'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-ink">
                        {r.service_code.replace(/_/g, ' ').toLowerCase()}
                      </span>
                      <span
                        className={`badge ${
                          r.status === 'COMPLETED'
                            ? 'badge-settled'
                            : r.status === 'WAITING_FOR_HITL'
                            ? 'badge-accent'
                            : 'badge'
                        }`}
                      >
                        {r.status.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </div>

                    {r.tracking_receipt_id && (
                      <div className="font-mono text-[11px] text-green mt-1">
                        Receipt: {r.tracking_receipt_id}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Execution Dispatcher & Browser Stream */}
        <div className="lg:col-span-7 space-y-5">
          {/* Service Dispatch Card */}
          <div className="surface p-5 space-y-4">
            <div className="border-b border-rule pb-3 flex items-baseline justify-between gap-3">
              <h3 className="font-display text-base font-semibold text-ink">
                Autonomous form submission dispatcher
              </h3>
              <span className="badge">Service dispatcher</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SERVICES.map((srv) => (
                <button
                  key={srv.code}
                  type="button"
                  onClick={() => setSelectedService(srv.code)}
                  className={`flex flex-col text-left p-3 rounded-pill border transition-colors ${
                    selectedService === srv.code
                      ? 'border-ink bg-paper-3 shadow-subtle'
                      : 'border-rule bg-paper-2 hover:bg-paper-3 hover:border-ink'
                  }`}
                >
                  <span className="font-body text-xs font-semibold text-ink">{srv.title}</span>
                  <span className="font-body text-[11px] text-muted mt-0.5 leading-tight">
                    {srv.desc}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-rule">
              <div className="font-body text-xs text-muted">
                Pulls AES-encrypted data from your vault to satisfy portal schema
              </div>

              <button
                type="button"
                onClick={handleLaunchAgent}
                disabled={isLaunching}
                className="btn-primary"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isLaunching ? 'Dispatching…' : 'Launch autonomous agent'}</span>
              </button>
            </div>
          </div>

          {/* Browser Viewport Stream */}
          <BrowserStreamViewport
            runId={activeRunId}
            onRefresh={refetchRuns}
          />
        </div>
      </div>
    </div>
  );
}

export default BureaucracyAgentPage;
