import type { HTMLAttributes, Ref } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarClock, ChevronRight, GripVertical, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDate, isOverdue } from '@/lib/dates';
import { nextStatus, statusLabel } from '@/lib/status';
import type { Request } from '@/types';

interface KanbanCardProps {
  request: Request;
  assigneeName: string;
  departmentName: string;
  onOpen: (request: Request) => void;
  onAdvance: (request: Request) => void;
}

/**
 * Presentational card. Drag handle props are optional so this can be rendered
 * both as a sortable item and inside a DragOverlay (which must NOT register a
 * second sortable node with the same id).
 */
function KanbanCardView({
  request,
  assigneeName,
  departmentName,
  onOpen,
  onAdvance,
  cardRef,
  style,
  className,
  dragging,
  handleProps,
}: KanbanCardProps & {
  cardRef?: Ref<HTMLDivElement>;
  style?: HTMLAttributes<HTMLDivElement>['style'];
  className?: string;
  dragging?: boolean;
  handleProps?: HTMLAttributes<HTMLButtonElement>;
}) {
  const overdue = isOverdue(request.postingDate, request.status);
  const canAdvance =
    request.status !== undefined &&
    request.status !== 'DONE' &&
    request.status !== 'BLOCKED' &&
    nextStatus(request.status) !== request.status;

  return (
    <Card
      ref={cardRef}
      size="sm"
      style={style}
      className={cn(
        'surface-card group gap-2 border p-3 transition-shadow hover:shadow-[var(--shadow-soft)]',
        dragging && 'opacity-50 ring-2 ring-primary/40',
        className,
      )}
    >
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          aria-label="Drag card"
          className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
          {...handleProps}
        >
          <GripVertical className="size-4" />
        </button>
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
      </div>

      {canAdvance && (
        <Button
          variant="ghost"
          size="xs"
          className="w-full justify-center text-muted-foreground"
          onClick={() => onAdvance(request)}
        >
          Advance to {statusLabel(nextStatus(request.status!))}
          <ChevronRight className="size-3.5" />
        </Button>
      )}
    </Card>
  );
}

/** Sortable kanban card used inside a column. */
export function KanbanCard(props: KanbanCardProps) {
  const id = String(props.request.channelID);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { request: props.request },
  });

  return (
    <KanbanCardView
      {...props}
      cardRef={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      dragging={isDragging}
      handleProps={{ ...attributes, ...listeners }}
    />
  );
}

/** Non-sortable presentation for the DragOverlay (avoids duplicate sortable ids). */
export function KanbanCardOverlay(props: KanbanCardProps) {
  return <KanbanCardView {...props} className="rotate-2 shadow-[var(--shadow-soft)]" />;
}
