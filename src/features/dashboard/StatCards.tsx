import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { OverviewStats } from '@/features/dashboard/stats';

interface StatDef {
  key: keyof OverviewStats;
  label: string;
  accent: string;
}

const STAT_DEFS: StatDef[] = [
  { key: 'total', label: 'Total Events', accent: 'text-primary dark:text-foreground' },
  { key: 'pending', label: 'Pending', accent: 'text-[#3498db]' },
  { key: 'completed', label: 'Completed', accent: 'text-[#27ae60]' },
  { key: 'overdue', label: 'Overdue', accent: 'text-destructive' },
];

// Light-gray stat tiles with a big bold number, matching the original
// dashboard's `.stat-item` / `.stat-number` look.
export function StatCards({ stats, loading }: { stats: OverviewStats; loading?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {STAT_DEFS.map((def, i) => (
        <motion.div
          key={def.key}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          className="rounded-lg bg-muted p-4 text-center transition-transform hover:-translate-y-0.5"
        >
          <span className={cn('block text-[2rem] font-bold leading-none tabular-nums', def.accent)}>
            {loading ? '—' : stats[def.key]}
          </span>
          <span className="mt-2 block text-[0.8rem] text-muted-foreground">{def.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
