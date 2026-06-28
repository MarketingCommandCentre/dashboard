import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import { formatDate, isOverdue } from '@/lib/dates';
import { useDiscordNames } from '@/hooks/useDiscordNames';
import { CalendarClock, User } from 'lucide-react';
import type { Request } from '@/types';

export function RequestCard({
  request,
  onClick,
  className,
}: {
  request: Request;
  onClick?: (request: Request) => void;
  className?: string;
}) {
  const { data: names } = useDiscordNames([request.assignedToID]);
  const assigneeName = request.assignedToID
    ? (names?.[String(request.assignedToID)] ?? `User ${request.assignedToID}`)
    : 'Unassigned';
  const overdue = isOverdue(request.postingDate, request.status);

  return (
    <Card
      size="sm"
      className={cn(
        'cursor-pointer gap-2 p-4 transition-shadow hover:shadow-[var(--shadow-soft)]',
        className,
      )}
      onClick={() => onClick?.(request)}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 text-sm font-semibold">{request.title || 'Untitled request'}</h3>
        {request.requestType && (
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {request.requestType}
          </Badge>
        )}
      </div>

      <StatusBadge status={request.status} className="w-fit" />

      <div className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground">
        <span className={cn('inline-flex items-center gap-1', overdue && 'font-semibold text-destructive')}>
          <CalendarClock className="size-3.5" />
          {formatDate(request.postingDate)}
          {overdue && ' · Overdue'}
        </span>
        <span className="inline-flex items-center gap-1">
          <User className="size-3.5" />
          {assigneeName}
        </span>
      </div>
    </Card>
  );
}
