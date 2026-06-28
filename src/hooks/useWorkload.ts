import { useQuery } from '@tanstack/react-query';
import { getWorkload } from '@/lib/api';
import { queryKeys } from '@/hooks/queryKeys';
import type { WorkloadKind } from '@/types';

export function useWorkload(kind: WorkloadKind) {
  return useQuery({
    queryKey: queryKeys.workload(kind),
    queryFn: () => getWorkload(kind),
  });
}
