// NASA Image and Video Library — https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf
// Public, keyless and CORS-enabled, so it is called directly from the browser.

import type { Fetched, NasaImageSearchRaw, NasaImageSearchResult, NasaMediaItem, NasaMediaType } from '@/types';
import { fetchJson } from './http';

export const IMAGES_API = 'https://images-api.nasa.gov';
export const IMAGES_SOURCE = 'NASA Image and Video Library';

function https(url: string | undefined | null): string | null {
  if (!url) return null;
  return url.replace(/^http:\/\//, 'https://');
}

export function parseSearch(raw: NasaImageSearchRaw): NasaImageSearchResult {
  const items: NasaMediaItem[] = [];
  for (const it of raw.collection?.items ?? []) {
    const d = it.data?.[0];
    if (!d?.nasa_id) continue;
    const preview = it.links?.find((l) => l.rel === 'preview');
    const medium = it.links?.find((l) => l.rel === 'alternate' && (l.width ?? 0) >= 640) ?? it.links?.find((l) => l.rel === 'alternate');
    const credit = [d.photographer, d.secondary_creator].filter(Boolean).join(' / ') || null;
    items.push({
      nasaId: d.nasa_id,
      title: d.title?.trim() || 'Untitled',
      description: d.description_508?.trim() || d.description?.trim() || null,
      dateCreated: d.date_created ?? null,
      center: d.center ?? null,
      credit,
      keywords: (d.keywords ?? []).flatMap((k) => k.split(',')).map((k) => k.trim()).filter(Boolean).slice(0, 8),
      mediaType: d.media_type,
      thumbnail: https(preview?.href),
      preview: https(medium?.href ?? preview?.href),
      detailsUrl: `https://images.nasa.gov/details/${encodeURIComponent(d.nasa_id)}`,
      manifestUrl: https(it.href) ?? `${IMAGES_API}/asset/${encodeURIComponent(d.nasa_id)}`,
    });
  }
  return {
    items,
    totalHits: raw.collection?.metadata?.total_hits ?? items.length,
    hasNext: Boolean(raw.collection?.links?.some((l) => l.rel === 'next')),
  };
}

export interface ImageSearchParams {
  q: string;
  mediaTypes?: NasaMediaType[];
  page?: number;
  pageSize?: number;
}

export function buildSearchUrl({ q, mediaTypes = ['image'], page = 1, pageSize = 24 }: ImageSearchParams): string {
  const qs = new URLSearchParams({
    q: q.trim(),
    media_type: mediaTypes.join(','),
    page: String(page),
    page_size: String(pageSize),
  });
  return `${IMAGES_API}/search?${qs}`;
}

export async function searchNasaMedia(params: ImageSearchParams, signal?: AbortSignal): Promise<Fetched<NasaImageSearchResult>> {
  const res = await fetchJson<NasaImageSearchRaw>(buildSearchUrl(params), { signal, source: IMAGES_SOURCE, ttl: 15 * 60_000 });
  return { data: parseSearch(res.data), meta: res.meta };
}

interface AssetManifestRaw {
  collection: { items: { href: string }[] };
}

export interface AssetLinks {
  original: string | null;
  large: string | null;
  video: string | null;
  audio: string | null;
  captions: string | null;
}

export function pickAssets(hrefs: string[]): AssetLinks {
  const all = hrefs.map((h) => h.replace(/^http:\/\//, 'https://'));
  const find = (re: RegExp) => all.find((h) => re.test(h)) ?? null;
  return {
    original: find(/~orig\.(jpe?g|png|tif|gif|mp4|mov|mp3|wav|m4a)$/i),
    large: find(/~large\.(jpe?g|png)$/i) ?? find(/~medium\.(jpe?g|png)$/i),
    video: find(/~mobile\.mp4$/i) ?? find(/~medium\.mp4$/i) ?? find(/~small\.mp4$/i) ?? find(/\.mp4$/i),
    audio: find(/~128k\.mp3$/i) ?? find(/\.(mp3|m4a)$/i),
    captions: find(/\.(srt|vtt)$/i),
  };
}

/** Fetches the asset manifest for an item (all renditions: original, large, video files, captions). */
export async function fetchAssetLinks(manifestUrl: string, signal?: AbortSignal): Promise<AssetLinks> {
  const res = await fetchJson<AssetManifestRaw | string[]>(manifestUrl, { signal, source: IMAGES_SOURCE, ttl: 60 * 60_000 });
  // /search returns a link to collection.json (a plain array); /asset/{id} returns { collection: { items } }.
  const hrefs = Array.isArray(res.data) ? res.data : res.data.collection.items.map((i) => i.href);
  return pickAssets(hrefs);
}
