import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { statusLabel, statusColor } from '@/lib/status';
import type { RequestStatus } from '@/types';

export function StatusBadge({
  status,
  className,
}: {
  status: RequestStatus | undefined;
  className?: string;
}) {
  const color = statusColor(status);
  return (
    <Badge variant="secondary" className={cn(color.badge, 'font-medium', className)}>
      {statusLabel(status)}
    </Badge>
  );
}
