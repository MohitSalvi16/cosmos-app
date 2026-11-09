// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { createApiHandler, isAllowedAdql, isValidDate, redactApiKey, TTL } from './apiHandler.mjs';

/** Minimal ServerResponse stand-in that captures status, headers and body. */
function mockRes() {
  const res = { status: 0, headers: {}, body: '' };
  res.writeHead = (s, h) => {
    res.status = s;
    res.headers = h;
  };
  res.end = (b) => {
    res.body = b;
  };
  res.json = () => JSON.parse(res.body);
  return res;
}

function upstream(body, status = 200) {
  return { status, text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)) };
}

async function call(handler, url, method = 'GET') {
  const res = mockRes();
  await handler({ method, url }, res);
  return res;
}

describe('validation helpers', () => {
  it('accepts only real calendar dates', () => {
    expect(isValidDate('2026-10-25')).toBe(true);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('25-10-2026')).toBe(false);
    expect(isValidDate(undefined)).toBe(false);
  });

  it('allows read-only SELECTs on pscomppars only', () => {
    expect(isAllowedAdql('select pl_name from pscomppars')).toBe(true);
    expect(isAllowedAdql("select pl_name from pscomppars where pl_name = 'drop table b'")).toBe(true); // keywords inside literals are fine
    expect(isAllowedAdql('select * from ps')).toBe(false);
    expect(isAllowedAdql('delete from pscomppars')).toBe(false);
    expect(isAllowedAdql('select 1 from pscomppars; drop table x')).toBe(false);
    expect(isAllowedAdql('select a from pscomppars union select b from other')).toBe(false);
    expect(isAllowedAdql('select a from pscomppars -- comment')).toBe(false);
    expect(isAllowedAdql(`select a from pscomppars where ${'x'.repeat(3000)}`)).toBe(false);
  });

  it('redacts api keys embedded in NASA response links', () => {
    const body = '{"self":"http://api.nasa.gov/neo/rest/v1/neo/1?api_key=SECRET123","next":"x?start=1&api_key=SECRET123&end=2"}';
    const out = redactApiKey(body);
    expect(out).not.toContain('SECRET123');
    expect(out).toContain('?api_key=REDACTED');
    expect(out).toContain('&api_key=REDACTED&end=2');
  });
});

