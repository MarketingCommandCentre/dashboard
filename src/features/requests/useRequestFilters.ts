import { useMemo, useState } from 'react';
import type { Request, RequestStatus, RequestType } from '@/types';
import type { DiscordNameMap } from '@/types';

export interface RequestFilters {
  search: string;
  statuses: RequestStatus[];
  type: RequestType | null;
  /** Selected department ids (stable; resolved to names only for display). */
  departments: string[];
}

export const EMPTY_FILTERS: RequestFilters = {
  search: '',
  statuses: [],
  type: null,
  departments: [],
};

/** Stable department id for a request, or null when it has none. */
export function departmentIdFor(request: Request): string | null {
  const id = request.requesterDepartmentID;
  if (id === undefined || id === null) return null;
  return String(id);
}

/** Resolve a department id to a display name, falling back to the raw id. */
export function departmentName(id: string, roleNames: DiscordNameMap | undefined): string {
  return roleNames?.[id] ?? `Role ${id}`;
}

/** Stable display name for a request's department, or null when it has none. */
export function departmentNameFor(
  request: Request,
  roleNames: DiscordNameMap | undefined,
): string | null {
  const id = departmentIdFor(request);
  return id === null ? null : departmentName(id, roleNames);
}

export interface DepartmentOption {
  id: string;
  name: string;
  count: number;
}

interface UseRequestFiltersResult {
  filters: RequestFilters;
  setSearch: (value: string) => void;
  toggleStatus: (status: RequestStatus) => void;
  setType: (type: RequestType | null) => void;
  /** Toggle a department by its stable id. */
  toggleDepartment: (deptId: string) => void;
  clearAll: () => void;
  filtered: Request[];
  /** Distinct departments present in the dataset, with resolved names and counts. */
  departmentOptions: DepartmentOption[];
  activeFilterCount: number;
}

/**
 * Mirrors the legacy `autoFilter` matching rules:
 *  - status: keep when no statuses selected, else request status is in the set
 *  - type: substring/equality match on request type
 *  - department: keep when none selected, else dept id is in the set
 *  - search: case-insensitive match across title / description / requester / assignee
 *
 * Departments are tracked by their stable id (not the resolved Discord role
 * name), so an active filter survives names resolving asynchronously.
 */
export function useRequestFilters(
  requests: Request[],
  requesterNames: DiscordNameMap | undefined,
  assigneeNames: DiscordNameMap | undefined,
  roleNames: DiscordNameMap | undefined,
): UseRequestFiltersResult {
  const [filters, setFilters] = useState<RequestFilters>(EMPTY_FILTERS);

  const setSearch = (value: string) => setFilters((f) => ({ ...f, search: value }));
  const setType = (type: RequestType | null) => setFilters((f) => ({ ...f, type }));
  const toggleStatus = (status: RequestStatus) =>
    setFilters((f) => ({
      ...f,
      statuses: f.statuses.includes(status)
        ? f.statuses.filter((s) => s !== status)
        : [...f.statuses, status],
    }));
  const toggleDepartment = (deptId: string) =>
    setFilters((f) => ({
      ...f,
      departments: f.departments.includes(deptId)
        ? f.departments.filter((d) => d !== deptId)
        : [...f.departments, deptId],
    }));
  const clearAll = () => setFilters(EMPTY_FILTERS);

  const departmentOptions = useMemo<DepartmentOption[]>(() => {
    const counts = new Map<string, number>();
    for (const request of requests) {
      const id = departmentIdFor(request);
      if (id === null) continue;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([id, count]) => ({ id, name: departmentName(id, roleNames), count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [requests, roleNames]);

  const filtered = useMemo(() => {
    const search = filters.search.toLowerCase().trim();
    return requests.filter((request) => {
      if (filters.statuses.length > 0) {
        if (!request.status || !filters.statuses.includes(request.status)) return false;
      }
      if (filters.type) {
        if (request.requestType !== filters.type) return false;
      }
      if (filters.departments.length > 0) {
        const deptId = departmentIdFor(request);
        if (!deptId || !filters.departments.includes(deptId)) return false;
      }
      if (search) {
        const requesterName = request.requesterID
          ? requesterNames?.[String(request.requesterID)]
          : undefined;
        const assigneeName = request.assignedToID
          ? assigneeNames?.[String(request.assignedToID)]
          : undefined;
        const haystack = [request.title, request.description, requesterName, assigneeName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }, [requests, filters, requesterNames, assigneeNames, roleNames]);

  const activeFilterCount =
    (filters.search.trim() ? 1 : 0) +
    filters.statuses.length +
    (filters.type ? 1 : 0) +
    filters.departments.length;

  return {
    filters,
    setSearch,
    toggleStatus,
    setType,
    toggleDepartment,
    clearAll,
    filtered,
    departmentOptions,
    activeFilterCount,
  };
}
