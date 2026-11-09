// Local (curated) search index used by the command palette. Remote datasets are queried separately.

import { BLACK_HOLES } from '@/data/blackHoles';
import { GALAXIES } from '@/data/galaxyCatalog';
import { SOLAR_SYSTEM } from '@/data/solarSystem';
import { STARS } from '@/data/starCatalog';
import type { SearchCategory, SearchResult } from '@/types';

export interface IndexEntry extends SearchResult {
  /** Lower-cased search terms (names, identifiers, keywords). */
  terms: string[];
}

export const SECTIONS: { title: string; href: string; terms: string[]; subtitle: string }[] = [
  { title: 'Universe Explorer', href: '/explore', subtitle: 'Interactive 3D Solar System', terms: ['explore', 'universe', '3d', 'solar system', 'orbit'] },
  { title: 'Planets', href: '/planets', subtitle: 'The eight planets, the Sun and key moons', terms: ['planets', 'solar system'] },
  { title: 'Exoplanets', href: '/exoplanets', subtitle: 'Live NASA Exoplanet Archive', terms: ['exoplanets', 'exoplanet', 'kepler', 'tess', 'worlds'] },
  { title: 'Galaxies', href: '/galaxies', subtitle: 'Curated galaxy catalog', terms: ['galaxies', 'galaxy'] },
  { title: 'Stars', href: '/stars', subtitle: 'Notable stars', terms: ['stars', 'star'] },
  { title: 'Black Holes', href: '/black-holes', subtitle: 'Event horizons and accretion disks', terms: ['black hole', 'black holes', 'event horizon'] },
  {
    title: 'Asteroids approaching Earth',
    href: '/asteroids',
    subtitle: 'Live NASA NeoWs close approaches',
    terms: ['asteroids', 'asteroid', 'near earth', 'neo', 'approaching', 'approaching earth', 'hazardous'],
  },
  { title: 'NASA Gallery', href: '/gallery', subtitle: 'NASA Image Library and APOD', terms: ['gallery', 'images', 'photos', 'apod', 'picture of the day'] },
];

export function buildLocalIndex(): IndexEntry[] {
  const entries: IndexEntry[] = [];
  for (const b of SOLAR_SYSTEM) {
    const parent = b.parent ? SOLAR_SYSTEM.find((p) => p.id === b.parent) : undefined;
    const category: SearchCategory = b.kind === 'moon' ? 'Moons' : 'Solar System';
    const terms = [b.name, b.id];
    if (parent) terms.push(`${parent.name} moon`, `${parent.name} moons`, parent.name);
    if (b.moons) terms.push(`${b.name} moons`, ...b.moons.notable);
    entries.push({
      id: `body:${b.id}`,
      title: b.name,
      subtitle: parent ? `Moon of ${parent.name}` : b.tagline,
      category,
      href: `/planets/${b.id}`,
      terms: terms.map((t) => t.toLowerCase()),
    });
  }
  for (const g of GALAXIES) {
    entries.push({
      id: `galaxy:${g.id}`,
      title: g.name,
      subtitle: `${g.identifiers.join(' · ')} — ${g.classification}`,
      category: 'Galaxies',
      href: `/galaxies/${g.id}`,
      terms: [g.name, ...g.identifiers, g.constellation].map((t) => t.toLowerCase()),
    });
  }
  for (const s of STARS) {
    entries.push({
      id: `star:${s.id}`,
      title: s.name,
      subtitle: `${s.spectralType} · ${s.constellation}`,
      category: 'Stars',
      href: `/stars/${s.id}`,
      terms: [s.name, s.designation, s.constellation].map((t) => t.toLowerCase()),
    });
  }
  for (const h of BLACK_HOLES) {
    entries.push({
      id: `bh:${h.id}`,
      title: h.name,
      subtitle: `${h.type} black hole · ${h.host}`,
      category: 'Black Holes',
      href: `/black-holes#${h.id}`,
      terms: [h.name, h.name.replace('*', ' star'), h.host, 'black hole'].map((t) => t.toLowerCase()),
    });
  }
  for (const s of SECTIONS) {
    entries.push({ id: `section:${s.href}`, title: s.title, subtitle: s.subtitle, category: 'Sections', href: s.href, terms: s.terms });
  }
  return entries;
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Scores how well a query matches an entry (0 = no match). Exact > prefix > word-prefix > substring > all-words. */
export function scoreEntry(entry: IndexEntry, query: string): number {
  const q = normalize(query);
  if (!q) return 0;
  let best = 0;
  const title = normalize(entry.title);
  const candidates = [title, ...entry.terms.map(normalize)];
  for (const t of candidates) {
    let s = 0;
    if (t === q) s = 100;
    else if (t.startsWith(q)) s = 80;
    else if (t.split(/[\s\-()]+/).some((w) => w.startsWith(q))) s = 60;
    else if (t.includes(q)) s = 40;
    if (s > 0 && t === title) s += 5; // prefer title hits over keyword hits
    best = Math.max(best, s);
  }
  if (best === 0) {
    const words = q.split(' ').filter(Boolean);
    if (words.length > 1 && words.every((w) => candidates.some((c) => c.includes(w)))) best = 30;
  }
  return best;
}

export function searchLocal(index: IndexEntry[], query: string, limit = 8): SearchResult[] {
  return index
    .map((e) => ({ e, s: scoreEntry(e, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.e.title.localeCompare(b.e.title))
    .slice(0, limit)
    .map(({ e }) => ({ id: e.id, title: e.title, subtitle: e.subtitle, category: e.category, href: e.href }));
}

/**
 * Groups results by category for display while preserving relevance: categories appear in the
 * order of their best-ranked local result, and remote (live) categories follow.
 */
export function groupResults(local: SearchResult[], remote: SearchResult[]): SearchResult[] {
  const order: SearchCategory[] = [];
  for (const r of [...local, ...remote]) if (!order.includes(r.category)) order.push(r.category);
  const all = [...local, ...remote];
  return order.flatMap((c) => all.filter((r) => r.category === c));
}

// ---------- Recent searches (opt-in local storage) ----------

const CONSENT_KEY = 'cosmos.recentSearches.consent';
const RECENT_KEY = 'cosmos.recentSearches';
const MAX_RECENT = 6;

function safeStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function hasRecentConsent(): boolean {
  try {
    return safeStorage()?.getItem(CONSENT_KEY) === 'yes';
  } catch {
    return false;
  }
}

export function setRecentConsent(on: boolean): void {
  const s = safeStorage();
  try {
    if (!s) return;
    if (on) s.setItem(CONSENT_KEY, 'yes');
    else {
      s.removeItem(CONSENT_KEY);
      s.removeItem(RECENT_KEY);
    }
  } catch {
    /* storage unavailable — ignore */
  }
}

export function getRecentSearches(): string[] {
  if (!hasRecentConsent()) return [];
  try {
    const raw = safeStorage()?.getItem(RECENT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(term: string): string[] {
  const t = term.trim();
  if (!t || !hasRecentConsent()) return getRecentSearches();
  const next = [t, ...getRecentSearches().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT);
  try {
    safeStorage()?.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
