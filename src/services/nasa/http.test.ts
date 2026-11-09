import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse } from '@/test/fixtures';
import { ApiError, describeError, fetchJson, isAbortError } from './http';

afterEach(() => vi.unstubAllGlobals());

describe('fetchJson', () => {
  it('returns data with proxy metadata', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ ok: 1 }, 200, { 'x-cosmos-cache': 'HIT', 'x-cosmos-fetched-at': '2026-10-25T00:00:00.000Z', 'x-cosmos-source': 'NASA APOD' })));
    const res = await fetchJson<{ ok: number }>('/api/x', { source: 'Test' });
    expect(res.data.ok).toBe(1);
    expect(res.meta).toEqual({ cache: 'HIT', fetchedAt: '2026-10-25T00:00:00.000Z', source: 'NASA APOD' });
  });

  it('serves repeat requests from the client cache within the TTL', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ n: 1 })));
    vi.stubGlobal('fetch', fetchMock);
    await fetchJson('/api/y', { source: 'T' });
    const second = await fetchJson('/api/y', { source: 'T' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second.meta.cache).toBe('CLIENT');
  });

  it('bypasses the cache when ttl is 0', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ n: 1 })));
    vi.stubGlobal('fetch', fetchMock);
    await fetchJson('/api/z', { source: 'T', ttl: 0 });
    await fetchJson('/api/z', { source: 'T', ttl: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('maps HTTP errors to ApiError with the server message and status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'Rate limit reached', status: 429 }, 429)));
    const err = await fetchJson('/api/e', { source: 'T' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(429);
    expect(describeError(err)).toMatch(/rate limit/i);
  });

  it('handles nested error objects (api.nasa.gov style)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: { message: 'API_KEY_INVALID' } }, 403)));
    await expect(fetchJson('/api/f', { source: 'T' })).rejects.toThrow('API_KEY_INVALID');
  });

  it('rejects non-JSON success bodies instead of rendering garbage', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<VOTABLE/>', { status: 200 })));
    await expect(fetchJson('/api/g', { source: 'Archive' })).rejects.toThrow(/non-JSON/);
  });

  it('wraps network failures as status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const err = await fetchJson('/api/h', { source: 'T' }).catch((e: unknown) => e);
    expect((err as ApiError).status).toBe(0);
    expect(describeError(err)).toMatch(/Network unavailable/);
  });

  it('passes abort errors through untouched', async () => {
    const abort = new DOMException('aborted', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort));
    const err = await fetchJson('/api/i', { source: 'T' }).catch((e: unknown) => e);
    expect(err).toBe(abort);
    expect(isAbortError(err)).toBe(true);
  });
});

describe('describeError', () => {
  it('includes detail when present and falls back for unknown values', () => {
    expect(describeError(new ApiError('Bad', 502, 'ORA-00904'))).toBe('Bad (ORA-00904)');
    expect(describeError(new Error('boom'))).toBe('boom');
    expect(describeError(42)).toBe('Something went wrong.');
  });
});
