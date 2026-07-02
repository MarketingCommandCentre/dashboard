import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { PageHeader } from '@/components/PageHeader';
import { RequestDetailDialog } from '@/components/RequestDetailDialog';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRequests } from '@/hooks/useRequests';
import { useDiscordNames, useDiscordRoleNames } from '@/hooks/useDiscordNames';
import { STATUS_ORDER } from '@/lib/status';
import type { Request, RequestStatus } from '@/types';

import { KanbanColumn } from '@/features/kanban/KanbanColumn';

const ALL_DEPARTMENTS = '__all__';

export function KanbanPage() {
  const { data: requests, isLoading, isError } = useRequests();

  const [department, setDepartment] = useState<string>(ALL_DEPARTMENTS);
  const [selected, setSelected] = useState<Request | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const allRequests = useMemo(() => requests ?? [], [requests]);

  // Resolve assignee + department names in one bulk query each.
  const assigneeIds = useMemo(() => allRequests.map((r) => r.assignedToID), [allRequests]);
  const departmentIds = useMemo(
    () => allRequests.map((r) => r.requesterDepartmentID),
    [allRequests],
  );
  const { data: names } = useDiscordNames(assigneeIds);
  const { data: roleNames } = useDiscordRoleNames(departmentIds);

  const nameFor = (id: number | undefined) =>
    id ? (names?.[String(id)] ?? `User ${id}`) : 'Unassigned';
  const departmentFor = (id: number | undefined) =>
    id ? (roleNames?.[String(id)] ?? `Role ${id}`) : 'No Department';

  // Department filter options derived from the data.
  const departments = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of allRequests) {
      if (r.requesterDepartmentID === undefined) continue;
      const key = String(r.requesterDepartmentID);
      if (!seen.has(key)) {
        seen.set(key, roleNames?.[key] ?? `Role ${key}`);
      }
    }
    return Array.from(seen, ([id, label]) => ({ id, label })).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [allRequests, roleNames]);

  const filtered = useMemo(() => {
    if (department === ALL_DEPARTMENTS) return allRequests;
    return allRequests.filter((r) => String(r.requesterDepartmentID) === department);
  }, [allRequests, department]);

  const byStatus = useMemo(() => {
    const map: Record<RequestStatus, Request[]> = {
      IN_QUEUE: [],
      IN_PROGRESS: [],
      AWAITING_POSTING: [],
      DONE: [],
      BLOCKED: [],
    };
    for (const r of filtered) {
      if (r.status && map[r.status]) map[r.status].push(r);
    }
    return map;
  }, [filtered]);

  const handleOpen = (request: Request) => {
    setSelected(request);
    setDialogOpen(true);
  };

  return (
    <div className="section-shell space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          title="Kanban"
          description="Track requests across status columns. Drag & drop returns in a future update."
          emoji="🗂️"
          actions={
            <Select
              value={department}
              onValueChange={(value) => setDepartment(value ?? ALL_DEPARTMENTS)}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_DEPARTMENTS}>All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      </motion.div>

      {isLoading ? (
        <Card className="flex min-h-64 items-center justify-center p-10 text-sm text-muted-foreground">
          Loading board…
        </Card>
      ) : isError ? (
        <Card className="flex min-h-64 items-center justify-center p-10 text-sm text-destructive">
          Failed to load requests.
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <div className="flex gap-4 overflow-x-auto pb-2">
            {STATUS_ORDER.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                requests={byStatus[status]}
                nameFor={nameFor}
                departmentFor={departmentFor}
                onOpen={handleOpen}
              />
            ))}
          </div>
        </motion.div>
      )}

      <RequestDetailDialog request={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
