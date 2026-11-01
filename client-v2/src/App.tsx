import { Component, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { HomePage } from '@/pages/HomePage';
import { GrievanceRegisterPage } from '@/pages/GrievanceRegisterPage';
import { GrievanceDetailPage } from '@/pages/GrievanceDetailPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage, PendingPage } from '@/pages/PendingPage';
import { useAuthStore } from '@/stores/auth.store';
import { PageFrame } from '@/components/layout/PageFrame';

class RouteErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <PageFrame className="py-12">
          <p className="mono text-2xs text-muted">render fault</p>
          <h1 className="mt-2 max-w-[24ch] text-3xl text-ink">
            This sheet failed while drawing.
          </h1>
          <p className="mt-2 max-w-[56ch] text-sm text-muted">
            {this.state.error.message || 'The interface raised an error it could not recover from.'}
          </p>
          <button
            type="button"
            className="key key--primary mt-5"
            onClick={() => window.location.reload()}
          >
            Reload the register
          </button>
        </PageFrame>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('cp:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('cp:unauthorized', handleUnauthorized);
  }, [logout]);

  return (
    <BrowserRouter>
      <RouteErrorBoundary>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="grievances" element={<GrievanceRegisterPage />} />
            <Route path="grievances/:ticketId" element={<GrievanceDetailPage />} />
            <Route
              path="accountability"
              element={
                <PendingPage
                  title="Public accountability"
                  lede="The open sheet: every department's assigned, closed and breached count, with the map the public can read without an account."
                  phase="Phase 2"
                  endpoint="/grievances/public-dashboard"
                  items={[
                    'Key figures for incidents, resolution rate, breaches and mean resolution time.',
                    'The city map with severity-coded pins, read-only and unauthenticated.',
                    'Department scorecards as a ruled ledger, not a chart gallery.',
                    'A citable export of the sheet for the municipal record.',
                  ]}
                />
              }
            />
            <Route
              path="policies"
              element={
                <PendingPage
                  title="Policy studio"
                  lede="A gazette notification, its clauses, and what each clause means for one household in one language."
                  phase="Phase 2"
                  endpoint="/policies"
                  items={[
                    'Ingestion of a notification PDF with its reference code and issuing body.',
                    'A citizen explainer with clause citations and an eligibility matrix.',
                    'Regional voice playback in the six scheduled languages.',
                    'A searchable catalogue of every instrument on file.',
                  ]}
                />
              }
            />
            <Route
              path="agent"
              element={
                <PendingPage
                  title="Bureaucracy agent"
                  lede="A headless worker fills the departmental form, streams its screen into this sheet, and stops when it needs a code from you."
                  phase="Phase 2"
                  endpoint="/agent/runs"
                  items={[
                    'A dispatcher for scholarship renewal, electricity connection and income certificate runs.',
                    'The live worker viewport with its step ledger and timestamps.',
                    'A human-in-the-loop challenge for SMS codes and captchas, raised by the worker.',
                    'The citizen vault the worker reads its credentials from, encrypted at rest.',
                  ]}
                />
              }
            />
            <Route
              path="fact-check"
              element={
                <PendingPage
                  title="Fact verification"
                  lede="A claim, its image forensics, and the provenance ledger behind it, kept against a canonical registry of government facts."
                  phase="Phase 2"
                  endpoint="/fact-checks/audit"
                  items={[
                    'Claim audit with an optional image or video attachment.',
                    'Error-level analysis of the image with the splice regions marked.',
                    'A credibility reading on a measured dial, never a badge alone.',
                    'C2PA provenance nodes, issuer keys and modification times.',
                  ]}
                />
              }
            />
            <Route path="login" element={<LoginPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </RouteErrorBoundary>
    </BrowserRouter>
  );
}
