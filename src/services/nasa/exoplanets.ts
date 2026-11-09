// NASA Exoplanet Archive — Planetary Systems Composite Parameters (pscomppars) via TAP sync.
// Docs: https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html
//
// Archive quirks verified against the live service:
//  - `TOP n` is applied BEFORE `ORDER BY`, so we never use it; the TAP `maxrec` parameter
//    limits rows after ordering instead.
//  - OFFSET/FETCH is not supported, so pagination uses keyset cursors (sort value + pl_name).
//  - The service sends no CORS headers, so requests go through the COSMOS proxy (/api/exoplanets).
//  - A web firewall in front of the archive returns HTTP 403 for some SQL-looking patterns (see buildWhere).

import type { ExoplanetCursor, ExoplanetDetailRow, ExoplanetFilters, ExoplanetRow, ExoplanetSort, Fetched } from '@/types';
import { fetchJson } from './http';

export const EXOPLANET_SOURCE = 'NASA Exoplanet Archive';
export const EXOPLANET_PAGE_SIZE = 30;

export const LIST_COLUMNS = [
  'pl_name',
  'hostname',
  'discoverymethod',
  'disc_year',
  'pl_rade',
  'pl_bmasse',
  'pl_orbper',
  'sy_dist',
  'pl_eqt',
  'disc_facility',
] as const;

export const DETAIL_COLUMNS = [
  ...LIST_COLUMNS,
  'sy_snum',
  'sy_pnum',
  'disc_telescope',
  'pl_orbsmax',
  'pl_radj',
  'pl_bmassj',
  'pl_bmassprov',
  'pl_orbeccen',
  'pl_insol',
  'st_spectype',
  'st_teff',
  'st_rad',
  'st_mass',
  'ra',
  'dec',
  'rastr',
  'decstr',
] as const;

/** Discovery methods present in pscomppars (verified via SELECT DISTINCT). */
export const DISCOVERY_METHODS = [
  'Transit',
  'Radial Velocity',
  'Microlensing',
  'Imaging',
  'Transit Timing Variations',
  'Eclipse Timing Variations',
  'Orbital Brightness Modulation',
  'Pulsar Timing',
  'Astrometry',
  'Pulsation Timing Variations',
  'Disk Kinematics',
] as const;

const SORTS: Record<ExoplanetSort, { column: string; dir: 'asc' | 'desc'; numeric: boolean }> = {
  disc_year_desc: { column: 'disc_year', dir: 'desc', numeric: true },
  disc_year_asc: { column: 'disc_year', dir: 'asc', numeric: true },
  distance_asc: { column: 'sy_dist', dir: 'asc', numeric: true },
  distance_desc: { column: 'sy_dist', dir: 'desc', numeric: true },
  period_asc: { column: 'pl_orbper', dir: 'asc', numeric: true },
  period_desc: { column: 'pl_orbper', dir: 'desc', numeric: true },
  name_asc: { column: 'pl_name', dir: 'asc', numeric: false },
};

export function sortColumn(sort: ExoplanetSort): string {
  return SORTS[sort].column;
}

/** Escapes a value for use inside an ADQL single-quoted string literal. */
export function adqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/** Sanitises free-text name search: strips LIKE wildcards and control characters, lowercases. */
export function sanitizeNameTerm(term: string): string {
  return term
    .replace(/[%_\\]/g, ' ')
    .replace(/[\u0000-\u001f]/g, '')
    .trim()
    .toLowerCase()
    .slice(0, 80);
}

function finite(n: number | undefined): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

export function buildWhere(filters: ExoplanetFilters, sort?: ExoplanetSort): string[] {
  const where: string[] = [];
  const name = filters.name ? sanitizeNameTerm(filters.name) : '';
  if (name) where.push(`lower(pl_name) like ${adqlString(`%${name}%`)}`);
  if (filters.method && (DISCOVERY_METHODS as readonly string[]).includes(filters.method)) {
    where.push(`discoverymethod = ${adqlString(filters.method)}`);
  }
  if (finite(filters.yearMin)) where.push(`disc_year >= ${Math.floor(filters.yearMin)}`);
  if (finite(filters.yearMax)) where.push(`disc_year <= ${Math.floor(filters.yearMax)}`);
  if (finite(filters.maxDistancePc)) where.push(`sy_dist <= ${Number(filters.maxDistancePc)}`);
  // Sorting by a nullable column: rows without a value can't be ordered meaningfully, exclude them.
  // `col >= 0` is used instead of `col is not null` (equivalent here: every sortable column is
  // non-negative) because the archive's web firewall rejects some queries that combine a quoted
  // string literal with `is not null` (HTTP 403).
  if (sort && SORTS[sort].numeric) {
    const clause = `${SORTS[sort].column} >= 0`;
    if (!where.includes(clause)) where.push(clause);
  }
  return where;
}

