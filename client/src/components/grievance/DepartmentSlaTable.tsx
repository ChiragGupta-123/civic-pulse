import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { AlertCircle, CheckCircle2, Building2 } from 'lucide-react';
import type { DepartmentScorecardDto } from '../../types/grievance.types';

interface DepartmentSlaTableProps {
  scorecards: DepartmentScorecardDto[];
}

export function DepartmentSlaTable({ scorecards }: DepartmentSlaTableProps) {
  const chartData = scorecards.map((sc) => ({
    name: sc.department_code,
    compliance: Math.round(sc.sla_compliance_pct ?? 100),
    department: sc.department_name,
    resolved: sc.resolved_count ?? sc.resolved_tickets ?? 0,
    total: sc.total_assigned ?? sc.total_tickets ?? 0,
  }));

  const getComplianceBadge = (pct?: number | null) => {
    const val = typeof pct === 'number' && !isNaN(pct) ? pct : 100;
    if (val >= 90) {
      return (
        <span className="badge-settled">
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> {val.toFixed(0)}%
        </span>
      );
    }
    if (val >= 75) {
      return (
        <span className="badge-accent">
          {val.toFixed(0)}%
        </span>
      );
    }
    return (
      <span className="badge">
        <AlertCircle className="h-3 w-3 text-muted" aria-hidden="true" /> {val.toFixed(0)}%
      </span>
    );
  };

  return (
    <div className="surface p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-rule pb-4">
        <div>
          <h3 className="font-display text-base sm:text-lg font-semibold text-ink">
            Department SLA compliance and resolution performance
          </h3>
          <p className="font-body text-xs text-muted mt-0.5">
            Systematic audit of municipal response efficiency measured against statutory turnaround times.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge">
            <Building2 className="h-3.5 w-3.5 mr-1 text-muted" aria-hidden="true" />
            {scorecards.length} monitored agencies
          </span>
        </div>
      </div>

      {/* Ruled Recharts Bar Chart */}
      <div className="rounded-pill border border-rule bg-paper p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-ink">Compliance rate (%) by agency</span>
          <span className="font-mono text-[11px] text-muted">Target SLA: 90%+</span>
        </div>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="oklch(88% 0.013 85)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fontFamily: 'Red Hat Mono', fill: 'oklch(44% 0.012 60)' }}
                axisLine={{ stroke: 'oklch(88% 0.013 85)' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fontFamily: 'Red Hat Mono', fill: 'oklch(44% 0.012 60)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-pill border border-rule bg-paper-2 p-2.5 shadow-card font-body text-xs space-y-0.5">
                        <p className="font-semibold text-ink">{data.department}</p>
                        <p className="text-muted">
                          Code: <span className="font-mono">{data.name}</span>
                        </p>
                        <p className="text-muted">
                          Compliance: <span className="font-mono font-semibold text-ink">{data.compliance}%</span>
                        </p>
                        <p className="text-muted">
                          Resolved: <span className="font-mono">{data.resolved} / {data.total} tickets</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="compliance" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.compliance >= 90 ? 'oklch(48% 0.11 150)' : entry.compliance >= 75 ? 'oklch(70% 0.19 40)' : 'oklch(28% 0.008 60)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabular Scorecard Register as Ruled Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-body">
          <thead>
            <tr className="border-b border-ink text-muted">
              <th className="py-2.5 px-3 font-medium">Department</th>
              <th className="py-2.5 px-3 font-medium">Agency code</th>
              <th className="py-2.5 px-3 font-medium text-center">Total assigned</th>
              <th className="py-2.5 px-3 font-medium text-center">Resolved</th>
              <th className="py-2.5 px-3 font-medium text-center">Breached</th>
              <th className="py-2.5 px-3 font-medium text-right">Compliance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {scorecards.map((sc) => (
              <tr key={sc.department_code} className="hover:bg-paper-3 transition-colors">
                <td className="py-3 px-3 font-medium text-ink">
                  {sc.department_name}
                </td>
                <td className="py-3 px-3 font-mono text-muted">
                  {sc.department_code}
                </td>
                <td className="py-3 px-3 text-center font-mono">
                  {sc.total_assigned ?? sc.total_tickets ?? 0}
                </td>
                <td className="py-3 px-3 text-center font-mono">
                  {sc.resolved_count ?? sc.resolved_tickets ?? 0}
                </td>
                <td className="py-3 px-3 text-center font-mono">
                  {sc.sla_breached_count ?? 0}
                </td>
                <td className="py-3 px-3 text-right">
                  {getComplianceBadge(sc.sla_compliance_pct)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DepartmentSlaTable;
