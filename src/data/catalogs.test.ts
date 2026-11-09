// Integrity checks for the curated catalogs: completeness, valid links and internal consistency.
import { describe, expect, it } from 'vitest';
import { BLACK_HOLES } from './blackHoles';
import { GALAXIES } from './galaxyCatalog';
import { PLANET_IDS, SOLAR_SYSTEM } from './solarSystem';
import { starColor, STARS } from './starCatalog';
import { getBody, getMoonsOf, getPlanets } from '@/services/nasa/planetaryData';
import { getGalaxy } from '@/services/nasa/galaxies';
import { getStar } from '@/services/nasa/stars';

const allSources = [...SOLAR_SYSTEM, ...GALAXIES, ...STARS, ...BLACK_HOLES].flatMap((x) => x.sources);

describe('solar system catalog', () => {
  it('contains exactly the eight IAU planets in order from the Sun', () => {
    expect(getPlanets().map((p) => p.name)).toEqual(['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']);
    expect(PLANET_IDS).toHaveLength(8);
  });

  it('includes the Sun and the requested moons with valid parents', () => {
    expect(getBody('sun')?.kind).toBe('star');
    for (const id of ['moon', 'europa', 'titan', 'enceladus']) {
      const m = getBody(id)!;
      expect(m.kind).toBe('moon');
      expect(getBody(m.parent)).toBeDefined();
    }
    expect(getMoonsOf('saturn').map((m) => m.id).sort()).toEqual(['enceladus', 'titan']);
  });

  it('has required fields for every planet, including moon counts with source and date', () => {
    for (const p of getPlanets()) {
      expect(p.physical.diameterKm).toBeGreaterThan(0);
      expect(p.physical.massKg).toBeGreaterThan(0);
      expect(p.orbit.meanDistanceKm).toBeGreaterThan(0);
      expect(p.orbit.orbitalPeriodDays).toBeGreaterThan(0);
      expect(p.orbit.rotationPeriod).toBeTruthy();
      expect(p.temperature).toBeTruthy();
      expect(p.atmosphere.composition.length).toBeGreaterThan(0);
      expect(p.moons?.countSource).toBeTruthy();
      expect(p.moons?.countAsOf).toBeTruthy();
      expect(p.missions.length).toBeGreaterThan(0);
      expect(p.sources.some((s) => s.url.includes('nasa.gov'))).toBe(true);
    }
  });

  it('orders orbital distances and periods consistently (Kepler: farther = slower)', () => {
    const planets = getPlanets();
    for (let i = 1; i < planets.length; i++) {
      expect(planets[i]!.orbit.meanDistanceKm!).toBeGreaterThan(planets[i - 1]!.orbit.meanDistanceKm!);
      expect(planets[i]!.orbit.orbitalPeriodDays!).toBeGreaterThan(planets[i - 1]!.orbit.orbitalPeriodDays!);
      expect(planets[i]!.visual.sceneOrbit).toBeGreaterThan(planets[i - 1]!.visual.sceneOrbit);
    }
  });

  it('matches key NASA fact-sheet values', () => {
    expect(getBody('earth')!.physical.diameterKm).toBe(12_756);
    expect(getBody('jupiter')!.physical.diameterKm).toBe(142_984);
    expect(getBody('mars')!.orbit.orbitalPeriodDays).toBe(687);
  });

  it('has unique ids', () => {
    expect(new Set(SOLAR_SYSTEM.map((b) => b.id)).size).toBe(SOLAR_SYSTEM.length);
  });
});

describe('galaxies, stars and black holes', () => {
  it('includes every galaxy requested in the brief', () => {
    for (const id of ['milky-way', 'andromeda', 'triangulum', 'whirlpool', 'sombrero', 'lmc', 'smc', 'm87']) expect(getGalaxy(id)).toBeDefined();
  });

  it('includes every star requested in the brief', () => {
    for (const id of ['sun', 'sirius', 'proxima-centauri', 'alpha-centauri-a', 'alpha-centauri-b', 'betelgeuse', 'rigel', 'vega', 'polaris']) expect(getStar(id)).toBeDefined();
  });

  it('documents Sagittarius A* and M87* as imaged', () => {
    expect(BLACK_HOLES.filter((b) => b.imaged).map((b) => b.id)).toEqual(['sgr-a-star', 'm87-star']);
  });

  it('maps stellar temperature to a plausible colour ramp', () => {
    expect(starColor(3000)).toBe('#ff9a5a');
    expect(starColor(5772)).toBe('#ffe2a8');
    expect(starColor(12000)).toBe('#a9c8ff');
  });
});

describe('source links', () => {
  it('are all absolute https URLs', () => {
    expect(allSources.length).toBeGreaterThan(20);
    for (const s of allSources) {
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.label.length).toBeGreaterThan(3);
    }
  });
});
