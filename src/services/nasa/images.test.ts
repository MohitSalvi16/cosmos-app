import { afterEach, describe, expect, it, vi } from 'vitest';
import { IMAGES_RAW, jsonResponse } from '@/test/fixtures';
import { buildSearchUrl, fetchAssetLinks, parseSearch, pickAssets, searchNasaMedia } from './images';

afterEach(() => vi.unstubAllGlobals());

describe('NASA Image Library parsing', () => {
  it('parses items, credits, keywords and pagination from the real schema', () => {
    const res = parseSearch(IMAGES_RAW);
    expect(res.totalHits).toBe(43);
    expect(res.hasNext).toBe(true);
    expect(res.items).toHaveLength(1); // the item without data is skipped
    const item = res.items[0]!;
    expect(item).toMatchObject({
      nasaId: 'PIA20970',
      title: 'Pulsar Candidate in Andromeda',
      center: 'JPL',
      credit: 'NASA/JPL-Caltech/GSFC/JHU',
      mediaType: 'image',
      detailsUrl: 'https://images.nasa.gov/details/PIA20970',
    });
    expect(item.description).toBe('NASA NuSTAR has identified a candidate pulsar in Andromeda.'); // prefers 508 text
    expect(item.keywords).toEqual(['Galaxy Evolution Explorer GALEX', 'NuSTAR', 'Andromeda galaxy']);
  });

  it('upgrades asset links to https', () => {
    const item = parseSearch(IMAGES_RAW).items[0]!;
    expect(item.preview).toBe('https://images-assets.nasa.gov/image/PIA20970/PIA20970~small.jpg');
    expect(item.thumbnail?.startsWith('https://')).toBe(true);
  });

  it('handles missing metadata gracefully', () => {
    const res = parseSearch({ collection: { items: [{ href: '', data: [{ nasa_id: 'X', media_type: 'audio' }] }] } });
    expect(res.items[0]).toMatchObject({ title: 'Untitled', description: null, credit: null, thumbnail: null, keywords: [] });
    expect(res.totalHits).toBe(1);
    expect(res.hasNext).toBe(false);
  });

  it('builds search URLs with media types and paging', () => {
    const url = new URL(buildSearchUrl({ q: ' pillars ', mediaTypes: ['image', 'video'], page: 2, pageSize: 12 }));
    expect(url.origin).toBe('https://images-api.nasa.gov');
    expect(url.searchParams.get('q')).toBe('pillars');
    expect(url.searchParams.get('media_type')).toBe('image,video');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('page_size')).toBe('12');
  });

  it('picks the right renditions from an asset manifest', () => {
    const base = 'http://images-assets.nasa.gov/video/X/X';
    const a = pickAssets([`${base}~orig.mp4`, `${base}.vtt`, `${base}~mobile.mp4`, `${base}~small.mp4`, `${base}~large.jpg`, `${base}/metadata.json`]);
    expect(a.original).toBe('https://images-assets.nasa.gov/video/X/X~orig.mp4');
    expect(a.video).toBe('https://images-assets.nasa.gov/video/X/X~mobile.mp4');
    expect(a.captions).toBe('https://images-assets.nasa.gov/video/X/X.vtt');
    expect(a.large).toBe('https://images-assets.nasa.gov/video/X/X~large.jpg');
    expect(a.audio).toBeNull();
  });

  it('reads both manifest formats (collection.json array and /asset object)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse(['http://a/X~orig.jpg'])));
    expect((await fetchAssetLinks('https://m/1')).original).toBe('https://a/X~orig.jpg');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({ collection: { items: [{ href: 'http://a/Y~orig.png' }] } })));
    expect((await fetchAssetLinks('https://m/2')).original).toBe('https://a/Y~orig.png');
  });

  it('queries the public API directly (keyless, CORS-enabled)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(IMAGES_RAW));
    vi.stubGlobal('fetch', fetchMock);
    const res = await searchNasaMedia({ q: 'andromeda' });
    expect((fetchMock.mock.calls[0]![0] as string).startsWith('https://images-api.nasa.gov/search?')).toBe(true);
    expect(res.meta.cache).toBe('DIRECT');
    expect(res.data.items[0]?.nasaId).toBe('PIA20970');
  });
});
