// ===== Backend domain types (mirrors the Spring Boot OpenAPI schema) =====

export type RequestStatus =
  | 'IN_QUEUE'
  | 'IN_PROGRESS'
  | 'AWAITING_POSTING'
  | 'DONE'
  | 'BLOCKED';

export type RequestType = 'POST' | 'REEL';

/**
 * A marketing request (command-centre-controller).
 * IDs are int64 on the backend; in practice they are Discord snowflakes that
 * exceed Number.MAX_SAFE_INTEGER, so treat them carefully when displaying.
 * Only `channelID` and `mainMessageID` are required.
 */
export interface Request {
  channelID: number;
  mainMessageID: number;
  requesterID?: number;
  requesterDepartmentID?: number;
  assignedToID?: number;
  additionalAssigneeID?: number;
  title?: string;
  description?: string;
  requestType?: RequestType;
  status?: RequestStatus;
  /** ISO date (yyyy-MM-dd). */
  postingDate?: string;
  /** ISO date-time. */
  createdAt?: string;
  /** ISO date-time. */
  updatedAt?: string;
  room?: string;
  signupUrl?: string;
}

export interface AuditEvent {
  id: number;
  eventType: string;
  entityType: string;
  entityId: number;
  eventDetails: string;
  performedBy: string;
  /** Optional structured JSON detail (stored as a string on the backend). */
  metadata?: string | Record<string, unknown> | null;
  /** ISO date-time. */
  eventTimestamp: string;
}

export interface DepartmentCount {
  totalRequests: number;
  requesterDepartmentid: number;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string;
  owner: boolean;
  permissions: string;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator?: string;
  avatar?: string;
  email?: string;
  [key: string]: unknown;
}

/** Workload endpoints return an object map keyed by user/role id. */
export type WorkloadEntry = Record<string, unknown> & {
  count?: number;
  name?: string;
};

export type WorkloadMap = Record<string, WorkloadEntry | number | unknown>;

export type WorkloadKind =
  | 'social-media-managers'
  | 'graphic-designers'
  | 'content-creators'
  | 'cycle-info';

/** Shape returned by /api/workload/cycle-info (fields optional / best-effort). */
export interface CycleInfo {
  currentDevelopmentCycle?: DevelopmentCycle;
  nextDevelopmentCycle?: DevelopmentCycle;
  [key: string]: unknown;
}

export interface DevelopmentCycle {
  cycleNumber: number;
  /** yyyy-MM-dd */
  developmentStart: string;
  /** yyyy-MM-dd */
  developmentEnd: string;
}

/** A bulk id -> display-name map (Discord users or roles). */
export type DiscordNameMap = Record<string, string>;
