import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getRequests,
  getRequest,
  getRequestsByStatus,
  getMyRequests,
  updateRequest,
  setRequestStatus,
  advanceRequest,
  assignRequest,
  updateRequesterDepartment,
  updateRequester,
  deleteRequest,
} from '@/lib/api';
import { queryKeys } from '@/hooks/queryKeys';
import { useAuth } from '@/contexts/AuthContext';
import type { Request, RequestStatus } from '@/types';

export function useRequests() {
  return useQuery({
    queryKey: queryKeys.requests.list(),
    queryFn: getRequests,
  });
}

export function useRequest(channelId: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.requests.detail(channelId ?? ''),
    queryFn: () => getRequest(channelId as number | string),
    enabled: channelId !== undefined && channelId !== null && channelId !== '',
  });
}

export function useRequestsByStatus(status: RequestStatus) {
  return useQuery({
    queryKey: queryKeys.requests.byStatus(status),
    queryFn: () => getRequestsByStatus(status),
  });
}

export function useMyRequests() {
  return useQuery({
    queryKey: queryKeys.requests.mine(),
    queryFn: getMyRequests,
  });
}

/** Invalidate every request query after a mutation. */
function useInvalidateRequests() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
}

export function useUpdateRequest() {
  const invalidate = useInvalidateRequests();
  const { currentUserId } = useAuth();
  return useMutation({
    mutationFn: (vars: { channelId: number | string; data: Partial<Request> }) =>
      updateRequest(vars.channelId, vars.data, currentUserId ?? undefined),
    onSuccess: invalidate,
  });
}

export function useSetRequestStatus() {
  const invalidate = useInvalidateRequests();
  const { currentUserId } = useAuth();
  return useMutation({
    mutationFn: (vars: { channelId: number | string; status: RequestStatus }) =>
      setRequestStatus(vars.channelId, vars.status, currentUserId ?? undefined),
    onSuccess: invalidate,
  });
}

export function useAdvanceRequest() {
  const invalidate = useInvalidateRequests();
  const { currentUserId } = useAuth();
  return useMutation({
    mutationFn: (channelId: number | string) =>
      advanceRequest(channelId, currentUserId ?? undefined),
    onSuccess: invalidate,
  });
}

export function useAssignRequest() {
  const invalidate = useInvalidateRequests();
  const { currentUserId } = useAuth();
  return useMutation({
    mutationFn: (vars: { channelId: number | string; assignedToId: number | string }) =>
      assignRequest(vars.channelId, vars.assignedToId, currentUserId ?? undefined),
    onSuccess: invalidate,
  });
}

export function useUpdateDepartment() {
  const invalidate = useInvalidateRequests();
  const { currentUserId } = useAuth();
  return useMutation({
    mutationFn: (vars: { channelId: number | string; departmentId: number | string }) =>
      updateRequesterDepartment(vars.channelId, vars.departmentId, currentUserId ?? undefined),
    onSuccess: invalidate,
  });
}

export function useUpdateRequester() {
  const invalidate = useInvalidateRequests();
  const { currentUserId } = useAuth();
  return useMutation({
    mutationFn: (vars: { channelId: number | string; requesterId: number | string }) =>
      updateRequester(vars.channelId, vars.requesterId, currentUserId ?? undefined),
    onSuccess: invalidate,
  });
}

export function useDeleteRequest() {
  const invalidate = useInvalidateRequests();
  const { currentUserId } = useAuth();
  return useMutation({
    mutationFn: (channelId: number | string) =>
      deleteRequest(channelId, currentUserId ?? undefined),
    onSuccess: invalidate,
  });
}
