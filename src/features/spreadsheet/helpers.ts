import type { Request, RequestType, DiscordNameMap } from '@/types';

/** Display label for a request type, mirroring the legacy formatRequestType. */
export function formatRequestType(type: RequestType | undefined): string {
  if (!type) return 'General';
  const map: Record<RequestType, string> = {
    POST: '📱 POST',
    REEL: '📹 REEL',
  };
  return map[type] ?? type;
}

/** Resolve a Discord user id to a display name, falling back gracefully. */
export function resolveName(
  id: number | string | undefined,
  names: DiscordNameMap | undefined,
  fallback: string,
): string {
  if (id === undefined || id === null || id === '') return fallback;
  return names?.[String(id)] ?? `User ${id}`;
}

/** Resolve a Discord role (department) id to a name. */
export function resolveDepartment(
  id: number | string | undefined,
  roleNames: DiscordNameMap | undefined,
): string {
  if (id === undefined || id === null || id === '') return '—';
  return roleNames?.[String(id)] ?? `Role ${id}`;
}

export type SortKey =
  | 'title'
  | 'status'
  | 'type'
  | 'department'
  | 'requester'
  | 'assignee'
  | 'postingDate'
  | 'createdAt'
  | 'room'
  | 'signup';

export type SortDir = 'asc' | 'desc';

/** A row enriched with the resolved display strings used for sorting + render. */
export interface SpreadsheetRow {
  request: Request;
  title: string;
  type: string;
  department: string;
  requester: string;
  assignee: string;
  room: string;
  signup: string;
}

/** Compare two enriched rows by the given key (status uses board order). */
export function compareRows(
  a: SpreadsheetRow,
  b: SpreadsheetRow,
  key: SortKey,
  statusRank: (r: Request) => number,
): number {
  switch (key) {
    case 'title':
      return a.title.localeCompare(b.title);
    case 'type':
      return a.type.localeCompare(b.type);
    case 'department':
      return a.department.localeCompare(b.department);
    case 'requester':
      return a.requester.localeCompare(b.requester);
    case 'assignee':
      return a.assignee.localeCompare(b.assignee);
    case 'room':
      return a.room.localeCompare(b.room);
    case 'signup':
      return a.signup.localeCompare(b.signup);
    case 'status':
      return statusRank(a.request) - statusRank(b.request);
    case 'postingDate':
      return compareNumbers(dateValue(a.request.postingDate), dateValue(b.request.postingDate));
    case 'createdAt':
      return compareNumbers(dateValue(a.request.createdAt), dateValue(b.request.createdAt));
    default:
      return 0;
  }
}

/** Subtraction-safe comparator: avoids NaN when both values are +Infinity. */
function compareNumbers(a: number, b: number): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function dateValue(value: string | undefined): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}
