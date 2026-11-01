import { Link } from 'react-router-dom';
import { PageFrame, PageHead, SectionHead } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';

interface PendingPageProps {
  title: string;
  lede: string;
  phase: string;
  endpoint: string;
  items: string[];
}

export function PendingPage({ title, lede, phase, endpoint, items }: PendingPageProps) {
  return (
    <PageFrame>
      <PageHead
        title={title}
        lede={lede}
        meta={<span className="text-xs text-muted">{phase}</span>}
        actions={
          <Button asChild>
            <Link to="/grievances">Open the register</Link>
          </Button>
        }
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)]">
        <section className="min-w-0">
          <SectionHead title="What lands on this sheet" note="From the approved plan" />
          <ol className="border-t border-ink">
            {items.map((item) => (
              <li key={item} className="border-b border-rule py-3 text-sm leading-relaxed text-ink-2">
                {item}
              </li>
            ))}
          </ol>
        </section>

        <aside className="min-w-0">
          <SectionHead title="Build state" />
          <dl className="border-t border-ink">
            <div className="flex items-baseline justify-between gap-3 border-b border-rule py-2">
              <dt className="text-xs text-muted">Phase</dt>
              <dd className="text-sm text-ink-2">{phase}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-rule py-2">
              <dt className="text-xs text-muted">Endpoint</dt>
              <dd className="mono text-xs text-ink-2">{endpoint}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-rule py-2">
              <dt className="text-xs text-muted">Interface</dt>
              <dd className="text-sm text-ink-2">Not built yet</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Nothing on this screen is stubbed with sample data. It will be built against the live
            endpoint named above, in the same system as the register.
          </p>
        </aside>
      </div>
    </PageFrame>
  );
}

export function NotFoundPage() {
  return (
    <PageFrame className="py-16">
      <p className="mono text-2xs text-muted">404</p>
      <h1 className="mt-2 max-w-[20ch] text-4xl text-ink">That sheet is not in the register.</h1>
      <p className="mt-3 max-w-[52ch] text-sm text-muted">
        The address does not match a sheet this interface keeps. The register is the safest place to
        start again.
      </p>
      <div className="mt-6">
        <Button asChild variant="primary">
          <Link to="/grievances">Open the register</Link>
        </Button>
      </div>
    </PageFrame>
  );
}
