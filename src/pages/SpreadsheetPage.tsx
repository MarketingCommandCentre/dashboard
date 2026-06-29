import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Search,
} from 'lucide-react';

import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { RequestDetailDialog } from '@/components/RequestDetailDialog';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useRequests } from '@/hooks/useRequests';
import { useDiscordNames, useDiscordRoleNames } from '@/hooks/useDiscordNames';
import { STATUS_ORDER, statusLabel } from '@/lib/status';
import { formatDate, formatDateTime, isOverdue } from '@/lib/dates';
import { exportToCsv } from '@/lib/csv';
import { cn } from '@/lib/utils';
import type { Request, RequestStatus, RequestType } from '@/types';

import { MultiSelectFilter } from '@/features/spreadsheet/MultiSelectFilter';
import {
  compareRows,
  formatRequestType,
  resolveDepartment,
  resolveName,
  type SortDir,
  type SortKey,
  type SpreadsheetRow,
} from '@/features/spreadsheet/helpers';

const REQUEST_TYPES: RequestType[] = ['POST', 'REEL'];
const STATUS_RANK = new Map<RequestStatus, number>(STATUS_ORDER.map((s, i) => [s, i]));

interface Column {
  key: SortKey;
  label: string;
}

const COLUMNS: Column[] = [
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Type' },
  { key: 'department', label: 'Department' },
  { key: 'requester', label: 'Requester' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'postingDate', label: 'Posting Date' },
  { key: 'createdAt', label: 'Created' },
  { key: 'room', label: 'Room' },
  { key: 'signup', label: 'Signup' },
];

