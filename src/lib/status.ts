import type { RequestStatus } from '@/types';

/** Display order for boards / selects. */
export const STATUS_ORDER: RequestStatus[] = [
  'IN_QUEUE',
  'IN_PROGRESS',
  'AWAITING_POSTING',
  'DONE',
  'BLOCKED',
];

const STATUS_LABELS: Record<RequestStatus, string> = {
  IN_QUEUE: '📥 In Queue',
  IN_PROGRESS: '🔄 In Progress',
  AWAITING_POSTING: '⏳ Awaiting Posting',
  DONE: '✅ Done',
  BLOCKED: '🚫 Blocked',
};

const LABEL_TO_STATUS: Record<string, RequestStatus> = Object.fromEntries(
  Object.entries(STATUS_LABELS).map(([status, label]) => [label, status as RequestStatus]),
) as Record<string, RequestStatus>;

export function statusLabel(status: RequestStatus | undefined): string {
  if (!status) return 'Unknown';
  return STATUS_LABELS[status] ?? status;
}

export function statusFromLabel(label: string): RequestStatus | undefined {
  return LABEL_TO_STATUS[label];
}

interface StatusColor {
  /** Hex color, for chart fills. */
  hex: string;
  /** Tailwind utility classes for badges (bg + text). */
  badge: string;
  /** Tailwind border accent class. */
  border: string;
}

const STATUS_COLORS: Record<RequestStatus, StatusColor> = {
  IN_QUEUE: {
    hex: '#6c757d',
    badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
    border: 'border-slate-400',
  },
  IN_PROGRESS: {
    hex: '#007bff',
    badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-300',
    border: 'border-blue-500',
  },
  AWAITING_POSTING: {
    hex: '#ffc107',
    badge: 'bg-amber-400/20 text-amber-700 dark:text-amber-300',
    border: 'border-amber-400',
  },
  DONE: {
    hex: '#28a745',
    badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
    border: 'border-emerald-500',
  },
  BLOCKED: {
    hex: '#dc3545',
    badge: 'bg-red-500/15 text-red-600 dark:text-red-300',
    border: 'border-red-500',
  },
};

export function statusColor(status: RequestStatus | undefined): StatusColor {
  if (!status) return STATUS_COLORS.IN_QUEUE;
  return STATUS_COLORS[status] ?? STATUS_COLORS.IN_QUEUE;
}

/**
 * The status a request advances to. IN_QUEUE → IN_PROGRESS → AWAITING_POSTING →
 * DONE. DONE and BLOCKED are terminal (return themselves).
 */
export function nextStatus(status: RequestStatus): RequestStatus {
  switch (status) {
    case 'IN_QUEUE':
      return 'IN_PROGRESS';
    case 'IN_PROGRESS':
      return 'AWAITING_POSTING';
    case 'AWAITING_POSTING':
      return 'DONE';
    case 'DONE':
    case 'BLOCKED':
      return status;
    default:
      return status;
  }
}
