import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Download, LayoutGrid, Rows3 } from 'lucide-react';

import { PageHeader } from '@/components/PageHeader';
import { RequestCard } from '@/components/RequestCard';
import { RequestDetailDialog } from '@/components/RequestDetailDialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { STATUS_ORDER, statusLabel, statusColor } from '@/lib/status';
import { exportToCsv } from '@/lib/csv';
import { formatDate } from '@/lib/dates';
import { useRequests } from '@/hooks/useRequests';
import { useDiscordNames, useDiscordRoleNames } from '@/hooks/useDiscordNames';
import type { Request, RequestStatus } from '@/types';

import { useRequestFilters, departmentNameFor } from '@/features/requests/useRequestFilters';
import { FilterPanel } from '@/features/requests/FilterPanel';
import { SummaryPanel } from '@/features/requests/SummaryPanel';
import { ActiveFilterChips } from '@/features/requests/ActiveFilterChips';

const EMPTY: Request[] = [];

export function RequestsPage() {
  const { data, isLoading, isError } = useRequests();
  const requests = data ?? EMPTY;

  const [selected, setSelected] = useState<Request | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [compact, setCompact] = useState(false);

  // Resolve names for search + department resolution.
  const requesterIds = useMemo(() => requests.map((r) => r.requesterID), [requests]);
  const assigneeIds = useMemo(() => requests.map((r) => r.assignedToID), [requests]);
  const departmentIds = useMemo(() => requests.map((r) => r.requesterDepartmentID), [requests]);

  const { data: requesterNames } = useDiscordNames(requesterIds);
  const { data: assigneeNames } = useDiscordNames(assigneeIds);
  const { data: roleNames } = useDiscordRoleNames(departmentIds);

  const {
    filters,
    setSearch,
    toggleStatus,
    setType,
    toggleDepartment,
    clearAll,
    filtered,
    departmentOptions,
    activeFilterCount,
  } = useRequestFilters(requests, requesterNames, assigneeNames, roleNames);

  // Counts per status across the full (unfiltered) dataset for the filter chips.
  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<
      RequestStatus,
      number
    >;
    for (const request of requests) {
      if (request.status && request.status in counts) counts[request.status] += 1;
    }
    return counts;
  }, [requests]);

  const grouped = useMemo(() => {
    const map = new Map<RequestStatus, Request[]>();
    for (const status of STATUS_ORDER) map.set(status, []);
    for (const request of filtered) {
      if (request.status && map.has(request.status)) {
        map.get(request.status)!.push(request);
      }
    }
    return map;
  }, [filtered]);

  const openRequest = (request: Request) => {
    setSelected(request);
    setDialogOpen(true);
  };

  const handleExport = () => {
    const rows = filtered.map((r) => ({
      channelID: String(r.channelID),
      title: r.title ?? '',
      description: r.description ?? '',
      status: statusLabel(r.status),
      type: r.requestType ?? '',
      department: departmentNameFor(r, roleNames) ?? '',
      requester: r.requesterID
        ? (requesterNames?.[String(r.requesterID)] ?? String(r.requesterID))
        : '',
      assignee: r.assignedToID
        ? (assigneeNames?.[String(r.assignedToID)] ?? String(r.assignedToID))
        : '',
      postingDate: formatDate(r.postingDate),
      room: r.room ?? '',
      signupUrl: r.signupUrl ?? '',
    }));
    exportToCsv(`requests-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="section-shell space-y-5"
    >
      <PageHeader
        title="Requests"
        description="Browse, filter and manage all marketing requests."
        emoji="📋"
        actions={
          <>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5">
              {compact ? <Rows3 className="size-4" /> : <LayoutGrid className="size-4" />}
              <span className="text-xs font-medium text-muted-foreground">Compact</span>
              <Switch
                checked={compact}
                onCheckedChange={setCompact}
                aria-label="Toggle compact mode"
              />
            </div>
            <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
              <Download className="size-4" />
              Export CSV
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
        <FilterPanel
          filters={filters}
          statusCounts={statusCounts}
          departmentOptions={departmentOptions}
          onSearch={setSearch}
          onToggleStatus={toggleStatus}
          onSetType={setType}
          onToggleDepartment={toggleDepartment}
          onClear={clearAll}
          activeFilterCount={activeFilterCount}
        />

        <div className="space-y-5">
          <SummaryPanel requests={filtered} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <ActiveFilterChips
              filters={filters}
              roleNames={roleNames}
              onSearch={setSearch}
              onToggleStatus={toggleStatus}
              onSetType={setType}
              onToggleDepartment={toggleDepartment}
            />
            <span className="ml-auto text-xs font-semibold text-muted-foreground">
              {filtered.length} shown
            </span>
          </div>

          {isLoading ? (
            <Card className="flex min-h-48 items-center justify-center p-10 text-sm text-muted-foreground">
              Loading requests…
            </Card>
          ) : isError ? (
            <Card className="flex min-h-48 items-center justify-center p-10 text-sm text-destructive">
              Failed to load marketing requests.
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="flex min-h-48 flex-col items-center justify-center gap-2 p-10 text-center">
              <ClipboardList className="size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">No requests match these filters</p>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear filters
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-6">
              {STATUS_ORDER.map((status) => {
                const items = grouped.get(status) ?? [];
                if (items.length === 0) return null;
                const color = statusColor(status);
                return (
                  <section key={status} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: color.hex }}
                        aria-hidden
                      />
                      <h3 className="text-sm font-extrabold">{statusLabel(status)}</h3>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {items.length}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'grid gap-3',
                        compact
                          ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                          : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
                      )}
                    >
                      {items.map((request) => (
                        <RequestCard
                          key={String(request.channelID)}
                          request={request}
                          onClick={openRequest}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <RequestDetailDialog request={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
    </motion.div>
  );
}
