// Defensive helpers for the loosely-typed workload endpoints.
//
// The backend has shifted over time. Two shapes are handled:
//
//  1. AGGREGATE (current backend):
//     { role, requestType, totalRequests, requests: Request[], cycleInfo }
//
//  2. MEMBER MAP (documented / historical): an object keyed by Discord user id
//     -> a per-member workload object (counts, lists, nested numbers/arrays).
//
// Everything here narrows `unknown` carefully and never throws on a missing or
// unexpected field.

import type { Request } from '@/types';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Read a numeric field, tolerating numeric strings. Returns null when absent. */
export function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

/** True when the response is the role-aggregate shape (has a `requests` array). */
export function isAggregateShape(
  data: unknown,
): data is { role?: unknown; requestType?: unknown; totalRequests?: unknown; requests?: unknown } {
  return isRecord(data) && Array.isArray((data as Record<string, unknown>).requests);
}

/** Coerce the `requests` field into an array of loosely-typed request objects. */
export function getRequests(data: unknown): Request[] {
  if (!isRecord(data)) return [];
  const requests = data.requests;
  if (!Array.isArray(requests)) return [];
  return requests.filter(isRecord) as unknown as Request[];
}

/**
 * The id used to attribute a request to a member. The backend assigns work via
 * `assignedToID`; `additionalAssigneeID` is a secondary owner.
 */
export function requestAssigneeId(request: Request): string | null {
  const id = request.assignedToID ?? request.additionalAssigneeID;
  if (id === undefined || id === null) return null;
  return String(id);
}

export interface MemberLoad {
  id: string;
  requests: Request[];
}

/** Group an aggregate's `requests` by assignee id, sorted by load (desc). */
export function groupByAssignee(requests: Request[]): MemberLoad[] {
  const byId = new Map<string, Request[]>();
  for (const request of requests) {
    const id = requestAssigneeId(request);
    if (!id) continue;
    const bucket = byId.get(id);
    if (bucket) bucket.push(request);
    else byId.set(id, [request]);
  }
  return Array.from(byId.entries())
    .map(([id, list]) => ({ id, requests: list }))
    .sort((a, b) => b.requests.length - a.requests.length);
}

/** A single rendered fact extracted from an unknown member-map entry. */
export interface MemberField {
  label: string;
  value: string;
}

export interface MemberSummary {
  id: string;
  /** Numeric load used for sorting; null when none could be found. */
  count: number | null;
  fields: MemberField[];
}

function humanizeKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Render an arbitrary scalar/array value into a short, readable string. */
function describeValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.trim() === '' ? null : value;
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : null;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    if (value.length === 0) return '0';
    const scalars = value.every((v) => typeof v === 'string' || typeof v === 'number');
    return scalars ? `${value.length} (${value.slice(0, 3).join(', ')}${value.length > 3 ? '…' : ''})` : String(value.length);
  }
  if (isRecord(value)) {
    const keys = Object.keys(value);
    return keys.length === 0 ? null : `${keys.length} field${keys.length === 1 ? '' : 's'}`;
  }
  return null;
}

/** Best-effort numeric "load" for a member-map entry (count, totalRequests, longest array). */
function inferCount(entry: Record<string, unknown>): number | null {
  for (const key of ['count', 'totalRequests', 'total', 'load', 'requests']) {
    const direct = asNumber(entry[key]);
    if (direct !== null) return direct;
    const arr = entry[key];
    if (Array.isArray(arr)) return arr.length;
  }
  // Fall back to the longest array field, if any.
  let max: number | null = null;
  for (const value of Object.values(entry)) {
    if (Array.isArray(value)) max = Math.max(max ?? 0, value.length);
  }
  return max;
}

/**
 * Turn a member-map entry (`unknown`) into a sortable, renderable summary.
 * Tolerates plain numbers, arrays, and nested objects.
 */
export function summarizeMember(id: string, entry: unknown): MemberSummary {
  if (typeof entry === 'number') {
    return { id, count: Number.isFinite(entry) ? entry : null, fields: [] };
  }
  if (!isRecord(entry)) {
    const value = describeValue(entry);
    return { id, count: null, fields: value ? [{ label: 'Value', value }] : [] };
  }
  const fields: MemberField[] = [];
  for (const [key, value] of Object.entries(entry)) {
    if (key === 'name' || key === 'id') continue;
    const described = describeValue(value);
    if (described !== null) fields.push({ label: humanizeKey(key), value: described });
  }
  return { id, count: inferCount(entry), fields };
}

/**
 * Normalize a member-map response into sorted summaries. Skips obviously
 * non-member keys from the aggregate shape so this is safe to call on anything.
 */
const NON_MEMBER_KEYS = new Set([
  'role',
  'requestType',
  'totalRequests',
  'requests',
  'cycleInfo',
]);

export function summarizeMemberMap(data: unknown): MemberSummary[] {
  if (!isRecord(data)) return [];
  return Object.entries(data)
    .filter(([key]) => !NON_MEMBER_KEYS.has(key))
    .map(([id, entry]) => summarizeMember(id, entry))
    .sort((a, b) => (b.count ?? -1) - (a.count ?? -1));
}
