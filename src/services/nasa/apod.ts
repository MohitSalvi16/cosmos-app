// NASA APOD (Astronomy Picture of the Day), proxied through /api/apod so the API key stays server-side.
// Docs: https://github.com/nasa/apod-api

import type { ApodResponse, Fetched } from '@/types';
import { fetchJson } from './http';

export const APOD_SOURCE = 'NASA APOD';
/** First APOD was published on 1995-06-16. */
export const APOD_FIRST_DATE = '1995-06-16';

export function apodPageUrl(date: string): string {
  // e.g. 2026-10-25 -> https://apod.nasa.gov/apod/ap261025.html
  const [y, m, d] = date.split('-');
  return `https://apod.nasa.gov/apod/ap${(y ?? '').slice(2)}${m ?? ''}${d ?? ''}.html`;
}

/** The best still image to show for an APOD entry (videos use their thumbnail when available). */
export function apodDisplayImage(apod: ApodResponse): string | null {
  if (apod.media_type === 'image') return apod.url ?? apod.hdurl ?? null;
  return apod.thumbnail_url ?? null;
}

export async function fetchApod(date?: string, signal?: AbortSignal): Promise<Fetched<ApodResponse>> {
  const qs = date ? `?${new URLSearchParams({ date })}` : '';
  return fetchJson<ApodResponse>(`/api/apod${qs}`, { signal, source: APOD_SOURCE, ttl: 30 * 60_000 });
}
