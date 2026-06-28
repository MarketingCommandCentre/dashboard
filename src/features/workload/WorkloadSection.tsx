import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Inbox, type LucideIcon } from 'lucide-react';
import { useWorkload } from '@/hooks/useWorkload';
import { useDiscordNames } from '@/hooks/useDiscordNames';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn, initials } from '@/lib/utils';
import { statusColor, statusLabel } from '@/lib/status';
import type { Request, WorkloadKind } from '@/types';
import {
  getRequests,
  groupByAssignee,
  isAggregateShape,
  summarizeMemberMap,
  type MemberLoad,
  type MemberSummary,
} from './shape';

interface WorkloadSectionProps {
  kind: Exclude<WorkloadKind, 'cycle-info'>;
  title: string;
  icon: LucideIcon;
  /** Stagger delay for the section intro. */
  delay?: number;
}

function nameFor(id: string, names: Record<string, string> | undefined): string {
  const resolved = names?.[id];
  if (resolved && resolved.trim() !== '') return resolved;
  return `User ${id.slice(0, 6)}…`;
}

function MemberAvatar({ name }: { name: string }) {
  return (
    <Avatar>
      <AvatarFallback>{initials(name) || '?'}</AvatarFallback>
    </Avatar>
  );
}

function statusCounts(requests: Request[]): Array<{ status: string; count: number }> {
  const counts = new Map<string, number>();
  for (const request of requests) {
    const key = request.status ?? 'IN_QUEUE';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([status, count]) => ({ status, count }));
}

/** A member row built from grouped request objects (aggregate shape). */
function AssigneeRow({
  member,
  name,
}: {
  member: MemberLoad;
  name: string;
}) {
  const counts = statusCounts(member.requests);
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card/60 px-4 py-3">
      <MemberAvatar name={name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {counts.map(({ status, count }) => (
            <span
              key={status}
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-medium',
                statusColor(status as Request['status']).badge,
              )}
            >
              {statusLabel(status as Request['status'])} · {count}
            </span>
          ))}
        </div>
      </div>
      <Badge variant="secondary" className="shrink-0 tabular-nums">
        {member.requests.length}
      </Badge>
    </div>
  );
}

/** A member row built from an unknown member-map entry (defensive). */
function SummaryRow({ summary, name }: { summary: MemberSummary; name: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card/60 px-4 py-3">
      <MemberAvatar name={name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        {summary.fields.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {summary.fields.map((field) => (
              <span key={field.label}>
                <span className="font-medium text-foreground/80">{field.label}:</span> {field.value}
              </span>
            ))}
          </div>
        )}
      </div>
      {summary.count !== null && (
        <Badge variant="secondary" className="shrink-0 tabular-nums">
          {summary.count}
        </Badge>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed py-10 text-center">
      <Inbox className="size-7 text-muted-foreground/50" />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

export function WorkloadSection({ kind, title, icon: Icon, delay = 0 }: WorkloadSectionProps) {
  const { data, isLoading, isError } = useWorkload(kind);

  const aggregate = isAggregateShape(data);
  const members = useMemo<MemberLoad[]>(
    () => (aggregate ? groupByAssignee(getRequests(data)) : []),
    [aggregate, data],
  );
  const summaries = useMemo<MemberSummary[]>(
    () => (aggregate ? [] : summarizeMemberMap(data)),
    [aggregate, data],
  );

  const ids = aggregate ? members.map((m) => m.id) : summaries.map((s) => s.id);
  const { data: names } = useDiscordNames(ids);

  const role = aggregate && typeof data?.role === 'string' ? (data.role as string) : title;
  const total = aggregate
    ? typeof data?.totalRequests === 'number'
      ? (data.totalRequests as number)
      : getRequests(data).length
    : summaries.length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="surface-card flex flex-col gap-4 rounded-[28px] border p-5"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-4.5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold leading-tight">{title}</h2>
            <p className="text-[11px] text-muted-foreground">{role}</p>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 tabular-nums">
          {total} total
        </Badge>
      </header>

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted/60" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed py-10 text-center">
            <AlertCircle className="size-7 text-destructive/60" />
            <p className="text-xs text-muted-foreground">Couldn&apos;t load workload for this role.</p>
          </div>
        ) : aggregate ? (
          members.length > 0 ? (
            members.map((member) => (
              <AssigneeRow key={member.id} member={member} name={nameFor(member.id, names)} />
            ))
          ) : (
            <EmptyState message="No assigned work in the current cycle." />
          )
        ) : summaries.length > 0 ? (
          summaries.map((summary) => (
            <SummaryRow key={summary.id} summary={summary} name={nameFor(summary.id, names)} />
          ))
        ) : (
          <EmptyState message="No team members to show." />
        )}
      </div>
    </motion.section>
  );
}
