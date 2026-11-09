// COSMOS server-side API proxy.
//
// Why a proxy?
//  - NASA Open API keys (APOD, NeoWs) must not ship in the client bundle.
//  - The NASA Exoplanet Archive TAP service does not send CORS headers.
//  - A small in-memory cache keeps us well inside api.nasa.gov rate limits.
//
// Used by both the Vite dev server (vite.config.ts) and the production server (server/index.mjs).

const NASA_API = 'https://api.nasa.gov';
const TAP_SYNC = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';

const MINUTE = 60_000;
export const TTL = {
  apod: 60 * MINUTE,
  neo: 60 * MINUTE,
  exoplanets: 6 * 60 * MINUTE,
};
const MAX_CACHE_ENTRIES = 400;
const UPSTREAM_TIMEOUT_MS = 30_000;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function sendJson(res, status, body, extraHeaders = {}) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...extraHeaders,
  });
  res.end(payload);
}

/**
 * api.nasa.gov responses embed the request URL (including `api_key=...`) in `links` fields.
 * Strip it so the server's key never reaches the browser.
 */
export function redactApiKey(body) {
  return body.replace(/([?&])api_key=[^&"\s]*/g, '$1api_key=REDACTED');
}

function sendError(res, status, message, detail) {
  sendJson(res, status, { error: message, status, ...(detail ? { detail } : {}) });
}

export function isValidDate(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

/**
 * Exoplanet queries are restricted to read-only SELECTs against the
 * Planetary Systems Composite Parameters table (pscomppars) so the proxy
 * cannot be abused as a generic relay.
 */
export function isAllowedAdql(q) {
  if (typeof q !== 'string' || q.length < 10 || q.length > 2500) return false;
  const norm = q.trim().toLowerCase();
  if (!norm.startsWith('select ')) return false;
  if (!/\bfrom\s+pscomppars\b/.test(norm)) return false;
  // Strip quoted string literals before checking for forbidden keywords/tokens,
  // so a search for a planet name can't trip (or smuggle) anything.
  const code = norm.replace(/'(?:[^']|'')*'/g, "''");
  if (/;|--|\/\*|\b(insert|update|delete|drop|alter|create|grant|union|into)\b/.test(code)) return false;
  return true;
}

/**
 * @param {{ apiKey?: string, fetchImpl?: typeof fetch, now?: () => number, log?: boolean }} [options]
 */
export function createApiHandler({ apiKey, fetchImpl = fetch, now = Date.now, log = true } = {}) {
  const key = apiKey && apiKey.trim() ? apiKey.trim() : 'DEMO_KEY';
  /** @type {Map<string, {status:number, body:string, fetchedAt:number, expires:number}>} */
  const cache = new Map();
  /** @type {Map<string, Promise<{status:number, body:string, fetchedAt:number}>>} */
  const inflight = new Map();

  if (key === 'DEMO_KEY' && log) {
    console.warn('[cosmos] NASA_API_KEY not set — using DEMO_KEY (heavily rate-limited). See .env.example.');
  }

  async function cachedFetch(cacheKey, url, ttl) {
    const hit = cache.get(cacheKey);
    if (hit && hit.expires > now()) return { ...hit, cache: 'HIT' };

    let pending = inflight.get(cacheKey);
    if (!pending) {
      pending = (async () => {
        const upstream = await fetchImpl(url, {
          headers: { accept: 'application/json' },
          signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        });
        const body = redactApiKey(await upstream.text());
        return { status: upstream.status, body, fetchedAt: now() };
      })().finally(() => inflight.delete(cacheKey));
      inflight.set(cacheKey, pending);
    }

    try {
      const result = await pending;
      if (result.status === 200) {
        cache.delete(cacheKey);
        cache.set(cacheKey, { ...result, expires: now() + ttl });
        if (cache.size > MAX_CACHE_ENTRIES) {
          const oldest = cache.keys().next().value;
          if (oldest !== undefined) cache.delete(oldest);
        }
      } else if (hit) {
        // Upstream failed (e.g. 429 rate-limit) — serve stale data rather than nothing.
        return { ...hit, cache: 'STALE' };
      }
      return { ...result, cache: 'MISS' };
    } catch (err) {
      if (hit) return { ...hit, cache: 'STALE' };
      throw err;
    }
  }

  function relay(res, result, upstreamName) {
    const headers = {
      'x-cosmos-cache': result.cache,
      'x-cosmos-fetched-at': new Date(result.fetchedAt).toISOString(),
      'x-cosmos-source': upstreamName,
    };
    if (result.status === 200) return sendJson(res, 200, result.body, headers);
    if (result.status === 429) {
      return sendJson(
        res,
        429,
        { error: `${upstreamName} rate limit reached. Try again later or configure NASA_API_KEY.`, status: 429 },
        headers,
      );
    }
    let detail;
    try {
      const parsed = JSON.parse(result.body);
      detail = parsed?.error?.message || parsed?.msg || parsed?.error_message || undefined;
    } catch {
      detail = result.body.slice(0, 300);
    }
    return sendJson(
      res,
      502,
      { error: `${upstreamName} responded with HTTP ${result.status}.`, status: result.status, detail },
      headers,
    );
  }

  /**
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   */
  async function handle(req, res) {
    if (req.method !== 'GET') return sendError(res, 405, 'Method not allowed');
    const url = new URL(req.url || '/', 'http://localhost');
    const p = url.pathname;

    try {
      if (p === '/api/health') {
        return sendJson(res, 200, { ok: true, keyConfigured: key !== 'DEMO_KEY', cacheEntries: cache.size });
      }

      if (p === '/api/apod') {
        const date = url.searchParams.get('date');
        if (date && !isValidDate(date)) return sendError(res, 400, 'date must be YYYY-MM-DD');
        // Note: the documented `thumbs=true` option currently makes the APOD service return HTTP 500, so it is not sent.
        const qs = new URLSearchParams({ api_key: key });
        if (date) qs.set('date', date);
        const result = await cachedFetch(`apod:${date || 'today'}`, `${NASA_API}/planetary/apod?${qs}`, TTL.apod);
        return relay(res, result, 'NASA APOD');
      }

      if (p === '/api/neo/feed') {
        const start = url.searchParams.get('start_date') || '';
        const end = url.searchParams.get('end_date') || start;
        if (!isValidDate(start) || !isValidDate(end)) {
          return sendError(res, 400, 'start_date and end_date must be YYYY-MM-DD');
        }
        const span = (Date.parse(end) - Date.parse(start)) / 86_400_000;
        if (span < 0 || span > 7) return sendError(res, 400, 'NeoWs feed supports ranges of 0–7 days');
        const qs = new URLSearchParams({ start_date: start, end_date: end, api_key: key });
        const result = await cachedFetch(`neo:${start}:${end}`, `${NASA_API}/neo/rest/v1/feed?${qs}`, TTL.neo);
        return relay(res, result, 'NASA NeoWs');
      }

      if (p === '/api/exoplanets') {
        const query = url.searchParams.get('query') || '';
        const maxrec = Math.min(Math.max(Math.floor(Number(url.searchParams.get('maxrec')) || 60), 1), 500);
        if (!isAllowedAdql(query)) return sendError(res, 400, 'Query not permitted by the COSMOS proxy');
        const qs = new URLSearchParams({ query, format: 'json', maxrec: String(maxrec) });
        const result = await cachedFetch(`exo:${maxrec}:${query}`, `${TAP_SYNC}?${qs}`, TTL.exoplanets);
        // TAP returns HTTP 200 with a VOTable error document for bad ADQL.
        if (result.status === 200 && result.body.trimStart().startsWith('<')) {
          const m = result.body.match(/<INFO name="QUERY_STATUS" value="ERROR">([\s\S]*?)<\/INFO>/);
          return sendError(res, 502, 'NASA Exoplanet Archive rejected the query', m?.[1]?.trim());
        }
        return relay(res, result, 'NASA Exoplanet Archive');
      }

      return sendError(res, 404, 'Unknown API route');
    } catch (err) {
      const timedOut = err && (err.name === 'TimeoutError' || err.name === 'AbortError');
      return sendError(
        res,
        timedOut ? 504 : 502,
        timedOut ? 'Upstream request timed out' : 'Upstream request failed',
        String(err?.message || err),
      );
    }
  }

  return handle;
}