function literal(value: number | string, numeric: boolean): string {
  return numeric ? String(Number(value)) : adqlString(String(value));
}

export function buildListQuery(filters: ExoplanetFilters, sort: ExoplanetSort, cursor?: ExoplanetCursor): string {
  const { column, dir, numeric } = SORTS[sort];
  const where = buildWhere(filters, sort);
  if (cursor) {
    const op = dir === 'desc' ? '<' : '>';
    if (column === 'pl_name') {
      where.push(`pl_name > ${adqlString(cursor.name)}`);
    } else {
      const v = literal(cursor.value, numeric);
      where.push(`(${column} ${op} ${v} or (${column} = ${v} and pl_name > ${adqlString(cursor.name)}))`);
    }
  }
  const order = column === 'pl_name' ? 'pl_name asc' : `${column} ${dir}, pl_name asc`;
  return `select ${LIST_COLUMNS.join(',')} from pscomppars${where.length ? ` where ${where.join(' and ')}` : ''} order by ${order}`;
}

export function buildCountQuery(filters: ExoplanetFilters, sort?: ExoplanetSort): string {
  const where = buildWhere(filters, sort);
  return `select count(*) as n from pscomppars${where.length ? ` where ${where.join(' and ')}` : ''}`;
}

export function buildDetailQuery(name: string): string {
  return `select ${DETAIL_COLUMNS.join(',')} from pscomppars where pl_name = ${adqlString(name)}`;
}

export function cursorFromRow(row: ExoplanetRow, sort: ExoplanetSort): ExoplanetCursor | undefined {
  const col = SORTS[sort].column as keyof ExoplanetRow;
  const value = row[col];
  if (value === null || value === undefined) return undefined;
  return { value: value as number | string, name: row.pl_name };
}

function proxyUrl(query: string, maxrec: number): string {
  return `/api/exoplanets?${new URLSearchParams({ query, maxrec: String(maxrec) })}`;
}

export interface ExoplanetPage {
  rows: ExoplanetRow[];
  nextCursor?: ExoplanetCursor;
}

export async function fetchExoplanetPage(
  filters: ExoplanetFilters,
  sort: ExoplanetSort,
  cursor: ExoplanetCursor | undefined,
  signal?: AbortSignal,
  pageSize = EXOPLANET_PAGE_SIZE,
): Promise<Fetched<ExoplanetPage>> {
  const res = await fetchJson<ExoplanetRow[]>(proxyUrl(buildListQuery(filters, sort, cursor), pageSize), {
    signal,
    source: EXOPLANET_SOURCE,
    ttl: 30 * 60_000,
  });
  const rows = Array.isArray(res.data) ? res.data : [];
  const last = rows[rows.length - 1];
  const nextCursor = rows.length === pageSize && last ? cursorFromRow(last, sort) : undefined;
  return { data: { rows, nextCursor }, meta: res.meta };
}

export async function fetchExoplanetCount(filters: ExoplanetFilters, sort: ExoplanetSort | undefined, signal?: AbortSignal): Promise<number> {
  const res = await fetchJson<{ n: number }[]>(proxyUrl(buildCountQuery(filters, sort), 1), {
    signal,
    source: EXOPLANET_SOURCE,
    ttl: 30 * 60_000,
  });
  return res.data[0]?.n ?? 0;
}

export async function fetchExoplanetDetail(name: string, signal?: AbortSignal): Promise<Fetched<ExoplanetDetailRow | null>> {
  const res = await fetchJson<ExoplanetDetailRow[]>(proxyUrl(buildDetailQuery(name), 1), {
    signal,
    source: EXOPLANET_SOURCE,
    ttl: 30 * 60_000,
  });
  return { data: res.data[0] ?? null, meta: res.meta };
}

/** Lightweight name search for the command palette. */
export async function searchExoplanetNames(term: string, signal?: AbortSignal, limit = 6): Promise<ExoplanetRow[]> {
  const clean = sanitizeNameTerm(term);
  if (clean.length < 2) return [];
  const res = await fetchExoplanetPage({ name: clean }, 'name_asc', undefined, signal, limit);
  return res.data.rows;
}

export function archiveOverviewUrl(name: string): string {
  return `https://exoplanetarchive.ipac.caltech.edu/overview/${encodeURIComponent(name)}`;
}
