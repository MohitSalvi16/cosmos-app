import { afterEach, describe, expect, it, vi } from 'vitest';
import { EXO_ROWS, jsonResponse } from '@/test/fixtures';
import {
  adqlString,
  archiveOverviewUrl,
  buildCountQuery,
  buildDetailQuery,
  buildListQuery,
  buildWhere,
  cursorFromRow,
  fetchExoplanetDetail,
  fetchExoplanetPage,
  sanitizeNameTerm,
  searchExoplanetNames,
} from './exoplanets';

afterEach(() => vi.unstubAllGlobals());

describe('ADQL building', () => {
  it('escapes single quotes in string literals', () => {
    expect(adqlString("O'Hara b")).toBe("'O''Hara b'");
  });

  it('strips LIKE wildcards and control characters from name searches', () => {
    expect(sanitizeNameTerm('  Kepler_%452\\ ')).toBe('kepler  452');
    expect(sanitizeNameTerm('a\u0000b')).toBe('ab');
    expect(sanitizeNameTerm('x'.repeat(200))).toHaveLength(80);
  });

  it('builds filters for name, method, years and distance', () => {
    const where = buildWhere({ name: 'TRAPPIST', method: 'Transit', yearMin: 2010.7, yearMax: 2020, maxDistancePc: 50 });
    expect(where).toEqual([
      "lower(pl_name) like '%trappist%'",
      "discoverymethod = 'Transit'",
      'disc_year >= 2010',
      'disc_year <= 2020',
      'sy_dist <= 50',
    ]);
  });

  it('ignores discovery methods outside the archive’s known list (no injection via select values)', () => {
    expect(buildWhere({ method: "Transit' or 1=1" })).toEqual([]);
  });

  it('ignores non-finite numeric filters', () => {
    expect(buildWhere({ yearMin: NaN, maxDistancePc: Infinity })).toEqual([]);
  });

  it('excludes null sort values with `>= 0`, never `is not null` (archive firewall returns 403 for that pattern)', () => {
    const q = buildListQuery({ method: 'Imaging' }, 'distance_asc');
    expect(q).toContain('sy_dist >= 0');
    expect(q).not.toMatch(/is not null/i);
  });

  it('never uses TOP (the archive applies TOP before ORDER BY)', () => {
    expect(buildListQuery({}, 'disc_year_desc')).not.toMatch(/\btop\b/i);
  });

  it('orders with a pl_name tiebreaker for stable keyset pagination', () => {
    expect(buildListQuery({}, 'disc_year_desc')).toMatch(/order by disc_year desc, pl_name asc$/);
    expect(buildListQuery({}, 'name_asc')).toMatch(/order by pl_name asc$/);
  });

  it('adds keyset conditions after a cursor', () => {
    const desc = buildListQuery({}, 'disc_year_desc', { value: 2004, name: "O'Hara b" });
    expect(desc).toContain("(disc_year < 2004 or (disc_year = 2004 and pl_name > 'O''Hara b'))");
    const asc = buildListQuery({}, 'period_asc', { value: 3.5, name: 'K2-1 b' });
    expect(asc).toContain("(pl_orbper > 3.5 or (pl_orbper = 3.5 and pl_name > 'K2-1 b'))");
    const byName = buildListQuery({}, 'name_asc', { value: 'K2-1 b', name: 'K2-1 b' });
    expect(byName).toContain("pl_name > 'K2-1 b'");
  });

  it('builds count and detail queries against pscomppars', () => {
    expect(buildCountQuery({})).toBe('select count(*) as n from pscomppars');
    expect(buildDetailQuery('Kepler-452 b')).toMatch(/from pscomppars where pl_name = 'Kepler-452 b'$/);
  });

  it('derives cursors from the sort column, or none if it is null', () => {
    expect(cursorFromRow(EXO_ROWS[0]!, 'distance_asc')).toEqual({ value: 12.5855, name: '55 Cnc c' });
    expect(cursorFromRow(EXO_ROWS[1]!, 'distance_asc')).toBeUndefined();
  });

  it('links to the archive overview page', () => {
    expect(archiveOverviewUrl('Kepler-452 b')).toBe('https://exoplanetarchive.ipac.caltech.edu/overview/Kepler-452%20b');
  });
});

describe('exoplanet fetching (via proxy)', () => {
  it('requests the proxy with query + maxrec and returns a next cursor on full pages', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(EXO_ROWS, 200, { 'x-cosmos-cache': 'MISS', 'x-cosmos-fetched-at': '2026-10-25T08:00:00.000Z' }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await fetchExoplanetPage({}, 'disc_year_desc', undefined, undefined, 2);
    const url = new URL(fetchMock.mock.calls[0]![0] as string, 'http://x');
    expect(url.pathname).toBe('/api/exoplanets');
    expect(url.searchParams.get('maxrec')).toBe('2');
    expect(url.searchParams.get('query')).toMatch(/^select /);
    expect(res.data.rows).toHaveLength(2);
    expect(res.data.nextCursor).toEqual({ value: 2004, name: "O'Hara b" });
    expect(res.meta.cache).toBe('MISS');
  });

  it('has no next cursor on a short (final) page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([EXO_ROWS[0]])));
    const res = await fetchExoplanetPage({}, 'name_asc', undefined, undefined, 30);
    expect(res.data.nextCursor).toBeUndefined();
  });

  it('returns null for an unknown planet', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));
    const res = await fetchExoplanetDetail('Nope b');
    expect(res.data).toBeNull();
  });

  it('skips remote name search for terms shorter than 2 characters', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await searchExoplanetNames('k')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
