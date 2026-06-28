import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/StatusBadge';

import { STATUS_ORDER, statusLabel } from '@/lib/status';
import { useDiscordNames, useDiscordRoleNames } from '@/hooks/useDiscordNames';
import {
  useUpdateRequest,
  useSetRequestStatus,
  useAssignRequest,
  useUpdateDepartment,
  useUpdateRequester,
} from '@/hooks/useRequests';
import type { Request, RequestStatus } from '@/types';

const formSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  postingDate: z.string().optional(),
  room: z.string().optional(),
  signupUrl: z.union([z.string().url(), z.literal('')]).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function RequestDetailDialog({
  request,
  open,
  onOpenChange,
}: {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateRequest = useUpdateRequest();
  const setStatus = useSetRequestStatus();
  const assign = useAssignRequest();
  const updateDept = useUpdateDepartment();
  const updateRequester = useUpdateRequester();

  const { data: names } = useDiscordNames([request?.assignedToID, request?.requesterID]);
  const { data: roleNames } = useDiscordRoleNames([request?.requesterDepartmentID]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      postingDate: '',
      room: '',
      signupUrl: '',
    },
  });

  useEffect(() => {
    if (request) {
      form.reset({
        title: request.title ?? '',
        description: request.description ?? '',
        postingDate: request.postingDate ?? '',
        room: request.room ?? '',
        signupUrl: request.signupUrl ?? '',
      });
    }
  }, [request, form]);

  if (!request) return null;
  const channelId = request.channelID;

  const onSubmit = form.handleSubmit((values) => {
    updateRequest.mutate({ channelId, data: values });
  });

  const assigneeName = request.assignedToID
    ? (names?.[String(request.assignedToID)] ?? `User ${request.assignedToID}`)
    : 'Unassigned';
  const requesterName = request.requesterID
    ? (names?.[String(request.requesterID)] ?? `User ${request.requesterID}`)
    : 'Unknown';
  const departmentName = request.requesterDepartmentID
    ? (roleNames?.[String(request.requesterDepartmentID)] ?? `Role ${request.requesterDepartmentID}`)
    : 'None';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{request.title || 'Request details'}</DialogTitle>
          <DialogDescription>Channel #{String(channelId)}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={request.status} />
          <span className="text-xs text-muted-foreground">
            Requester: {requesterName} · Dept: {departmentName} · Assignee: {assigneeName}
          </span>
        </div>

        <Separator />

        {/* Status control */}
        <div className="grid gap-2">
          <Label>Status</Label>
          <Select
            value={request.status}
            onValueChange={(value) =>
              setStatus.mutate({ channelId, status: value as RequestStatus })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Assignment / requester / department by id */}
        <div className="grid gap-3 sm:grid-cols-3">
          <IdField
            label="Assignee ID"
            defaultValue={request.assignedToID}
            onCommit={(id) => assign.mutate({ channelId, assignedToId: id })}
          />
          <IdField
            label="Requester ID"
            defaultValue={request.requesterID}
            onCommit={(id) => updateRequester.mutate({ channelId, requesterId: id })}
          />
          <IdField
            label="Department ID"
            defaultValue={request.requesterDepartmentID}
            onCommit={(id) => updateDept.mutate({ channelId, departmentId: id })}
          />
        </div>

        <Separator />

        {/* Editable fields via react-hook-form */}
        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="rd-title">Title</Label>
            <Input id="rd-title" {...form.register('title')} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rd-description">Description</Label>
            <Textarea id="rd-description" rows={3} {...form.register('description')} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="rd-posting">Posting date</Label>
              <Input id="rd-posting" type="date" {...form.register('postingDate')} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rd-room">Room</Label>
              <Input id="rd-room" {...form.register('room')} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rd-signup">Signup URL</Label>
            <Input id="rd-signup" {...form.register('signupUrl')} />
            {form.formState.errors.signupUrl && (
              <p className="text-xs text-destructive">Must be a valid URL.</p>
            )}
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={updateRequest.isPending}>
              {updateRequest.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** A small uncontrolled id input that commits on blur if the value changed. */
function IdField({
  label,
  defaultValue,
  onCommit,
}: {
  label: string;
  defaultValue?: number;
  onCommit: (id: string) => void;
}) {
  const initial = defaultValue !== undefined ? String(defaultValue) : '';
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        defaultValue={initial}
        inputMode="numeric"
        onBlur={(e) => {
          const value = e.target.value.trim();
          if (value && value !== initial) onCommit(value);
        }}
      />
    </div>
  );
}
