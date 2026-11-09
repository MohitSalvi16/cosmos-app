import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, NEO_RAW, neoFeed } from '@/test/fixtures';
import { fetchNeoFeed, flattenFeed, parseNeo } from './neo';

afterEach(() => vi.unstubAllGlobals());

describe('NeoWs parsing', () => {
  it('parses the real feed schema into numeric fields', () => {
    const n = parseNeo(NEO_RAW)!;
    expect(n).toMatchObject({
      id: '2488509',
      name: '488509 (2000 UW13)',
      hazardous: false,
      sentry: false,
      approachDate: '2026-10-26',
      orbitingBody: 'Earth',
    });
    expect(n.velocityKmS).toBeCloseTo(18.6315, 3);
    expect(n.missKm).toBeCloseTo(66425278.8, 0);
    expect(n.missLunar).toBeCloseTo(172.73, 2);
    expect(n.diameterMinM).toBeCloseTo(200.7, 1);
    expect(n.diameterMaxM).toBeCloseTo(448.79, 1);
  });

  it('strips wrapping parentheses from provisional designations', () => {
    expect(parseNeo({ ...NEO_RAW, name: '(2026 AB)' })!.name).toBe('2026 AB');
  });

  it('skips objects without close-approach data', () => {
    expect(parseNeo({ ...NEO_RAW, close_approach_data: [] })).toBeNull();
  });

  it('flattens date-keyed groups and sorts chronologically', () => {
    const list = flattenFeed(neoFeed());
    expect(list.map((n) => n.id)).toEqual(['2488509', '3']);
    expect(list[1]!.hazardous).toBe(true);
  });

  it('tolerates an empty feed', () => {
    expect(flattenFeed({ element_count: 0, near_earth_objects: {} })).toEqual([]);
  });

  it('calls the proxy with the date range (no API key in the browser)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(neoFeed()));
    vi.stubGlobal('fetch', fetchMock);
    const res = await fetchNeoFeed('2026-10-26', '2026-10-27');
    const url = fetchMock.mock.calls[0]![0] as string;
    expect(url).toBe('/api/neo/feed?start_date=2026-10-26&end_date=2026-10-27');
    expect(url).not.toContain('api_key');
    expect(res.data).toHaveLength(2);
  });
});