export function SpreadsheetPage() {
  const { data: requests, isLoading, isError } = useRequests();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('postingDate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selected, setSelected] = useState<Request | null>(null);

  const all = useMemo(() => requests ?? [], [requests]);

  // Resolve names for everyone referenced so the table + filters can display them.
  const userIds = useMemo(
    () => all.flatMap((r) => [r.requesterID, r.assignedToID]),
    [all],
  );
  const deptIds = useMemo(() => all.map((r) => r.requesterDepartmentID), [all]);
  const { data: names } = useDiscordNames(userIds);
  const { data: roleNames } = useDiscordRoleNames(deptIds);

  // Enrich each request with resolved display strings (used by filter + sort).
  const rows = useMemo<SpreadsheetRow[]>(
    () =>
      all.map((request) => ({
        request,
        title: request.title ?? 'Untitled',
        type: formatRequestType(request.requestType),
        department: resolveDepartment(request.requesterDepartmentID, roleNames),
        requester: resolveName(request.requesterID, names, 'Unknown'),
        assignee: resolveName(
          request.assignedToID,
          names,
          request.status === 'DONE' ? 'Completed' : 'Unassigned',
        ),
        room: request.room ?? '',
        signup: request.signupUrl ?? '',
      })),
    [all, names, roleNames],
  );

  const deptOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of rows) {
      const id = row.request.requesterDepartmentID;
      if (id === undefined || id === null) continue;
      seen.set(String(id), row.department);
    }
    return Array.from(seen, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [rows]);

  const statusOptions = STATUS_ORDER.map((s) => ({ value: s, label: statusLabel(s) }));

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const r = row.request;
      if (statusFilter.length > 0 && !(r.status && statusFilter.includes(r.status))) {
        return false;
      }
      if (typeFilter !== 'all' && r.requestType !== typeFilter) return false;
      if (
        deptFilter.length > 0 &&
        !(r.requesterDepartmentID != null && deptFilter.includes(String(r.requesterDepartmentID)))
      ) {
        return false;
      }
      if (term) {
        const haystack = [
          row.title,
          r.description,
          row.requester,
          row.assignee,
          row.department,
          statusLabel(r.status),
          row.type,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [rows, search, statusFilter, typeFilter, deptFilter]);

  const sorted = useMemo(() => {
    const statusRank = (r: Request) =>
      r.status ? (STATUS_RANK.get(r.status) ?? STATUS_ORDER.length) : STATUS_ORDER.length;
    const next = [...filtered].sort((a, b) => compareRows(a, b, sortKey, statusRank));
    return sortDir === 'asc' ? next : next.reverse();
  }, [filtered, sortKey, sortDir]);

  const summary = useMemo(() => buildSummary(filtered), [filtered]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function handleExport() {
    exportToCsv(
      'msa-spreadsheet-view.csv',
      sorted.map((row) => ({
        Title: row.title,
        Status: statusLabel(row.request.status),
        Type: row.type,
        Department: row.department,
        Requester: row.requester,
        Assignee: row.assignee,
        'Posting Date': formatDate(row.request.postingDate),
        Created: formatDateTime(row.request.createdAt),
        Room: row.room,
        Signup: row.signup,
        'Channel ID': String(row.request.channelID),
      })),
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="section-shell space-y-6"
    >
      <PageHeader
        title="Spreadsheet"
        description="Sortable table of every request."
        emoji="🧾"
        actions={
          <Button variant="outline" size="sm" onClick={handleExport} disabled={sorted.length === 0}>
            <Download className="size-4" />
            Export CSV
          </Button>
        }
      />

      {/* Filter bar */}
      <Card className="surface-card flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, people, type…"
            className="pl-9"
          />
        </div>
        <MultiSelectFilter
          label="Statuses"
          allLabel="All Statuses"
          options={statusOptions}
          selected={statusFilter}
          onChange={setStatusFilter}
        />
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value ?? 'all')}>
          <SelectTrigger className="h-9 w-[11rem]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {REQUEST_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {formatRequestType(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <MultiSelectFilter
          label="Departments"
          allLabel="All Departments"
          options={deptOptions}
          selected={deptFilter}
          onChange={setDeptFilter}
        />
      </Card>

      {/* Summary line */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium">
          {sorted.length} shown
          {all.length > 0 && sorted.length !== all.length && (
            <span className="text-muted-foreground"> of {all.length}</span>
          )}
        </span>
        <span className="text-muted-foreground">{summary}</span>
      </div>

      {/* Table */}
      <Card className="surface-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-muted text-left text-xs uppercase tracking-wide text-primary dark:text-foreground">
                {COLUMNS.map((col) => (
                  <th key={col.key} className="px-4 py-3 font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="flex items-center gap-1 transition-colors hover:text-foreground"
                    >
                      {col.label}
                      <SortIcon active={sortKey === col.key} dir={sortDir} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-muted-foreground">
                    Loading requests…
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-destructive">
                    Failed to load requests.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && sorted.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-muted-foreground">
                    No requests match the current filters.
                  </td>
                </tr>
              )}
              {sorted.map((row) => {
                const r = row.request;
                const overdue = isOverdue(r.postingDate, r.status);
                return (
                  <tr
                    key={String(r.channelID)}
                    onClick={() => setSelected(r)}
                    className="cursor-pointer border-b transition-colors last:border-0 hover:bg-primary/[0.06]"
                  >
                    <td className="max-w-[18rem] truncate px-4 py-3 font-medium">{row.title}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{row.type}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.department}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.requester}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.assignee}</td>
                    <td
                      className={cn(
                        'whitespace-nowrap px-4 py-3',
                        overdue && 'font-semibold text-destructive',
                      )}
                    >
                      {formatDate(r.postingDate)}
                      {overdue && ' ⚠️'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDateTime(r.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {row.room || '—'}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {row.signup ? (
                        <a
                          href={row.signup}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          Link
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <RequestDetailDialog
        request={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </motion.div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="size-3 opacity-40" />;
  return dir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />;
}

/** Build the inline summary line: status counts + overdue tally. */
function buildSummary(rows: SpreadsheetRow[]): string {
  if (rows.length === 0) return 'No items';
  const counts = new Map<RequestStatus, number>();
  let overdue = 0;
  for (const { request } of rows) {
    if (request.status) counts.set(request.status, (counts.get(request.status) ?? 0) + 1);
    if (isOverdue(request.postingDate, request.status)) overdue += 1;
  }
  const labels: Record<RequestStatus, string> = {
    IN_QUEUE: 'in queue',
    IN_PROGRESS: 'in progress',
    AWAITING_POSTING: 'awaiting',
    DONE: 'done',
    BLOCKED: 'blocked',
  };
  const parts = STATUS_ORDER.filter((s) => (counts.get(s) ?? 0) > 0).map(
    (s) => `${counts.get(s)} ${labels[s]}`,
  );
  if (overdue > 0) parts.push(`⚠️ ${overdue} overdue`);
  return parts.length ? parts.join(' • ') : 'No items';
}
