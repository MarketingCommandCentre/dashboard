import { getAuthToken, clearAuthToken, emitUnauthorized } from '@/lib/auth';
import type {
  Request,
  RequestStatus,
  AuditEvent,
  DepartmentCount,
  DiscordGuild,
  DiscordUser,
  DiscordNameMap,
  WorkloadMap,
  WorkloadKind,
} from '@/types';

export const API_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export class ApiError extends Error {
  status: number;
  body: string;
  constructor(status: number, message: string, body = '') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/** Extract the machine-readable `code` field from an API error body, if any. */
function errorCodeOf(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as { code?: unknown };
    return typeof parsed.code === 'string' ? parsed.code : null;
  } catch {
    return null;
  }
}

interface RequestInitExt extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Sent as the X-Discord-User-Id header when provided. */
  discordUserId?: string | number;
}

/**
 * Typed fetch wrapper. Prefixes the API base URL, injects auth + JSON headers,
 * parses JSON, and throws an ApiError on non-2xx responses (triggering logout
 * on 401/403).
 */
export async function apiFetch<T>(path: string, init: RequestInitExt = {}): Promise<T> {
  const { body, discordUserId, headers, ...rest } = init;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string> | undefined),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  const token = getAuthToken();
  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  if (discordUserId !== undefined && discordUserId !== null) {
    finalHeaders['X-Discord-User-Id'] = String(discordUserId);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  if (response.status === 401 || response.status === 403) {
    clearAuthToken();
    const text = await response.text().catch(() => '');
    if (errorCodeOf(text) === 'NOT_IN_GUILD' && window.location.pathname !== '/unauthorized') {
      // The backend rejected us for not being in the required Discord guild —
      // show the dedicated unauthorized page rather than the login screen.
      window.location.assign('/unauthorized?reason=not_in_guild');
    } else {
      emitUnauthorized();
    }
    throw new ApiError(response.status, `Unauthorized (${response.status})`, text);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new ApiError(response.status, `API error ${response.status}`, text);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) return undefined as T;
  return parseJsonPreservingIds(text) as T;
}

// Discord snowflake IDs (channelID, requesterID, ...) are int64 values that
// exceed Number.MAX_SAFE_INTEGER. A plain JSON.parse silently corrupts them, so
// we quote 15+ digit values of known ID fields before parsing — they arrive as
// strings. All id-consuming API helpers accept `number | string`, and the UI
// stringifies ids for display, so this is safe. (Ported from legacy/api-service.js.)
const ID_FIELDS =
  'channelID|requesterID|assignedToID|additionalAssigneeID|additionalAsigneeID|requesterDepartmentID|requesterDepartmentid|mainMessageID|entityId|id';

function parseJsonPreservingIds(text: string): unknown {
  const scalar = new RegExp(`"(${ID_FIELDS})"\\s*:\\s*(\\d{15,})`, 'g');
  const fixed = text.replace(scalar, '"$1":"$2"');
  return JSON.parse(fixed);
}

// ===================== Requests =====================

export function getRequests(): Promise<Request[]> {
  return apiFetch<Request[]>('/api/requests');
}

export function getRequest(channelId: number | string): Promise<Request> {
  return apiFetch<Request>(`/api/requests/channel/${channelId}`);
}

export function createRequest(data: Partial<Request>, discordUserId?: string): Promise<Request> {
  return apiFetch<Request>('/api/requests', { method: 'POST', body: data, discordUserId });
}

export function updateRequest(
  channelId: number | string,
  data: Partial<Request>,
  discordUserId?: string,
): Promise<Request> {
  return apiFetch<Request>(`/api/requests/channel/${channelId}`, {
    method: 'PUT',
    body: data,
    discordUserId,
  });
}

export function deleteRequest(channelId: number | string, discordUserId?: string): Promise<void> {
  return apiFetch<void>(`/api/requests/channel/${channelId}`, { method: 'DELETE', discordUserId });
}

export function getRequestsByStatus(status: RequestStatus): Promise<Request[]> {
  return apiFetch<Request[]>(`/api/requests/status/${status}`);
}

export function getRequestsByRequester(requesterId: number | string): Promise<Request[]> {
  return apiFetch<Request[]>(`/api/requests/requester/${requesterId}`);
}

export function getRequestsByAssignee(assignedToId: number | string): Promise<Request[]> {
  return apiFetch<Request[]>(`/api/requests/assigned/${assignedToId}`);
}

