import { X } from 'lucide-react';
import { statusLabel } from '@/lib/status';
import type { DiscordNameMap } from '@/types';
import { departmentName, type RequestFilters } from './useRequestFilters';

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

export function ActiveFilterChips({
  filters,
  roleNames,
  onSearch,
  onToggleStatus,
  onSetType,
  onToggleDepartment,
}: {
  filters: RequestFilters;
  roleNames: DiscordNameMap | undefined;
  onSearch: (value: string) => void;
  onToggleStatus: (status: RequestFilters['statuses'][number]) => void;
  onSetType: (type: RequestFilters['type']) => void;
  onToggleDepartment: (deptId: string) => void;
}) {
  const chips: Chip[] = [];

  if (filters.search.trim()) {
    chips.push({
      key: 'search',
      label: `Search: ${filters.search.trim()}`,
      onRemove: () => onSearch(''),
    });
  }
  for (const status of filters.statuses) {
    chips.push({
      key: `status-${status}`,
      label: `Status: ${statusLabel(status)}`,
      onRemove: () => onToggleStatus(status),
    });
  }
  if (filters.type) {
    chips.push({
      key: 'type',
      label: `Type: ${filters.type}`,
      onRemove: () => onSetType(null),
    });
  }
  for (const deptId of filters.departments) {
    chips.push({
      key: `dept-${deptId}`,
      label: `Dept: ${departmentName(deptId, roleNames)}`,
      onRemove: () => onToggleDepartment(deptId),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted py-1 pl-2.5 pr-1 text-[0.7rem] font-medium text-foreground"
        >
          <span className="max-w-48 truncate">{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Remove ${chip.label}`}
            className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
