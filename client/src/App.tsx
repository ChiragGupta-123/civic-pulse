import { useEffect } from 'react';
import { Route, Routes, useLocation, Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ToastContainer } from './components/feedback/ToastContainer';

// Domain Page Components
import { HomeDashboardPage } from './pages/HomeDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { PolicyStudioPage } from './pages/PolicyStudioPage';
import { GrievancePortalPage } from './pages/GrievancePortalPage';
import { PublicAccountabilityPage } from './pages/PublicAccountabilityPage';
import { BureaucracyAgentPage } from './pages/BureaucracyAgentPage';
import { FactVerificationPage } from './pages/FactVerificationPage';

function NotFoundPage() {
  return (
    <div className="container-page py-24 text-center animate-fade-up">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-pill bg-paper-3 text-ink shadow-subtle">
        <MapPin className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="badge mt-4">Error 404</p>
      <h1 className="mt-2 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
        Page not found
      </h1>
      <p className="mt-2 font-body text-xs sm:text-sm text-muted max-w-md mx-auto">
        The requested civic route does not exist. Return to the platform overview to access active digital governance pillars.
      </p>
      <div className="mt-5">
        <Link to="/" className="btn-primary">
          <span>Back to overview</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AppShell>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<HomeDashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/policies" element={<PolicyStudioPage />} />
        <Route path="/grievances" element={<GrievancePortalPage />} />
        <Route path="/accountability" element={<PublicAccountabilityPage />} />
        <Route
          path="/agent"
          element={
            <ProtectedRoute>
              <BureaucracyAgentPage />
            </ProtectedRoute>
          }
        />
        <Route path="/fact-check" element={<FactVerificationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
