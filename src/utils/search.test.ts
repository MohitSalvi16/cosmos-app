import { describe, expect, it } from 'vitest';
import type { SearchResult } from '@/types';
import {
  addRecentSearch,
  buildLocalIndex,
  getRecentSearches,
  groupResults,
  hasRecentConsent,
  normalize,
  scoreEntry,
  searchLocal,
  setRecentConsent,
} from './search';

const index = buildLocalIndex();

describe('local search index', () => {
  it('indexes every curated object and section with a working route', () => {
    const ids = index.map((e) => e.id);
    expect(ids).toContain('body:saturn');
    expect(ids).toContain('galaxy:andromeda');
    expect(ids).toContain('star:betelgeuse');
    expect(ids).toContain('bh:sgr-a-star');
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of index) expect(e.href.startsWith('/')).toBe(true);
  });

  it('normalizes case, accents and whitespace', () => {
    expect(normalize('  Chang’e   ÉTOILE ')).toBe('chang’e etoile');
  });

  it('returns 0 for a non-matching entry (regression: title bonus used to match everything)', () => {
    const sun = index.find((e) => e.id === 'body:sun')!;
    expect(scoreEntry(sun, 'saturn')).toBe(0);
    expect(scoreEntry(sun, '')).toBe(0);
  });

  it('ranks exact title matches first', () => {
    expect(searchLocal(index, 'Saturn')[0]?.title).toBe('Saturn');
    expect(searchLocal(index, 'andromeda')[0]?.title).toBe('Andromeda Galaxy');
    expect(searchLocal(index, 'Sagittarius A*')[0]?.title).toBe('Sagittarius A*');
  });

  it('matches catalog identifiers and designations', () => {
    expect(searchLocal(index, 'M31')[0]?.href).toBe('/galaxies/andromeda');
    expect(searchLocal(index, 'NGC 4594')[0]?.href).toBe('/galaxies/sombrero');
    expect(searchLocal(index, 'α Orionis')[0]?.href).toBe('/stars/betelgeuse');
  });

  it('supports natural phrases from the brief', () => {
    expect(searchLocal(index, 'Jupiter moons').map((r) => r.title)).toContain('Europa');
    expect(searchLocal(index, 'Asteroids approaching Earth')[0]?.href).toBe('/asteroids');
  });

  it('returns nothing for gibberish (never fabricates results)', () => {
    expect(searchLocal(index, 'zzqxw')).toEqual([]);
  });

  it('respects the result limit', () => {
    expect(searchLocal(index, 'a', 3).length).toBeLessThanOrEqual(3);
  });
});

describe('groupResults', () => {
  const r = (id: string, category: SearchResult['category']): SearchResult => ({ id, title: id, subtitle: '', category, href: '/' });

  it('keeps the best-ranked category first and live categories after local ones', () => {
    const local = [r('saturn', 'Solar System'), r('titan', 'Moons'), r('mercury', 'Solar System')];
    const remote = [r('kepler', 'Exoplanets')];
    expect(groupResults(local, remote).map((x) => x.id)).toEqual(['saturn', 'mercury', 'titan', 'kepler']);
  });
});

describe('recent searches (opt-in local storage)', () => {
  it('stores nothing without consent', () => {
    expect(hasRecentConsent()).toBe(false);
    addRecentSearch('Saturn');
    expect(getRecentSearches()).toEqual([]);
    expect(window.localStorage.length).toBe(0);
  });

  it('stores de-duplicated, most-recent-first searches once consent is given', () => {
    setRecentConsent(true);
    addRecentSearch('Saturn');
    addRecentSearch('Andromeda');
    addRecentSearch('saturn');
    expect(getRecentSearches()).toEqual(['saturn', 'Andromeda']);
  });

  it('caps the list and clears everything when consent is withdrawn', () => {
    setRecentConsent(true);
    for (let i = 0; i < 10; i++) addRecentSearch(`q${i}`);
    expect(getRecentSearches()).toHaveLength(6);
    setRecentConsent(false);
    expect(getRecentSearches()).toEqual([]);
    expect(window.localStorage.getItem('cosmos.recentSearches')).toBeNull();
  });

  it('ignores corrupted storage', () => {
    setRecentConsent(true);
    window.localStorage.setItem('cosmos.recentSearches', '{not json');
    expect(getRecentSearches()).toEqual([]);
  });
});
