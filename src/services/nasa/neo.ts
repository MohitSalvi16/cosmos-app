// NASA NeoWs (Near Earth Object Web Service) — feed endpoint, proxied through /api/neo/feed.
// Docs: https://api.nasa.gov/ (Asteroids - NeoWs)

import type { Fetched, NeoApproach, NeoFeedResponse, NeoRaw } from '@/types';
import { fetchJson } from './http';

export const NEO_SOURCE = 'NASA NeoWs';
export const NEO_MAX_RANGE_DAYS = 7;

export function parseNeo(raw: NeoRaw): NeoApproach | null {
  const ca = raw.close_approach_data?.[0];
  if (!ca) return null;
  const d = raw.estimated_diameter?.meters;
  return {
    id: raw.id,
    name: raw.name.replace(/^\((.*)\)$/, '$1'),
    jplUrl: raw.nasa_jpl_url,
    absoluteMagnitude: raw.absolute_magnitude_h,
    hazardous: raw.is_potentially_hazardous_asteroid,
    sentry: raw.is_sentry_object,
    diameterMinM: d?.estimated_diameter_min ?? NaN,
    diameterMaxM: d?.estimated_diameter_max ?? NaN,
    approachDate: ca.close_approach_date,
    approachDateFull: ca.close_approach_date_full,
    epochMs: ca.epoch_date_close_approach,
    velocityKmS: Number(ca.relative_velocity.kilometers_per_second),
    missKm: Number(ca.miss_distance.kilometers),
    missLunar: Number(ca.miss_distance.lunar),
    missAu: Number(ca.miss_distance.astronomical),
    orbitingBody: ca.orbiting_body,
  };
}

export function flattenFeed(feed: NeoFeedResponse): NeoApproach[] {
  const out: NeoApproach[] = [];
  for (const list of Object.values(feed.near_earth_objects ?? {})) {
    for (const raw of list) {
      const parsed = parseNeo(raw);
      if (parsed) out.push(parsed);
    }
  }
  return out.sort((a, b) => a.epochMs - b.epochMs);
}

export async function fetchNeoFeed(startDate: string, endDate: string, signal?: AbortSignal): Promise<Fetched<NeoApproach[]>> {
  const qs = new URLSearchParams({ start_date: startDate, end_date: endDate });
  const res = await fetchJson<NeoFeedResponse>(`/api/neo/feed?${qs}`, { signal, source: NEO_SOURCE, ttl: 30 * 60_000 });
  return { data: flattenFeed(res.data), meta: res.meta };
}
