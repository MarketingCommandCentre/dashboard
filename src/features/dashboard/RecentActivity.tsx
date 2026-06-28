import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge } from '@/components/StatusBadge';
import { relativeTime } from '@/lib/dates';
import { Clock } from 'lucide-react';
import type { Request } from '@/types';

function sortByUpdated(requests: Request[]): Request[] {
  return requests
    .slice()
    .sort((a, b) => {
      const at = a.updatedAt ?? a.createdAt ?? '';
      const bt = b.updatedAt ?? b.createdAt ?? '';
      return bt.localeCompare(at);
    })
    .slice(0, 6);
}

export function RecentActivity({
  requests,
  loading,
  onSelect,
}: {
  requests: Request[];
  loading?: boolean;
  onSelect: (request: Request) => void;
}) {
  const recent = sortByUpdated(requests);

  return (
    <Card className="surface-card flex h-full flex-col border">
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {loading ? (
          <p className="p-5 text-sm text-muted-foreground">Loading recent activity…</p>
        ) : recent.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <ScrollArea className="h-[280px]">
            <ul className="flex flex-col gap-2 p-4">
              {recent.map((r) => (
                <li key={String(r.channelID)}>
                  <button
                    type="button"
                    onClick={() => onSelect(r)}
                    className="group flex w-full items-center gap-3 rounded-md border-l-[3px] border-l-accent bg-muted px-3 py-2.5 text-left transition-colors hover:bg-accent/10"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-primary transition-colors group-hover:text-accent dark:text-foreground">
                        {r.title || 'Untitled request'}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {r.requestType ? `${r.requestType} · ` : ''}
                        {relativeTime(r.updatedAt ?? r.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={r.status} className="shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
