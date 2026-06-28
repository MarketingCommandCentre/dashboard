import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { statusLabel, statusColor } from '@/lib/status';
import { parseLocalDate } from '@/lib/dates';
import { useDiscordNames, useDiscordRoleNames } from '@/hooks/useDiscordNames';
import type { Request } from '@/types';

// Guild the marketing command-centre channels live in (overridable per env).
const GUILD_ID =
  (import.meta.env.VITE_DISCORD_GUILD_ID as string | undefined) ?? '1165706299393183754';

const REQUEST_TYPE_LABELS: Record<string, string> = {
  POST: 'Post',
  REEL: 'Reel',
};

const dueDateFmt = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});
const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });

type Urgency = 'overdue' | 'urgent' | 'normal';

export function RequestDetailDialog({
  request,
  open,
  onOpenChange,
}: {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: names } = useDiscordNames([request?.assignedToID, request?.requesterID]);
  const { data: roleNames } = useDiscordRoleNames([request?.requesterDepartmentID]);

  if (!request) return null;

  const channelId = request.channelID;
  const typeLabel = request.requestType
    ? (REQUEST_TYPE_LABELS[request.requestType] ?? request.requestType)
    : 'Request';
  const color = statusColor(request.status);

  const assigneeName = request.assignedToID
    ? (names?.[String(request.assignedToID)] ?? `User ${request.assignedToID}`)
    : 'Unassigned';
  const requesterName = request.requesterID
    ? (names?.[String(request.requesterID)] ?? `User ${request.requesterID}`)
    : 'Unknown';
  const departmentName = request.requesterDepartmentID
    ? (roleNames?.[String(request.requesterDepartmentID)] ?? `Role ${request.requesterDepartmentID}`)
    : undefined;

  // Due-date urgency, matching the original dashboard's logic.
  const due = request.postingDate ? parseLocalDate(request.postingDate) : null;
  let daysUntil: number | null = null;
  let urgency: Urgency = 'normal';
  if (due) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    daysUntil = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
    const terminal = request.status === 'DONE' || request.status === 'BLOCKED';
    if (!terminal && daysUntil < 0) urgency = 'overdue';
    else if (!terminal && daysUntil <= 2) urgency = 'urgent';
  }
  const urgencyText =
    daysUntil === null
      ? undefined
      : urgency === 'overdue'
        ? `⚠️ ${Math.abs(daysUntil)} days overdue`
        : urgency === 'urgent'
          ? `🔥 ${daysUntil} days left`
          : `📅 ${daysUntil} days until due`;

  const createdAt = request.createdAt ? new Date(request.createdAt) : null;
  const updatedAt = request.updatedAt ? new Date(request.updatedAt) : createdAt;
  const discordLink = `https://discord.com/channels/${GUILD_ID}/${channelId}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="block max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-[700px]">
        {/* Header */}
        <div className="relative border-b border-border px-6 pt-6 pb-5 sm:px-8 sm:pt-8">
          <div className="mr-12 flex flex-col gap-3">
            <span className="app-gradient inline-flex w-fit items-center rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
              {typeLabel}
            </span>
            <DialogTitle className="text-2xl font-bold leading-tight text-primary sm:text-[1.75rem]">
              {request.title || 'Untitled request'}
            </DialogTitle>
          </div>
          <span
            className="absolute top-6 right-14 rounded-full border-2 px-3 py-1.5 text-sm font-semibold sm:top-8"
            style={{
              backgroundColor: `${color.hex}20`,
              color: color.hex,
              borderColor: color.hex,
            }}
          >
            {statusLabel(request.status)}
          </span>
        </div>

        {/* Body */}
        <div className="max-h-[calc(90vh-7rem)] overflow-y-auto px-6 py-6 sm:px-8 sm:py-7">
          {/* Description */}
          <section className="mb-7">
            <div className="mb-3 flex items-center gap-2 text-primary">
              <FileText className="size-5 text-accent" />
              <h3 className="text-[1.05rem] font-semibold">Description</h3>
            </div>
            <div className="whitespace-pre-wrap rounded-lg border-l-4 border-l-accent bg-muted p-4 text-sm leading-relaxed text-muted-foreground">
              {request.description?.trim() || 'No description provided'}
            </div>
          </section>

          {/* Details grid */}
          <div className="mb-7 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
            <DetailCard icon="📅" label="Due Date" urgency={urgency}>
              <div className="font-semibold text-primary">
                {due ? dueDateFmt.format(due) : 'No date'}
              </div>
              {urgencyText && (
                <div
                  className={cn(
                    'text-[0.8rem] text-muted-foreground',
                    urgency === 'overdue' && 'font-semibold text-destructive',
                    urgency === 'urgent' && 'font-semibold text-[#e6a700]',
                  )}
                >
                  {urgencyText}
                </div>
              )}
            </DetailCard>

            <DetailCard icon="👥" label="Requested By">
              <div className="truncate font-semibold text-primary">{requesterName}</div>
              {departmentName && (
                <div className="truncate text-[0.8rem] text-muted-foreground">{departmentName}</div>
              )}
            </DetailCard>

            <DetailCard icon="👤" label="Assigned To">
              <div className="truncate font-semibold text-primary">{assigneeName}</div>
              {request.assignedToID && (
                <div className="truncate text-[0.8rem] text-muted-foreground">
                  ID: {String(request.assignedToID)}
                </div>
              )}
            </DetailCard>

            {request.room && (
              <DetailCard icon="📍" label="Location">
                <div className="truncate font-semibold text-primary">{request.room}</div>
              </DetailCard>
            )}

            {createdAt && (
              <DetailCard icon="🕒" label="Created">
                <div className="font-semibold text-primary">{dateFmt.format(createdAt)}</div>
                <div className="text-[0.8rem] text-muted-foreground">{timeFmt.format(createdAt)}</div>
              </DetailCard>
            )}
          </div>

          {/* Actions */}
          <div className="mb-7 flex flex-wrap gap-4">
            <a
              href={discordLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-[200px] flex-1 items-center justify-center gap-2.5 rounded-[10px] border-2 border-[#5865F2] bg-[#5865F2] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#4752c4]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Open in Discord
            </a>
            {request.signupUrl && (
              <a
                href={request.signupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-[200px] flex-1 items-center justify-center gap-2.5 rounded-[10px] border-2 border-[#003d7a] bg-transparent px-6 py-3 font-semibold text-[#003d7a] transition-colors hover:bg-[#003d7a] hover:text-white dark:border-primary dark:text-primary"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Open Signup Form
              </a>
            )}
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-x-8 gap-y-2 rounded-lg border-t-2 border-border bg-muted p-4 text-[0.8rem]">
            <div className="flex gap-2">
              <span className="font-semibold text-muted-foreground">Channel ID:</span>
              <span className="font-mono text-foreground/80">{String(channelId)}</span>
            </div>
            {updatedAt && (
              <div className="flex gap-2">
                <span className="font-semibold text-muted-foreground">Last Updated:</span>
                <span className="font-mono text-foreground/80">
                  {dateFmt.format(updatedAt)} at {timeFmt.format(updatedAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogDescription className="sr-only">
          Read-only details for request {String(channelId)}.
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

function DetailCard({
  icon,
  label,
  urgency = 'normal',
  children,
}: {
  icon: string;
  label: string;
  urgency?: Urgency;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex gap-4 rounded-xl border-2 border-transparent bg-muted p-5 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-[var(--shadow-soft)]',
        urgency === 'overdue' && 'border-destructive/70 bg-destructive/10',
        urgency === 'urgent' && 'border-[#f0c000]/70 bg-[#ffc107]/10',
      )}
    >
      <span className="text-3xl leading-none">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        {children}
      </div>
    </div>
  );
}
