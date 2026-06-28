import type { RequestStatus, WorkloadKind } from '@/types';

/** Centralised TanStack Query keys so hooks invalidate consistently. */
export const queryKeys = {
  requests: {
    all: ['requests'] as const,
    list: () => [...queryKeys.requests.all, 'list'] as const,
    detail: (channelId: number | string) =>
      [...queryKeys.requests.all, 'detail', String(channelId)] as const,
    byStatus: (status: RequestStatus) =>
      [...queryKeys.requests.all, 'status', status] as const,
    mine: () => [...queryKeys.requests.all, 'mine'] as const,
  },
  departmentCounts: ['department-counts'] as const,
  audit: {
    all: ['audit'] as const,
    list: () => [...queryKeys.audit.all, 'list'] as const,
    byUser: (user: string) => [...queryKeys.audit.all, 'user', user] as const,
    byType: (type: string) => [...queryKeys.audit.all, 'type', type] as const,
    byEntity: (entityType: string, entityId: number | string) =>
      [...queryKeys.audit.all, 'entity', entityType, String(entityId)] as const,
    byDateRange: (start: string, end: string) =>
      [...queryKeys.audit.all, 'daterange', start, end] as const,
  },
  workload: (kind: WorkloadKind) => ['workload', kind] as const,
  discord: {
    names: (ids: string[]) => ['discord', 'names', [...ids].sort()] as const,
    roleNames: (ids: string[]) => ['discord', 'role-names', [...ids].sort()] as const,
  },
  auth: {
    user: ['auth', 'user'] as const,
    guilds: ['auth', 'guilds'] as const,
  },
} as const;
