import { Link } from 'react-router-dom';
import {
  FileText,
  MapPin,
  Bot,
  ShieldCheck,
  BadgeCheck,
  ArrowRight,
  ShieldAlert,
  Lock,
  Globe2,
  TrendingUp,
  Layers,
} from 'lucide-react';

const PILLARS = [
  {
    path: '/policies',
    num: '01',
    title: 'Policy studio',
    summary:
      'Translates complex gazette circulars and notifications into plain-language summaries with personalized citizen eligibility matching and vernacular neural audio.',
    icon: FileText,
    badge: 'AI4Bharat IndicTrans2',
    stat: '5 Indic languages',
  },
  {
    path: '/grievances',
    num: '02',
    title: 'Grievance portal',
    summary:
      'Submit civic infrastructure hazards via live audio mic, geo-tagged photo, and GPS. Automatically links duplicates within 50 meters and enforces strict department SLAs.',
    icon: MapPin,
    badge: 'PostGIS ST_DWithin',
    stat: '50m spatial dedup',
  },
  {
    path: '/agent',
    num: '03',
    title: 'Bureaucracy agent',
    summary:
      'Dispatches autonomous browser workers to fill legacy state portals using your encrypted citizen vault, pausing only for Human-in-the-Loop OTP verification.',
    icon: Bot,
    badge: 'AES-256-GCM vault',
    stat: 'Zero PII leakage',
  },
  {
    path: '/fact-check',
    num: '04',
    title: 'Fact verification',
    summary:
      'Cross-examines viral claims against Veritier and government registries, verifies C2PA Content Credentials, and computes Error Level Analysis (ELA) heatmaps.',
    icon: ShieldCheck,
    badge: 'C2PA + ELA forensics',
    stat: 'Cryptographic audit',
  },
];

export function HomeDashboardPage() {
  return (
    <div className="container-page py-8 space-y-8 animate-fade-up">
      {/* Hero Section */}
      <div className="surface p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
              The municipal register of digital governance
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-settled">
                Statutory operations active
              </span>
              <p className="font-body text-xs sm:text-sm text-muted leading-relaxed">
                Unified public operations: multilingual gazette intelligence, 50m spatial deduplication, autonomous bureaucracy automation, and forensic truth verification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link to="/policies" className="btn-primary">
              <span>Explore policies</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <Link to="/accountability" className="btn-secondary">
              <BadgeCheck className="h-3.5 w-3.5 text-green" aria-hidden="true" />
              <span>SLA map</span>
            </Link>
          </div>
        </div>

        {/* Ruled Municipal Operations Tally */}
        <div className="pt-4 border-t border-rule">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-paper border border-rule rounded-pill space-y-1">
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="font-body font-medium">Active incidents</span>
                <MapPin className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-semibold text-ink">
                  1,248
                </span>
                <span className="font-body text-[11px] text-green font-medium flex items-center">
                  <TrendingUp className="h-3 w-3 mr-0.5" aria-hidden="true" /> 94% on-track
                </span>
              </div>
              <p className="font-body text-[11px] text-muted">
                5 municipal departments
              </p>
            </div>

            <div className="p-3 bg-paper border border-rule rounded-pill space-y-1">
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="font-body font-medium">Monitored circulars</span>
                <FileText className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-semibold text-ink">
                  342
                </span>
                <span className="font-body text-[11px] text-ink font-medium">
                  5 languages
                </span>
              </div>
              <p className="font-body text-[11px] text-muted">
                Indexed in pgvector
              </p>
            </div>

            <div className="p-3 bg-paper border border-rule rounded-pill space-y-1">
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="font-body font-medium">Agent filings</span>
                <Bot className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-semibold text-ink">
                  884
                </span>
                <span className="font-body text-[11px] text-green font-medium">
                  99.2% rate
                </span>
              </div>
              <p className="font-body text-[11px] text-muted">
                Autonomous renewals
              </p>
            </div>

            <div className="p-3 bg-paper border border-rule rounded-pill space-y-1">
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="font-body font-medium">Forensic audits</span>
                <ShieldCheck className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-semibold text-ink">
                  512
                </span>
                <span className="font-body text-[11px] text-ink font-medium">
                  C2PA verified
                </span>
              </div>
              <p className="font-body text-[11px] text-muted">
                Deepfake inspections
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Working Civic Pillars as Ruled Dockets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-ink pb-2">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Statutory governance modules
            </h2>
            <p className="font-body text-xs text-muted">
              Select a working domain to file requests, review evidence, or inspect public records.
            </p>
          </div>
          <span className="badge">
            4 active systems
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.path}
                to={p.path}
                className="surface p-5 hover:bg-paper-3 transition-colors flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-muted">
                        {p.num}
                      </span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-pill bg-paper-3 text-ink">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                    </div>
                    <span className="badge">
                      {p.stat}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-base font-semibold text-ink group-hover:text-accent transition-colors">
                      {p.title}
                    </h3>
                    <p className="font-body text-xs text-muted mt-1 leading-relaxed">
                      {p.summary}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-rule pt-3 text-xs">
                  <span className="font-body text-[11px] text-muted">
                    Engine: {p.badge}
                  </span>
                  <div className="flex items-center gap-1 font-medium text-ink group-hover:text-accent transition-colors">
                    <span>Open register</span>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Architectural Standards Register */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="surface p-3.5 flex items-start gap-3">
          <Globe2 className="h-4 w-4 text-ink shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-body text-xs font-semibold text-ink">5 Indic languages</p>
            <p className="font-body text-[11px] text-muted">AI4Bharat neural synthesis</p>
          </div>
        </div>

        <div className="surface p-3.5 flex items-start gap-3">
          <Layers className="h-4 w-4 text-ink shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-body text-xs font-semibold text-ink">50m spatial dedup</p>
            <p className="font-body text-[11px] text-muted">PostGIS ST_DWithin index</p>
          </div>
        </div>

        <div className="surface p-3.5 flex items-start gap-3">
          <Lock className="h-4 w-4 text-ink shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-body text-xs font-semibold text-ink">AES-256-GCM vault</p>
            <p className="font-body text-[11px] text-muted">Hardware-isolated encryption</p>
          </div>
        </div>

        <div className="surface p-3.5 flex items-start gap-3">
          <ShieldAlert className="h-4 w-4 text-ink shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-body text-xs font-semibold text-ink">Veritier &amp; C2PA</p>
            <p className="font-body text-[11px] text-muted">Cryptographic truth audit</p>
          </div>
        </div>
      </div>

      {/* Public Accountability CTA Section */}
      <div className="surface p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border-l-4 border-l-accent">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="badge-settled">Open governance data</span>
            <span className="font-body text-xs text-muted">No sign-in required</span>
          </div>
          <h3 className="font-display text-base sm:text-lg font-semibold text-ink">
            Real-time department SLA compliance and hazard hotspots
          </h3>
          <p className="font-body text-xs text-muted max-w-2xl leading-relaxed">
            Inspect municipal response times, resolved civic tickets, and open hazard heatmaps in real-time across public works, water board, and power grid.
          </p>
        </div>

        <Link to="/accountability" className="btn-primary shrink-0 whitespace-nowrap">
          <span>View public dashboard</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export default HomeDashboardPage;
