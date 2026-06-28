import { useQuery } from '@tanstack/react-query';
import {
  getAuditEvents,
  getAuditEventsByUser,
  getAuditEventsByType,
  getAuditEventsByEntity,
  getAuditEventsByDateRange,
} from '@/lib/api';
import { queryKeys } from '@/hooks/queryKeys';

export function useAuditEvents() {
  return useQuery({
    queryKey: queryKeys.audit.list(),
    queryFn: getAuditEvents,
  });
}

export function useAuditEventsByUser(performedBy: string | undefined) {
  return useQuery({
    queryKey: queryKeys.audit.byUser(performedBy ?? ''),
    queryFn: () => getAuditEventsByUser(performedBy as string),
    enabled: !!performedBy,
  });
}

export function useAuditEventsByType(eventType: string | undefined) {
  return useQuery({
    queryKey: queryKeys.audit.byType(eventType ?? ''),
    queryFn: () => getAuditEventsByType(eventType as string),
    enabled: !!eventType,
  });
}

export function useAuditEventsByEntity(
  entityType: string | undefined,
  entityId: number | string | undefined,
) {
  return useQuery({
    queryKey: queryKeys.audit.byEntity(entityType ?? '', entityId ?? ''),
    queryFn: () => getAuditEventsByEntity(entityType as string, entityId as number | string),
    enabled: !!entityType && entityId !== undefined && entityId !== null && entityId !== '',
  });
}

export function useAuditEventsByDateRange(start: string | undefined, end: string | undefined) {
  return useQuery({
    queryKey: queryKeys.audit.byDateRange(start ?? '', end ?? ''),
    queryFn: () => getAuditEventsByDateRange(start as string, end as string),
    enabled: !!start && !!end,
  });
}
