import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  ScrollText,
  Search,
} from 'lucide-react';

import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuditEvents } from '@/hooks/useAuditEvents';
import { useDiscordNames } from '@/hooks/useDiscordNames';
import { exportToCsv } from '@/lib/csv';
import { formatDateTime, parseLocalDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import type { AuditEvent } from '@/types';
import {
  ALL_VALUE,
  BOT_ID,
  distinctValues,
  eventTypeCounts,
  eventTypeVariant,
  performerName,
} from '@/features/audit/utils';

const PAGE_SIZE = 25;

export function AuditPage() {
  const { data, isLoading, isError, refetch } = useAuditEvents();
  const events = useMemo(() => data ?? [], [data]);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(ALL_VALUE);
  const [entityFilter, setEntityFilter] = useState(ALL_VALUE);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  // Resolve every non-bot performer id to a display name (deduped in the hook).
  const performerIds = useMemo(
    () =>
      events
        .map((event) => event.performedBy)
        .filter((id) => id && String(id) !== BOT_ID),
    [events],
  );
  const { data: names } = useDiscordNames(performerIds);

  const eventTypes = useMemo(() => distinctValues(events, 'eventType'), [events]);
  const entityTypes = useMemo(() => distinctValues(events, 'entityType'), [events]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const from = fromDate ? parseLocalDate(fromDate) : null;
    const to = toDate ? parseLocalDate(toDate) : null;
    if (to) to.setHours(23, 59, 59, 999);

    return events.filter((event) => {
      if (term) {
        const haystack = [
          event.eventType,
          event.entityType,
          String(event.entityId ?? ''),
          performerName(event.performedBy, names),
          event.performedBy,
          event.eventDetails,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (typeFilter !== ALL_VALUE && event.eventType !== typeFilter) return false;
      if (entityFilter !== ALL_VALUE && event.entityType !== entityFilter) return false;

      if (from || to) {
        const when = parseLocalDate(event.eventTimestamp);
        if (!when) return false;
        if (from && when < from) return false;
        if (to && when > to) return false;
      }
      return true;
    });
  }, [events, search, typeFilter, entityFilter, fromDate, toDate, names]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamp the page when the filtered set shrinks; state stays the source of truth.
  const currentPage = Math.min(page, totalPages);
  const pageEvents = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  const breakdown = useMemo(() => eventTypeCounts(filtered), [filtered]);

  const hasActiveFilters =
    search.trim() !== '' ||
    typeFilter !== ALL_VALUE ||
    entityFilter !== ALL_VALUE ||
    fromDate !== '' ||
    toDate !== '';

  function resetFilters() {
    setSearch('');
    setTypeFilter(ALL_VALUE);
    setEntityFilter(ALL_VALUE);
    setFromDate('');
    setToDate('');
    setPage(1);
  }

  function handleExport() {
    const rows = filtered.map((event) => ({
      Id: String(event.id ?? ''),
      Timestamp: event.eventTimestamp ?? '',
      'Event Type': event.eventType ?? '',
      'Entity Type': event.entityType ?? '',
      'Entity Id': String(event.entityId ?? ''),
      'Performed By': performerName(event.performedBy, names),
      Details: event.eventDetails ?? '',
    }));
    const stamp = new Date().toISOString().split('T')[0];
    exportToCsv(`audit-log-${stamp}.csv`, rows);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <PageHeader
        title="Audit Log"
        description="History of every change made to requests."
        emoji="📜"
        actions={
          <>
            <Button variant="outline" onClick={() => void refetch()}>
              <RotateCcw />
              Refresh
            </Button>
            <Button onClick={handleExport} disabled={filtered.length === 0}>
              <Download />
              Export CSV
            </Button>
          </>
        }
      />

      <StatBar total={events.length} filtered={filtered.length} breakdown={breakdown} />

      <div className="surface-card space-y-4 rounded-xl border border-border/60 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="audit-search">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="audit-search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search events..."
                className="pl-8"
              />
            </div>
          </div>

          <FilterSelect
            id="audit-type"
            label="Event Type"
            placeholder="All event types"
            value={typeFilter}
            options={eventTypes}
            onChange={(value) => {
              setTypeFilter(value);
              setPage(1);
            }}
          />

          <FilterSelect
            id="audit-entity"
            label="Entity Type"
            placeholder="All entity types"
            value={entityFilter}
            options={entityTypes}
            onChange={(value) => {
              setEntityFilter(value);
              setPage(1);
            }}
          />

          <div className="space-y-1.5">
            <Label htmlFor="audit-from">From</Label>
            <Input
              id="audit-from"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => {
                setFromDate(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="audit-to">To</Label>
            <Input
              id="audit-to"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => {
                setToDate(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <RotateCcw />
              Clear filters
            </Button>
          </div>
        )}
      </div>

      <div className="surface-card overflow-hidden rounded-xl border border-border/60">
        <AuditTable
          events={pageEvents}
          names={names}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
        />
      </div>

      {filtered.length > 0 && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      )}
    </motion.div>
  );
}

function StatBar({
  total,
  filtered,
  breakdown,
}: {
  total: number;
  filtered: number;
  breakdown: Array<[string, number]>;
}) {
  return (
    <div className="surface-card flex flex-wrap items-center gap-4 rounded-xl border border-border/60 p-4">
      <Stat label="Total Events" value={total} />
      <div className="h-8 w-px bg-border" />
      <Stat label="Filtered" value={filtered} />
      {breakdown.length > 0 && <div className="h-8 w-px bg-border" />}
      <div className="flex flex-wrap items-center gap-2">
        {breakdown.slice(0, 6).map(([type, count]) => (
          <Badge key={type} variant={eventTypeVariant(type)} className="gap-1.5">
            {type}
            <span className="font-semibold tabular-nums">{count}</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function FilterSelect({
  id,
  label,
  placeholder,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(next) => onChange(next as string)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function AuditTable({
  events,
  names,
  isLoading,
  isError,
  onRetry,
}: {
  events: AuditEvent[];
  names: Record<string, string> | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
        Loading audit events...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">Failed to load audit events.</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw />
          Try again
        </Button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-2 text-center">
        <ScrollText className="size-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">No audit events found</p>
        <p className="text-xs text-muted-foreground">
          Try adjusting your filters or date range.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-border bg-muted text-left text-xs uppercase tracking-wide text-primary dark:text-foreground">
            <th className="px-4 py-3 font-semibold">Timestamp</th>
            <th className="px-4 py-3 font-semibold">Event Type</th>
            <th className="px-4 py-3 font-semibold">Entity Type</th>
            <th className="px-4 py-3 font-semibold">Entity Id</th>
            <th className="px-4 py-3 font-semibold">Performed By</th>
            <th className="px-4 py-3 font-semibold">Details</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const isBot = String(event.performedBy) === BOT_ID;
            return (
              <tr
                key={String(event.id)}
                className="border-b border-border/40 last:border-0 hover:bg-muted/40"
              >
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {formatDateTime(event.eventTimestamp)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={eventTypeVariant(event.eventType)}>
                    {event.eventType || 'Unknown'}
                  </Badge>
                </td>
                <td className="px-4 py-3">{event.entityType || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {event.entityId ? String(event.entityId) : '—'}
                </td>
                <td className={cn('px-4 py-3', isBot && 'text-muted-foreground')}>
                  {performerName(event.performedBy, names)}
                </td>
                <td className="max-w-md px-4 py-3 text-muted-foreground">
                  <span className="line-clamp-2 break-words" title={event.eventDetails}>
                    {event.eventDetails || '—'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">
        Showing {first}–{last} of {totalItems} · Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={page <= 1}>
          <ChevronLeft />
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={page >= totalPages}>
          Next
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
