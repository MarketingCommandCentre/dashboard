import { useQuery } from '@tanstack/react-query';
import { getRequests } from '@/lib/api';
import { cn } from '@/lib/utils';

type Status = 'connecting' | 'connected' | 'offline';

/**
 * Lightweight backend health indicator. Pings GET /api/requests on an interval
 * and reflects connectivity in the header.
 */
export function ApiStatusPill({ className }: { className?: string }) {
  const { isLoading, isError, isSuccess, fetchStatus } = useQuery({
    queryKey: ['api-status'],
    queryFn: () => getRequests(),
    refetchInterval: 60_000,
    retry: false,
    staleTime: 30_000,
  });

  let status: Status = 'connecting';
  if (isSuccess) status = 'connected';
  else if (isError) status = 'offline';
  else if (isLoading && fetchStatus === 'fetching') status = 'connecting';

  const meta: Record<Status, { label: string; dot: string; text: string }> = {
    connecting: { label: '🔄 Connecting', dot: 'bg-amber-400', text: 'text-amber-600 dark:text-amber-300' },
    connected: { label: '🟢 Connected', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-300' },
    offline: { label: '🔴 Offline', dot: 'bg-red-500', text: 'text-red-600 dark:text-red-300' },
  };

  const { label, dot, text } = meta[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium',
        text,
        className,
      )}
      title="Backend connection status"
    >
      <span className={cn('size-1.5 rounded-full', dot)} aria-hidden />
      {label}
    </span>
  );
}
