import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { Columns3 } from 'lucide-react';

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
import { useRequests, useSetRequestStatus, useAdvanceRequest } from '@/hooks/useRequests';
import { useDiscordNames, useDiscordRoleNames } from '@/hooks/useDiscordNames';
import { STATUS_ORDER } from '@/lib/status';
import type { Request, RequestStatus } from '@/types';

import { KanbanColumn } from '@/features/kanban/KanbanColumn';
import { KanbanCardOverlay } from '@/features/kanban/KanbanCard';

const ALL_DEPARTMENTS = '__all__';

export function KanbanPage() {
  const { data: requests, isLoading, isError } = useRequests();
  const setStatus = useSetRequestStatus();
  const advance = useAdvanceRequest();

  const [department, setDepartment] = useState<string>(ALL_DEPARTMENTS);
  const [activeRequest, setActiveRequest] = useState<Request | null>(null);
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleOpen = (request: Request) => {
    setSelected(request);
    setDialogOpen(true);
  };

  const handleAdvance = (request: Request) => {
    advance.mutate(request.channelID);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const request = event.active.data.current?.request as Request | undefined;
    setActiveRequest(request ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveRequest(null);
    const { active, over } = event;
    if (!over) return;

    const request = active.data.current?.request as Request | undefined;
    if (!request) return;

    // The droppable id is either a column status, or another card whose
    // column we resolve from its request data.
    const overData = over.data.current?.request as Request | undefined;
    const targetStatus = (overData?.status ?? (over.id as RequestStatus)) as RequestStatus;

    if (!STATUS_ORDER.includes(targetStatus) || targetStatus === request.status) return;
    setStatus.mutate({ channelId: request.channelID, status: targetStatus });
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
          description="Drag requests across status columns, or advance them in one click."
          icon={Columns3}
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
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
                  onAdvance={handleAdvance}
                />
              ))}
            </div>

            <DragOverlay>
              {activeRequest ? (
                <div className="w-[260px]">
                  <KanbanCardOverlay
                    request={activeRequest}
                    assigneeName={nameFor(activeRequest.assignedToID)}
                    departmentName={departmentFor(activeRequest.requesterDepartmentID)}
                    onOpen={() => {}}
                    onAdvance={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </motion.div>
      )}

      <RequestDetailDialog request={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
