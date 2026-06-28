import { useQuery } from '@tanstack/react-query';
import { getDiscordNamesBulk, getDiscordRoleNamesBulk } from '@/lib/api';
import { queryKeys } from '@/hooks/queryKeys';
import type { DiscordNameMap } from '@/types';

/** Dedupe + stringify a list of ids, dropping empties. */
function normalizeIds(ids: Array<string | number | null | undefined>): string[] {
  const set = new Set<string>();
  for (const id of ids) {
    if (id === null || id === undefined || id === '') continue;
    set.add(String(id));
  }
  return Array.from(set);
}

/**
 * Resolve Discord user ids to display names via the bulk endpoint.
 * Deduped, sorted into a stable cache key, and skipped when there are no ids.
 */
export function useDiscordNames(ids: Array<string | number | null | undefined>) {
  const normalized = normalizeIds(ids);
  return useQuery<DiscordNameMap>({
    queryKey: queryKeys.discord.names(normalized),
    queryFn: () => getDiscordNamesBulk(normalized),
    enabled: normalized.length > 0,
    staleTime: 10 * 60_000,
  });
}

/** Resolve Discord role (department) ids to names via the bulk endpoint. */
export function useDiscordRoleNames(ids: Array<string | number | null | undefined>) {
  const normalized = normalizeIds(ids);
  return useQuery<DiscordNameMap>({
    queryKey: queryKeys.discord.roleNames(normalized),
    queryFn: () => getDiscordRoleNamesBulk(normalized),
    enabled: normalized.length > 0,
    staleTime: 10 * 60_000,
  });
}
