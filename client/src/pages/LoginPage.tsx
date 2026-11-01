import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Landmark, LogIn, Shield, UserCheck, AlertCircle } from 'lucide-react';
import { identityApi } from '../api/identity.api';
import { useAuthStore } from '../stores/auth.store';
import { showToast } from '../components/feedback/ToastContainer';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await identityApi.login({ email, password });
      if (res.data) {
        setAuth(res.data.access_token, res.data.user);
        showToast(`Welcome back, ${res.data.user.full_name}`, 'success');
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Login failed';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('CivicPulse@123');
    setErrorMsg(null);
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-up">
      <div className="w-full max-w-md space-y-5">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-pill bg-ink text-paper-2 shadow-subtle">
            <span className="font-mono text-xs font-semibold">CP</span>
          </div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
            Sign in to Civic Pulse
          </h2>
          <p className="font-body text-xs text-muted">
            Statutory municipal access and citizen vault
          </p>
        </div>

        {/* Notebook Card Surface */}
        <div className="surface p-6 sm:p-7 space-y-5">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-pill border border-error bg-paper-3 p-3 text-xs text-ink" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0 text-error" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@civicpulse.gov.in"
                className="input-modern"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-muted">Password</label>
                <span className="font-body text-[11px] text-muted">Demo: CivicPulse@123</span>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="input-modern"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <span>Authenticating…</span>
              ) : (
                <>
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  <span>Sign in</span>
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Demo Accounts */}
          <div className="border-t border-rule pt-4 space-y-2.5">
            <p className="text-center font-body text-xs text-muted">
              Quick-fill demo credentials
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('citizen@civicpulse.gov.in')}
                className="btn-secondary min-h-[56px] py-1.5 px-2 flex-col gap-0.5 text-center"
              >
                <UserCheck className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                <span className="font-medium text-ink text-xs">Citizen</span>
                <span className="font-body text-[10px] text-muted truncate max-w-full">Demo user</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('officer@civicpulse.gov.in')}
                className="btn-secondary min-h-[56px] py-1.5 px-2 flex-col gap-0.5 text-center"
              >
                <Shield className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                <span className="font-medium text-ink text-xs">Officer</span>
                <span className="font-body text-[10px] text-muted truncate max-w-full">PWD officer</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin@civicpulse.gov.in')}
                className="btn-secondary min-h-[56px] py-1.5 px-2 flex-col gap-0.5 text-center"
              >
                <Landmark className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                <span className="font-medium text-ink text-xs">Admin</span>
                <span className="font-body text-[10px] text-muted truncate max-w-full">System admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Public Accountability Quick Link */}
        <p className="text-center font-body text-xs text-muted">
          Need municipal open data without signing in?{' '}
          <Link to="/accountability" className="font-medium text-ink hover:underline">
            View public accountability dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
