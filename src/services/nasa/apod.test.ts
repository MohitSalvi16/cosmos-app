import { afterEach, describe, expect, it, vi } from 'vitest';
import { APOD_IMAGE, jsonResponse } from '@/test/fixtures';
import { apodDisplayImage, apodPageUrl, fetchApod } from './apod';

afterEach(() => vi.unstubAllGlobals());

describe('APOD helpers', () => {
  it('builds the canonical apod.nasa.gov page URL', () => {
    expect(apodPageUrl('2026-10-25')).toBe('https://apod.nasa.gov/apod/ap261025.html');
    expect(apodPageUrl('1995-06-16')).toBe('https://apod.nasa.gov/apod/ap950616.html');
  });

  it('chooses an image for display, using thumbnails for videos and nothing otherwise', () => {
    expect(apodDisplayImage(APOD_IMAGE)).toBe(APOD_IMAGE.url);
    expect(apodDisplayImage({ ...APOD_IMAGE, media_type: 'video', url: 'https://youtube.com/embed/x', thumbnail_url: 'https://img/t.jpg' })).toBe('https://img/t.jpg');
    expect(apodDisplayImage({ ...APOD_IMAGE, media_type: 'video', thumbnail_url: undefined })).toBeNull();
    expect(apodDisplayImage({ ...APOD_IMAGE, media_type: 'other', url: undefined })).toBeNull();
  });

  it('requests today or a specific date through the proxy', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(APOD_IMAGE)));
    vi.stubGlobal('fetch', fetchMock);
    await fetchApod();
    await fetchApod('2020-01-01');
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/api/apod', '/api/apod?date=2020-01-01']);
  });
});
