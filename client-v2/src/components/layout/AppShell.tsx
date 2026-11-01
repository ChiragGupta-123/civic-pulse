import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOut, Menu } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { PageFrame } from './PageFrame';
import { LANGUAGES, usePreferencesStore } from '@/stores/preferences.store';
import { useAuthStore } from '@/stores/auth.store';
import { initialsOf } from '@/lib/format';
import { ROLE_LABEL, type UserRole } from '@/types/identity.types';

const DESTINATIONS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/grievances', label: 'Register', end: false },
  { to: '/policies', label: 'Policies', end: false },
  { to: '/agent', label: 'Agent', end: false },
  { to: '/fact-check', label: 'Fact check', end: false },
  { to: '/accountability', label: 'Accountability', end: false },
];

const LANGUAGE_OPTIONS = LANGUAGES.map((language) => ({
  value: language.code,
  label: language.label,
}));

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const language = usePreferencesStore((state) => state.language);
  const setLanguage = usePreferencesStore((state) => state.setLanguage);
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-key focus:border focus:border-ink focus:bg-paper-2 focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-rule bg-paper">
        <PageFrame className="flex h-14 items-center gap-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Civic Pulse, overview">
            <span className="grid h-7 w-7 place-items-center rounded-[4px] bg-ink font-display text-[11px] font-semibold tracking-[0.02em] text-paper">
              CP
            </span>
            <span className="font-display text-[15px] font-semibold tracking-[-0.02em] text-ink">
              Civic Pulse
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden min-w-0 flex-1 items-center gap-5 lg:flex">
            {DESTINATIONS.map((destination) => (
              <NavLink
                key={destination.to}
                to={destination.to}
                end={destination.end}
                className="nav-link"
              >
                {destination.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:block">
              <Select
                value={language}
                onValueChange={setLanguage}
                options={LANGUAGE_OPTIONS}
                label="Reading language"
                className="w-[104px]"
              />
            </div>

            {status === 'authenticated' && user ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    className="key key--sm gap-2 pr-2.5"
                    aria-label={`Account menu for ${user.full_name}`}
                  >
                    <span className="mono grid h-5 w-5 place-items-center rounded-[3px] bg-ink text-[10px] text-paper">
                      {initialsOf(user.full_name)}
                    </span>
                    <span className="hidden max-w-[120px] truncate sm:inline">{user.full_name}</span>
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    sideOffset={6}
                    align="end"
                    className="z-50 min-w-[220px] rounded-card border border-ink bg-paper-2 p-1 shadow-lift"
                  >
                    <div className="border-b border-rule px-2.5 py-2">
                      <p className="truncate text-sm text-ink">{user.full_name}</p>
                      <p className="truncate text-xs text-muted">{user.email}</p>
                      <p className="mt-1 text-2xs font-medium text-muted">
                        {ROLE_LABEL[user.role as UserRole] ?? user.role}
                      </p>
                    </div>
                    <DropdownMenu.Item
                      onSelect={logout}
                      className="mt-1 flex cursor-pointer items-center gap-2 rounded-[4px] px-2.5 py-2 text-sm text-ink outline-none data-[highlighted]:bg-paper-3"
                    >
                      <LogOut size={14} aria-hidden />
                      Sign out
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : (
              <Button asChild variant="quiet" size="sm">
                <Link to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}>
                  Sign in
                </Link>
              </Button>
            )}

            <button
              type="button"
              className="key key--quiet key--icon lg:hidden"
              aria-label="Open navigation"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={18} aria-hidden />
            </button>
          </div>
        </PageFrame>
      </header>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Civic Pulse">
        <nav aria-label="Primary" className="flex flex-col">
          {DESTINATIONS.map((destination) => (
            <NavLink
              key={destination.to}
              to={destination.to}
              end={destination.end}
              className="drawer-link"
            >
              {destination.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 border-t border-rule px-3 pt-3">
          <p className="mb-2 text-2xs font-medium text-muted">Reading language</p>
          <Select
            value={language}
            onValueChange={setLanguage}
            options={LANGUAGE_OPTIONS}
            label="Reading language"
            className="w-full"
          />
        </div>
      </Drawer>

      <main id="main" className="flex-1 py-6 lg:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-rule">
        <PageFrame className="flex flex-col gap-2 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Civic Pulse, public register of municipal action</p>
          <p className="flex items-center gap-2 text-2xs">
            <span className="mono">interface 2.0</span>
            <span aria-hidden className="h-3 w-px bg-rule" />
            <span className="mono">api v1</span>
          </p>
        </PageFrame>
      </footer>
    </div>
  );
}
