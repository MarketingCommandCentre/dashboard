import { useQuery } from '@tanstack/react-query';
import { countByDepartment } from '@/lib/api';
import { queryKeys } from '@/hooks/queryKeys';

export function useDepartmentCounts() {
  return useQuery({
    queryKey: queryKeys.departmentCounts,
    queryFn: countByDepartment,
  });
}
