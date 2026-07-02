import { CalendarClock, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDate, isOverdue } from '@/lib/dates';
import type { Request } from '@/types';

interface KanbanCardProps {
  request: Request;
  assigneeName: string;
  departmentName: string;
  onOpen: (request: Request) => void;
}

// NOTE: the board is read-only for now — drag-and-drop between columns is
// disabled (returning in a future update); status changes happen from the
// request detail dialog.
export function KanbanCard({ request, assigneeName, departmentName, onOpen }: KanbanCardProps) {
  const overdue = isOverdue(request.postingDate, request.status);

  return (
    <Card
      size="sm"
      className="surface-card group gap-2 border p-3 transition-shadow hover:shadow-[var(--shadow-soft)]"
    >
      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpen(request)}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold">
            {request.title || 'Untitled request'}
          </h3>
          {request.requestType && (
            <Badge variant="outline" className="shrink-0 text-[10px]">
              {request.requestType}
            </Badge>
          )}
        </div>

        <p className="mt-1 truncate text-xs text-muted-foreground">{departmentName}</p>

        <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
          <span
            className={cn(
              'inline-flex items-center gap-1',
              overdue && 'font-semibold text-destructive',
            )}
          >
            <CalendarClock className="size-3.5" />
            {formatDate(request.postingDate)}
            {overdue && ' · Overdue'}
          </span>
          <span className="inline-flex items-center gap-1">
            <User className="size-3.5" />
            {assigneeName}
          </span>
        </div>
      </button>
    </Card>
  );
}
