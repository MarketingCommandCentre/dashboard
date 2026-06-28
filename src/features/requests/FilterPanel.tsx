import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { STATUS_ORDER, statusLabel, statusColor } from '@/lib/status';
import type { RequestStatus, RequestType } from '@/types';
import type { RequestFilters, DepartmentOption } from './useRequestFilters';

const TYPE_OPTIONS: RequestType[] = ['POST', 'REEL'];
const ALL_TYPES = 'ALL';

export function FilterPanel({
  filters,
  statusCounts,
  departmentOptions,
  onSearch,
  onToggleStatus,
  onSetType,
  onToggleDepartment,
  onClear,
  activeFilterCount,
}: {
  filters: RequestFilters;
  statusCounts: Record<RequestStatus, number>;
  departmentOptions: DepartmentOption[];
  onSearch: (value: string) => void;
  onToggleStatus: (status: RequestStatus) => void;
  onSetType: (type: RequestType | null) => void;
  onToggleDepartment: (deptId: string) => void;
  onClear: () => void;
  activeFilterCount: number;
}) {
  return (
    <aside className="surface-card flex h-fit flex-col gap-5 rounded-[24px] border p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
          Filters
        </h2>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="xs" onClick={onClear} className="text-xs">
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="grid gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground" htmlFor="request-search">
          Search
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="request-search"
            value={filters.search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Title, description, person…"
            className="pl-8"
          />
        </div>
      </div>

      {/* Status multi-select */}
      <div className="grid gap-2">
        <span className="text-xs font-semibold text-muted-foreground">Status</span>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_ORDER.map((status) => {
            const active = filters.statuses.includes(status);
            const color = statusColor(status);
            return (
              <button
                key={status}
                type="button"
                onClick={() => onToggleStatus(status)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  active
                    ? cn(color.badge, color.border)
                    : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted',
                )}
                aria-pressed={active}
              >
                <span>{statusLabel(status)}</span>
                <span className="opacity-60">{statusCounts[status] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Type select */}
      <div className="grid gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Type</span>
        <Select
          value={filters.type ?? ALL_TYPES}
          onValueChange={(value) => onSetType(value === ALL_TYPES ? null : (value as RequestType))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TYPES}>All types</SelectItem>
            {TYPE_OPTIONS.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Department multi-select */}
      <div className="grid gap-2">
        <span className="text-xs font-semibold text-muted-foreground">Department</span>
        {departmentOptions.length === 0 ? (
          <p className="text-xs text-muted-foreground/70">No departments in data.</p>
        ) : (
          <div className="flex max-h-56 flex-col gap-1 overflow-y-auto pr-1">
            {departmentOptions.map(({ id, name, count }) => {
              const active = filters.departments.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onToggleDepartment(id)}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors',
                    active
                      ? 'border-primary/40 bg-primary/10 text-foreground'
                      : 'border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/60',
                  )}
                  aria-pressed={active}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {active && <X className="size-3 shrink-0" />}
                    <span className="truncate">{name}</span>
                  </span>
                  <span className="shrink-0 opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
