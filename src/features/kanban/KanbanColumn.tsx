import { cn } from '@/lib/utils';
import { statusColor, statusLabel } from '@/lib/status';
import type { Request, RequestStatus } from '@/types';

import { KanbanCard } from './KanbanCard';

export function KanbanColumn({
  status,
  requests,
  nameFor,
  departmentFor,
  onOpen,
}: {
  status: RequestStatus;
  requests: Request[];
  nameFor: (id: number | undefined) => string;
  departmentFor: (id: number | undefined) => string;
  onOpen: (request: Request) => void;
}) {
  const color = statusColor(status);

  return (
    <div className="flex min-w-[260px] flex-1 flex-col overflow-hidden rounded-xl border bg-muted/30">
      <div
        className={cn('flex items-center justify-between gap-2 border-b-2 px-4 py-3', color.border)}
        style={{ backgroundColor: `${color.hex}1a` }}
      >
        <span className="text-sm font-semibold">{statusLabel(status)}</span>
        <span
          className={cn(
            'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold',
            color.badge,
          )}
        >
          {requests.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {requests.length === 0 ? (
          <p className="rounded-xl border border-dashed py-6 text-center text-xs text-muted-foreground">
            No items
          </p>
        ) : (
          requests.map((request) => (
            <KanbanCard
              key={String(request.channelID)}
              request={request}
              assigneeName={nameFor(request.assignedToID)}
              departmentName={departmentFor(request.requesterDepartmentID)}
              onOpen={onOpen}
            />
          ))
        )}
      </div>
    </div>
  );
}
