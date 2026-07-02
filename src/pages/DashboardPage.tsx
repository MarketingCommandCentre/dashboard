import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { RequestDetailDialog } from '@/components/RequestDetailDialog';
import { useRequests } from '@/hooks/useRequests';
import type { Request } from '@/types';

import { StatCards } from '@/features/dashboard/StatCards';
import { computeOverviewStats } from '@/features/dashboard/stats';
import { RecentActivity } from '@/features/dashboard/RecentActivity';
import { QuickActions } from '@/features/dashboard/QuickActions';
import { MiniCalendar } from '@/features/dashboard/MiniCalendar';
import { CurrentCycle } from '@/features/dashboard/CurrentCycle';

const intro = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

export function DashboardPage() {
  const { data, isLoading, isFetching, refetch } = useRequests();
  const requests = useMemo<Request[]>(() => data ?? [], [data]);
  const stats = useMemo(() => computeOverviewStats(requests), [requests]);

  const [selected, setSelected] = useState<Request | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openRequest = (request: Request) => {
    setSelected(request);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of marketing requests and cycle status."
        emoji="📊"
        actions={
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? 'size-4 animate-spin' : 'size-4'} />
            Refresh
          </Button>
        }
      />

      <StatCards stats={stats} loading={isLoading} />

      {/* Main feed + compact rail, then the cycle band across the bottom. */}
      <motion.div {...intro} className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity requests={requests} loading={isLoading} onSelect={openRequest} />
        </div>
        <div className="flex flex-col gap-4">
          <QuickActions onRefresh={() => refetch()} refreshing={isFetching} />
          <MiniCalendar requests={requests} />
        </div>
      </motion.div>

      <motion.div {...intro}>
        <CurrentCycle />
      </motion.div>

      <RequestDetailDialog
        request={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
