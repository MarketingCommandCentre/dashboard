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

// Solid status-pill colors carried over from the original dashboard.
const STATUS_COLORS: Record<RequestStatus, StatusColor> = {
  IN_QUEUE: {
    hex: '#3498db',
    badge: 'bg-[#3498db] text-white border-transparent',
    border: 'border-[#3498db]',
  },
  IN_PROGRESS: {
    hex: '#f39c12',
    badge: 'bg-[#f39c12] text-white border-transparent',
    border: 'border-[#f39c12]',
  },
  AWAITING_POSTING: {
    hex: '#9b59b6',
    badge: 'bg-[#9b59b6] text-white border-transparent',
    border: 'border-[#9b59b6]',
  },
  DONE: {
    hex: '#27ae60',
    badge: 'bg-[#27ae60] text-white border-transparent',
    border: 'border-[#27ae60]',
  },
  BLOCKED: {
    hex: '#e74c3c',
    badge: 'bg-[#e74c3c] text-white border-transparent',
    border: 'border-[#e74c3c]',
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
