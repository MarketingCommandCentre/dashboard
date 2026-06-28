import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Building2,
  CalendarClock,
  CheckCircle2,
  type LucideIcon,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Timer,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/PageHeader';
import { ChartCard } from '@/features/analytics/ChartCard';
import {
  PERIOD_OPTIONS,
  type Period,
  completionTimeline,
  performanceMetrics,
  statusDistribution,
  typeDistribution,
} from '@/features/analytics/metrics';
import { useRequests } from '@/hooks/useRequests';
import { useDepartmentCounts } from '@/hooks/useDepartmentCounts';
import { useDiscordRoleNames } from '@/hooks/useDiscordNames';
import { cn } from '@/lib/utils';
import type { RequestType } from '@/types';

const TYPE_COLORS: Record<RequestType, string> = { POST: '#007bff', REEL: '#28a745' };

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'var(--popover)',
  color: 'var(--popover-foreground)',
  fontSize: 12,
} as const;

const axisStyle = { fontSize: 11, fill: 'var(--muted-foreground)' } as const;

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-56 items-center justify-center text-center text-xs text-muted-foreground">
      {message}
    </div>
  );
}

export function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>(30);

  const { data: requests, isLoading, isError } = useRequests();
  const { data: departmentCounts } = useDepartmentCounts();

  const departmentIds = useMemo(
    () => (departmentCounts ?? []).map((d) => d.requesterDepartmentid),
    [departmentCounts],
  );
  const { data: roleNames } = useDiscordRoleNames(departmentIds);

  const list = useMemo(() => requests ?? [], [requests]);

  const statusData = useMemo(() => statusDistribution(list), [list]);
  const typeData = useMemo(() => typeDistribution(list), [list]);
  const timelineData = useMemo(() => completionTimeline(list, period), [list, period]);
  const metrics = useMemo(() => performanceMetrics(list, period), [list, period]);

  const departmentData = useMemo(
    () =>
      (departmentCounts ?? [])
        .map((d) => {
          const id = String(d.requesterDepartmentid);
          return { name: roleNames?.[id] ?? `Dept ${id}`, count: d.totalRequests };
        })
        .sort((a, b) => b.count - a.count),
    [departmentCounts, roleNames],
  );

  const hasData = list.length > 0;
  const loadingMessage = isLoading ? 'Loading…' : 'No requests yet.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <PageHeader
        title="Analytics"
        description="Charts and metrics for marketing output."
        emoji="📈"
        actions={
          <div className="flex items-center gap-1 rounded-full border bg-muted/40 p-1">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPeriod(option)}
                aria-pressed={period === option}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                  period === option
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Last {option}d
              </button>
            ))}
          </div>
        }
      />

      {isError ? (
        <div className="surface-card flex min-h-56 flex-col items-center justify-center gap-2 rounded-xl border p-10 text-center">
          <Activity className="size-8 text-destructive/60" />
          <p className="text-sm font-medium">Failed to load analytics data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <ChartCard title="Status Distribution" icon={PieChartIcon}>
            {statusData.length === 0 ? (
              <EmptyChart message={loadingMessage} />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.status} fill={entry.hex} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
                  {statusData.map((entry) => (
                    <li key={entry.status} className="flex items-center gap-1.5 text-xs">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.hex }} />
                      <span className="text-muted-foreground">{entry.label}</span>
                      <span className="font-semibold tabular-nums">{entry.count}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </ChartCard>

          <ChartCard title="Completion Timeline" icon={LineChartIcon}>
            {!hasData ? (
              <EmptyChart message={loadingMessage} />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={timelineData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={axisStyle}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Completed"
                    stroke="#28a745"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Request Types" icon={TrendingUp}>
            {!hasData ? (
              <EmptyChart message={loadingMessage} />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={typeData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="type" tick={axisStyle} tickLine={false} axisLine={false} />
                  <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--muted)' }} />
                  <Bar dataKey="count" name="Requests" radius={[8, 8, 0, 0]}>
                    {typeData.map((entry) => (
                      <Cell key={entry.type} fill={TYPE_COLORS[entry.type]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Requests by Department" icon={Building2}>
            {departmentData.length === 0 ? (
              <EmptyChart message="No department data." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={departmentData}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={axisStyle}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={axisStyle}
                    tickLine={false}
                    axisLine={false}
                    width={110}
                  />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--muted)' }} />
                  <Bar dataKey="count" name="Requests" fill="#28a745" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Performance Metrics" icon={Activity} className="xl:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MetricItem
                icon={Timer}
                label="Avg. Completion Time"
                value={
                  metrics.avgCompletionDays === null
                    ? '—'
                    : `${metrics.avgCompletionDays.toFixed(1)} days`
                }
                hint={`${metrics.completedCount} completed`}
              />
              <MetricItem
                icon={CheckCircle2}
                label="Success Rate"
                value={`${metrics.successRate}%`}
                hint={`${metrics.completedCount}/${metrics.totalCount} done`}
              />
              <MetricItem
                icon={CalendarClock}
                label="Peak Activity Day"
                value={metrics.peakActivityDay ?? '—'}
                hint={`Last ${period} days`}
              />
            </div>
          </ChartCard>
        </div>
      )}
    </motion.div>
  );
}

function MetricItem({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
