import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { useAuthStore } from '@/stores/auth.store';

const SESSION_ITEMS = [
  {
    title: 'A named filing',
    body: 'A report filed while signed in is attached to your account instead of the anonymous sheet.',
  },
  {
    title: 'Officer instruments',
    body: 'Status transitions with a remark, recorded against your account and the record audit trail.',
  },
  {
    title: 'A persisted session',
    body: 'The token stays in this browser and is checked against the account endpoint on your return.',
  },
];

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const next = searchParams.get('next') || '/';
  const login = useAuthStore((state) => state.login);
  const status = useAuthStore((state) => state.status);
  const storeError = useAuthStore((state) => state.error);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') navigate(next, { replace: true });
  }, [status, navigate, next]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const ok = await login(email.trim(), password);
    setSubmitting(false);
    if (ok) navigate(next, { replace: true });
  }

  return (
    <PageFrame className="py-8 lg:py-12">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-16">
        <div className="min-w-0">
          <h1 className="text-3xl text-ink">Sign in to the register</h1>
          <p className="mt-2 max-w-[46ch] text-sm text-muted">
            The public sheet needs no account. Signing in attaches your name to a filing and opens the
            instruments that change a record.
          </p>

          {storeError ? (
            <div role="alert" className="mt-4 rounded-key border border-[var(--color-error)] bg-[var(--color-error-soft)] px-3 py-2">
              <p className="text-sm text-ink">That sign-in was refused.</p>
              <p className="mt-0.5 text-xs text-ink-2">{storeError}</p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <div className="flex items-center gap-3 pt-1">
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Checking…' : 'Sign in'}
              </Button>
              <span className="text-2xs text-muted">No account is created from this screen.</span>
            </div>
          </form>
        </div>

        <aside className="min-w-0 lg:border-l lg:border-rule lg:pl-12">
          <h2 className="text-lg text-ink">A session carries</h2>
          <ol className="mt-2 border-t border-ink">
            {SESSION_ITEMS.map((item) => (
              <li key={item.title} className="border-b border-rule py-3">
                <p className="text-sm font-medium text-ink">{item.title}</p>
                <p className="mt-0.5 max-w-[50ch] text-xs leading-relaxed text-muted">{item.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Officer and administrator accounts are issued by the municipal registrar, not from this page.
          </p>
        </aside>
      </div>
    </PageFrame>
  );
}
