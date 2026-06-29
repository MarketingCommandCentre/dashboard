import type { AuditEvent, DiscordNameMap } from '@/types';

/**
 * Parse an event's `metadata` into an object. The backend stores metadata as a JSON
 * string column, so it arrives either as a string (needs parsing) or, defensively, as
 * an already-parsed object. Returns null when absent or unparseable.
 */
export function parseMetadata(event: AuditEvent): Record<string, unknown> | null {
  const raw = event.metadata;
  if (!raw) return null;
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Discord user ids referenced inside an event's metadata (e.g. assignees), as strings. */
export function metadataUserIds(event: AuditEvent): string[] {
  const meta = parseMetadata(event);
  if (!meta) return [];
  const ids = meta.assigneeIds;
  if (!Array.isArray(ids)) return [];
  return ids.map((id) => String(id)).filter(Boolean);
}

function resolveName(id: string, names: DiscordNameMap | undefined): string {
  return names?.[id] ?? (/^\d+$/.test(id) ? `User #${id.slice(-4)}` : id);
}

/**
 * Human-readable details for an audit row. When structured metadata is present (e.g.
 * assignee changes), it is formatted with resolved Discord names; otherwise the
 * backend's `eventDetails` summary is returned unchanged.
 */
export function formatAuditDetails(event: AuditEvent, names: DiscordNameMap | undefined): string {
  const meta = parseMetadata(event);
  if (meta) {
    const ids = metadataUserIds(event);
    if (ids.length) {
      const who = ids.map((id) => resolveName(id, names)).join(', ');
      const via = typeof meta.via === 'string' ? meta.via : undefined;
      const verb =
        event.eventType === 'ASSIGNEE_ADD'
          ? 'Added assignee(s)'
          : event.eventType === 'ASSIGNEE_REMOVE'
            ? 'Removed assignee(s)'
            : 'Assignees';
      return `${verb}: ${who}${via ? ` (via ${via})` : ''}`;
    }
    if (event.eventType === 'REQUEST_SPLIT' && meta.newChannelId) {
      return `Split into request ${String(meta.newChannelId)}`;
    }
    if (event.eventType === 'CHANNEL_RENAME' && (meta.from || meta.to)) {
      return `Renamed from "${String(meta.from ?? '')}" to "${String(meta.to ?? '')}"`;
    }
  }
  return event.eventDetails ?? '';
}
