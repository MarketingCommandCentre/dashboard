import { motion } from 'framer-motion';
import { CalendarCheck2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { OverviewStats } from '@/features/dashboard/stats';

interface StatDef {
  key: keyof OverviewStats;
  label: string;
  icon: LucideIcon;
  accent: string;
}

const STAT_DEFS: StatDef[] = [
  { key: 'total', label: 'Total Events', icon: CalendarCheck2, accent: 'text-primary' },
  { key: 'pending', label: 'Pending', icon: Clock, accent: 'text-blue-500' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, accent: 'text-emerald-500' },
  { key: 'overdue', label: 'Overdue', icon: AlertTriangle, accent: 'text-red-500' },
];

export function StatCards({ stats, loading }: { stats: OverviewStats; loading?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {STAT_DEFS.map((def, i) => {
        const Icon = def.icon;
        return (
          <motion.div
            key={def.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Card className="surface-card flex-row items-center gap-4 border p-5">
              <span
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/60',
                  def.accent,
                )}
              >
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-2xl font-semibold tabular-nums leading-none">
                  {loading ? '—' : stats[def.key]}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {def.label}
                </p>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
