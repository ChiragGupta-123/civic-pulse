import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Bot,
  FileText,
  Globe2,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  ShieldCheck,
  User,
  X,
  ChevronDown,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../stores/auth.store';
import { usePreferencesStore } from '../../stores/preferences.store';
import type { RegionalLanguageCode } from '../../types/common.types';
import { HitlObstacleModal } from '../agent/HitlObstacleModal';

const NAV_LINKS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/policies', label: 'Policy studio', icon: FileText },
  { to: '/grievances', label: 'Grievance portal', icon: MapPin },
  { to: '/agent', label: 'Bureaucracy agent', icon: Bot },
  { to: '/fact-check', label: 'Fact verification', icon: ShieldCheck },
  { to: '/accountability', label: 'Public accountability', icon: BadgeCheck },
];

const LANGUAGE_OPTIONS: Array<{ code: RegionalLanguageCode; label: string }> = [
  { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
  { code: 'mr-IN', label: 'मराठी (Marathi)' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)' },
  { code: 'bn-IN', label: 'বাংলা (Bengali)' },
  { code: 'en-IN', label: 'English' },
];

interface AppShellProps {
  children?: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { language, setLanguage } = usePreferencesStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink selection:bg-accent-soft selection:text-ink">
      <HitlObstacleModal />

      {/* Furrow Working Header with 1px ink rule */}
      <header className="sticky top-0 z-40 border-b border-rule bg-paper-2/95 backdrop-blur-sm">
        <div className="container-page flex h-14 items-center justify-between gap-4 py-2">
          {/* Brand Wordmark & Ledger Sub-label */}
          <div className="flex items-center gap-3">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-pill bg-ink text-paper-2 shadow-subtle group-hover:bg-ink-2 transition-colors">
                <span className="font-mono text-xs font-semibold">CP</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-sm font-semibold tracking-tight text-ink">
                    Civic Pulse
                  </span>
                  <span className="rounded bg-paper-3 px-1.5 py-0.5 font-body text-[10px] text-muted border border-rule">
                    Public record
                  </span>
                </div>
                <span className="font-body text-[11px] text-muted leading-none">
                  Municipal operations
                </span>
              </div>
            </NavLink>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    clsx(
                      'inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-medium transition-colors',
                      isActive
                        ? 'border border-rule bg-paper-3 text-ink font-semibold shadow-subtle'
                        : 'text-muted hover:bg-paper-3 hover:text-ink'
                    )
                  }
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Utility: Regional Language & Profile */}
          <div className="hidden items-center gap-2.5 sm:flex">
            {/* Regional Language Select */}
            <div className="relative flex items-center gap-1.5 rounded-pill border border-rule bg-paper-2 px-2.5 py-1 text-xs text-muted shadow-subtle hover:border-ink transition-colors">
              <Globe2 className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as RegionalLanguageCode)}
                className="bg-transparent font-medium text-ink outline-none cursor-pointer pr-1 text-xs"
                aria-label="Select regional language"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3 w-3 text-muted pointer-events-none" aria-hidden="true" />
            </div>

            {/* Authentication & User Badge */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-pill border border-rule bg-paper-2 px-3 py-1 text-xs shadow-subtle">
                  <div className="flex h-5 w-5 items-center justify-center rounded-pill bg-paper-3 text-ink">
                    <User className="h-3 w-3" aria-hidden="true" />
                  </div>
                  <span className="max-w-[110px] truncate font-medium text-ink">
                    {user.full_name}
                  </span>
                  <span className="badge">
                    {user.role.toLowerCase()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign out"
                  className="rounded-pill border border-rule bg-paper-2 p-1.5 text-muted shadow-subtle transition-colors hover:bg-paper-3 hover:text-ink hover:border-ink"
                  aria-label="Sign out of account"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className="btn-primary min-h-[36px] py-1 px-3 text-xs"
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign in</span>
              </NavLink>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-pill border border-rule p-1.5 text-ink hover:bg-paper-3 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-rule bg-paper-2 p-4 shadow-card lg:hidden animate-fade-up">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-2.5 rounded-pill px-3 py-2 text-xs font-medium transition-colors',
                        isActive
                          ? 'border border-rule bg-paper-3 font-semibold text-ink shadow-subtle'
                          : 'text-muted hover:bg-paper-3 hover:text-ink'
                      )
                    }
                  >
                    <Icon className="h-4 w-4 opacity-75" aria-hidden="true" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-4 flex flex-col gap-3 border-t border-rule pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted">Regional language:</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as RegionalLanguageCode)}
                  className="rounded-pill border border-rule bg-paper-2 px-2.5 py-1 text-xs font-medium text-ink outline-none"
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {isAuthenticated && user ? (
                <div className="flex items-center justify-between pt-2 border-t border-rule">
                  <div className="flex items-center gap-2 text-xs">
                    <User className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                    <span className="font-medium text-ink">{user.full_name}</span>
                    <span className="badge">
                      {user.role.toLowerCase()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary w-full min-h-[38px] py-1.5 text-xs"
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  <span>Sign in</span>
                </NavLink>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Canvas */}
      <main className="flex-1 pb-16">{children}</main>

      {/* Ruled Municipal Footer */}
      <footer className="border-t border-rule bg-paper-2 py-4 text-xs text-muted">
        <div className="container-page flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green" aria-hidden="true" />
            <span className="font-body text-xs text-ink">
              Statutory open governance register
            </span>
          </div>
          <div className="font-body text-xs text-muted">
            Encrypted citizen vault with Veritier and AI4Bharat verification
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AppShell;