describe('API handler', () => {
  const make = (fetchImpl, now = () => 1_000_000) => createApiHandler({ apiKey: 'MYKEY', fetchImpl, now, log: false });

  it('rejects non-GET methods and unknown routes', async () => {
    const h = make(vi.fn());
    expect((await call(h, '/api/apod', 'POST')).status).toBe(405);
    expect((await call(h, '/api/nope')).status).toBe(404);
  });

  it('reports health without exposing the key', async () => {
    const res = await call(make(vi.fn()), '/api/health');
    expect(res.json()).toEqual({ ok: true, keyConfigured: true, cacheEntries: 0 });
    expect(res.body).not.toContain('MYKEY');
  });

  it('uses DEMO_KEY when no key is configured', async () => {
    const f = vi.fn().mockResolvedValue(upstream({ title: 'x' }));
    const h = createApiHandler({ fetchImpl: f, log: false });
    await call(h, '/api/apod');
    expect(f.mock.calls[0][0]).toContain('api_key=DEMO_KEY');
  });

  it('proxies APOD with the server key and never leaks it', async () => {
    const f = vi.fn().mockResolvedValue(upstream({ title: 'x', url: 'https://api.nasa.gov/planetary/apod?api_key=MYKEY' }));
    const res = await call(make(f), '/api/apod?date=2026-10-20');
    const url = new URL(f.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://api.nasa.gov/planetary/apod');
    expect(url.searchParams.get('api_key')).toBe('MYKEY');
    expect(url.searchParams.get('date')).toBe('2026-10-20');
    expect(url.searchParams.has('thumbs')).toBe(false); // thumbs=true currently triggers HTTP 500 upstream
    expect(res.status).toBe(200);
    expect(res.body).not.toContain('MYKEY');
    expect(res.headers['x-cosmos-cache']).toBe('MISS');
    expect(res.headers['x-cosmos-source']).toBe('NASA APOD');
  });

  it('validates APOD and NeoWs dates and ranges before calling upstream', async () => {
    const f = vi.fn();
    const h = make(f);
    expect((await call(h, '/api/apod?date=yesterday')).status).toBe(400);
    expect((await call(h, '/api/neo/feed?start_date=2026-10-01&end_date=2026-10-20')).status).toBe(400);
    expect((await call(h, '/api/neo/feed?start_date=2026-10-20&end_date=2026-10-01')).status).toBe(400);
    expect((await call(h, '/api/neo/feed')).status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });

  it('caches successful responses until the TTL expires', async () => {
    let t = 1_000_000;
    const f = vi.fn().mockImplementation(() => Promise.resolve(upstream({ element_count: 1, near_earth_objects: {} })));
    const h = make(f, () => t);
    const url = '/api/neo/feed?start_date=2026-10-25&end_date=2026-10-26';
    expect((await call(h, url)).headers['x-cosmos-cache']).toBe('MISS');
    expect((await call(h, url)).headers['x-cosmos-cache']).toBe('HIT');
    expect(f).toHaveBeenCalledTimes(1);
    t += TTL.neo + 1;
    expect((await call(h, url)).headers['x-cosmos-cache']).toBe('MISS');
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('de-duplicates concurrent identical requests', async () => {
    let resolve;
    const f = vi.fn().mockImplementation(() => new Promise((r) => (resolve = r)));
    const h = make(f);
    const a = call(h, '/api/apod');
    const b = call(h, '/api/apod');
    await Promise.resolve();
    resolve(upstream({ title: 'x' }));
    const [ra, rb] = await Promise.all([a, b]);
    expect(f).toHaveBeenCalledTimes(1);
    expect(ra.status).toBe(200);
    expect(rb.status).toBe(200);
  });

  it('serves stale cached data when upstream is rate-limited', async () => {
    let t = 0;
    const f = vi.fn().mockResolvedValueOnce(upstream({ title: 'cached' })).mockResolvedValueOnce(upstream({ error: 'OVER_RATE_LIMIT' }, 429));
    const h = make(f, () => t);
    await call(h, '/api/apod');
    t += TTL.apod + 1;
    const res = await call(h, '/api/apod');
    expect(res.status).toBe(200);
    expect(res.headers['x-cosmos-cache']).toBe('STALE');
    expect(res.json().title).toBe('cached');
  });

  it('maps 429 without cache to a clear rate-limit error', async () => {
    const res = await call(make(vi.fn().mockResolvedValue(upstream('{}', 429))), '/api/apod');
    expect(res.status).toBe(429);
    expect(res.json().error).toMatch(/rate limit/i);
  });

  it('maps other upstream failures to 502 with detail', async () => {
    const res = await call(make(vi.fn().mockResolvedValue(upstream({ code: 500, msg: 'Internal Service Error' }, 500))), '/api/apod');
    expect(res.status).toBe(502);
    expect(res.json()).toMatchObject({ status: 500, detail: 'Internal Service Error' });
  });

  it('maps network errors and timeouts', async () => {
    const boom = await call(make(vi.fn().mockRejectedValue(new Error('ECONNRESET'))), '/api/apod');
    expect(boom.status).toBe(502);
    const timeout = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
    const slow = await call(make(vi.fn().mockRejectedValue(timeout)), '/api/apod?date=2026-01-01');
    expect(slow.status).toBe(504);
  });

  it('proxies allowed exoplanet queries with clamped maxrec', async () => {
    const f = vi.fn().mockResolvedValue(upstream([{ pl_name: 'A b' }]));
    const q = encodeURIComponent('select pl_name from pscomppars');
    const res = await call(make(f), `/api/exoplanets?query=${q}&maxrec=99999`);
    const url = new URL(f.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://exoplanetarchive.ipac.caltech.edu/TAP/sync');
    expect(url.searchParams.get('format')).toBe('json');
    expect(url.searchParams.get('maxrec')).toBe('500');
    expect(res.json()).toEqual([{ pl_name: 'A b' }]);
  });

  it('rejects disallowed exoplanet queries', async () => {
    const f = vi.fn();
    const res = await call(make(f), `/api/exoplanets?query=${encodeURIComponent('select * from ps')}`);
    expect(res.status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });

  it('turns TAP VOTable error documents (HTTP 200) into a 502 with the ADQL error', async () => {
    const votable = `<?xml version="1.0"?><VOTABLE><RESOURCE type="results"><INFO name="QUERY_STATUS" value="ERROR">
ORA-00904: 'ROWUPDATE': invalid identifier
</INFO></RESOURCE></VOTABLE>`;
    const res = await call(make(vi.fn().mockResolvedValue(upstream(votable))), `/api/exoplanets?query=${encodeURIComponent('select rowupdate from pscomppars')}`);
    expect(res.status).toBe(502);
    expect(res.json().detail).toContain('ORA-00904');
  });
});