export function getMyRequests(): Promise<Request[]> {
  return apiFetch<Request[]>('/api/requests/my-requests');
}

export function countByDepartment(): Promise<DepartmentCount[]> {
  return apiFetch<DepartmentCount[]>('/api/requests/countByDepartment');
}

export function setRequestStatus(
  channelId: number | string,
  status: RequestStatus,
  discordUserId?: string,
): Promise<Request> {
  return apiFetch<Request>(`/api/requests/channel/${channelId}/status/${status}`, {
    method: 'PATCH',
    discordUserId,
  });
}

export function advanceRequest(channelId: number | string, discordUserId?: string): Promise<Request> {
  return apiFetch<Request>(`/api/requests/channel/${channelId}/advance`, {
    method: 'PATCH',
    discordUserId,
  });
}

export function assignRequest(
  channelId: number | string,
  assignedToId: number | string,
  discordUserId?: string,
): Promise<Request> {
  return apiFetch<Request>(`/api/requests/channel/${channelId}/assign/${assignedToId}`, {
    method: 'PATCH',
    discordUserId,
  });
}

export function updateRequester(
  channelId: number | string,
  requesterId: number | string,
  discordUserId?: string,
): Promise<Request> {
  return apiFetch<Request>(`/api/requests/channel/${channelId}/requester/${requesterId}`, {
    method: 'PATCH',
    discordUserId,
  });
}

export function updateRequesterDepartment(
  channelId: number | string,
  departmentId: number | string,
  discordUserId?: string,
): Promise<Request> {
  return apiFetch<Request>(`/api/requests/channel/${channelId}/department/${departmentId}`, {
    method: 'PATCH',
    discordUserId,
  });
}

// ===================== Audit =====================

export function getAuditEvents(): Promise<AuditEvent[]> {
  return apiFetch<AuditEvent[]>('/api/audit-events');
}

export function getAuditEvent(id: number | string): Promise<AuditEvent> {
  return apiFetch<AuditEvent>(`/api/audit-events/${id}`);
}

export function getAuditEventsByUser(performedBy: string): Promise<AuditEvent[]> {
  return apiFetch<AuditEvent[]>(`/api/audit-events/user/${performedBy}`);
}

export function getAuditEventsByType(eventType: string): Promise<AuditEvent[]> {
  return apiFetch<AuditEvent[]>(`/api/audit-events/type/${eventType}`);
}

export function getAuditEventsByEntity(
  entityType: string,
  entityId: number | string,
): Promise<AuditEvent[]> {
  return apiFetch<AuditEvent[]>(`/api/audit-events/entity/${entityType}/${entityId}`);
}

export function getAuditEventsByDateRange(start: string, end: string): Promise<AuditEvent[]> {
  const params = new URLSearchParams({ start, end });
  return apiFetch<AuditEvent[]>(`/api/audit-events/daterange?${params.toString()}`);
}

// ===================== Workload =====================

export function getWorkload(kind: WorkloadKind): Promise<WorkloadMap> {
  return apiFetch<WorkloadMap>(`/api/workload/${kind}`);
}

// ===================== Discord =====================

export function getDiscordName(id: string | number): Promise<string> {
  return apiFetch<string>(`/api/discord/users/${id}`);
}

export function getDiscordRoleName(id: string | number): Promise<string> {
  return apiFetch<string>(`/api/discord/roles/${id}`);
}

export function getDiscordNamesBulk(ids: string[]): Promise<DiscordNameMap> {
  return apiFetch<DiscordNameMap>('/api/discord/users/bulk', { method: 'POST', body: ids });
}

export function getDiscordRoleNamesBulk(ids: string[]): Promise<DiscordNameMap> {
  return apiFetch<DiscordNameMap>('/api/discord/roles/bulk', { method: 'POST', body: ids });
}

// ===================== Auth =====================

export function getCurrentUser(): Promise<DiscordUser> {
  return apiFetch<DiscordUser>('/api/auth/user');
}

export function getGuilds(): Promise<DiscordGuild[]> {
  return apiFetch<DiscordGuild[]>('/api/auth/guilds');
}

/** Discord OAuth entry point — redirect the browser here to log in. */
export function discordLoginUrl(): string {
  return `${API_URL}/oauth2/authorization/discord`;
}
