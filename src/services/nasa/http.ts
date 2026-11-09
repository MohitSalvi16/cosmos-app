import type { Fetched } from '@/types';

export class ApiError extends Error {
  readonly status: number;
  readonly detail?: string;
  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException ? err.name === 'AbortError' : (err as { name?: string })?.name === 'AbortError';
}

/** Human-friendly message for any thrown value. */
export function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 429) return 'The NASA API rate limit has been reached. Please try again in a little while.';
    if (err.status === 0) return 'Network unavailable — check your connection and try again.';
    return err.detail ? `${err.message} (${err.detail})` : err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}

interface ClientCacheEntry {
  value: Fetched<unknown>;
  expires: number;
}

const clientCache = new Map<string, ClientCacheEntry>();
const MAX_CLIENT_ENTRIES = 200;

export function clearClientCache(): void {
  clientCache.clear();
}

export interface FetchJsonOptions {
  signal?: AbortSignal;
  /** Client-side cache TTL in ms (0 disables). */
  ttl?: number;
  /** Label used in FetchMeta.source when the server doesn't provide one. */
  source: string;
}

/**
 * Fetch JSON with typed result, abort support, a small in-memory cache and
 * consistent error mapping. Reads proxy metadata headers when present.
 */
export async function fetchJson<T>(url: string, { signal, ttl = 5 * 60_000, source }: FetchJsonOptions): Promise<Fetched<T>> {
  const now = Date.now();
  const cached = ttl > 0 ? clientCache.get(url) : undefined;
  if (cached && cached.expires > now) {
    return { data: cached.value.data as T, meta: { ...cached.value.meta, cache: 'CLIENT' } };
  }

  let res: Response;
  try {
    res = await fetch(url, { signal, headers: { accept: 'application/json' } });
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new ApiError(`Could not reach ${source}.`, 0, err instanceof Error ? err.message : undefined);
  }

  let body: unknown = null;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    if (res.ok) throw new ApiError(`${source} returned an unexpected (non-JSON) response.`, res.status);
  }

  if (!res.ok) {
    const b = (body ?? {}) as { error?: string | { message?: string }; detail?: string; msg?: string; reason?: string };
    const msg = typeof b.error === 'string' ? b.error : b.error?.message ?? b.msg ?? b.reason ?? `${source} request failed (HTTP ${res.status}).`;
    throw new ApiError(msg, res.status, b.detail);
  }

  const result: Fetched<T> = {
    data: body as T,
    meta: {
      fetchedAt: res.headers.get('x-cosmos-fetched-at') ?? new Date().toISOString(),
      cache: res.headers.get('x-cosmos-cache') ?? 'DIRECT',
      source: res.headers.get('x-cosmos-source') ?? source,
    },
  };

  if (ttl > 0) {
    clientCache.set(url, { value: result, expires: now + ttl });
    if (clientCache.size > MAX_CLIENT_ENTRIES) {
      const oldest = clientCache.keys().next().value;
      if (oldest !== undefined) clientCache.delete(oldest);
    }
  }
  return result;
}
