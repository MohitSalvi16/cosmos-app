// Access layer for the curated Solar System catalog (static data, labelled "curated" in the UI).
// There is no single live NASA endpoint that serves these fact-sheet values in a structured form,
// so we ship a documented local catalog with source links instead of pretending it is live.

import { PLANET_IDS, SOLAR_SYSTEM } from '@/data/solarSystem';
import type { CelestialBody } from '@/types';

const byId = new Map(SOLAR_SYSTEM.map((b) => [b.id, b]));

export function getBody(id: string | undefined): CelestialBody | undefined {
  return id ? byId.get(id.toLowerCase()) : undefined;
}

export function getPlanets(): CelestialBody[] {
  return PLANET_IDS.map((id) => byId.get(id)).filter((b): b is CelestialBody => Boolean(b));
}

export function getMoonsOf(parentId: string): CelestialBody[] {
  return SOLAR_SYSTEM.filter((b) => b.kind === 'moon' && b.parent === parentId);
}

export function getAllBodies(): CelestialBody[] {
  return SOLAR_SYSTEM;
}

export function bodyHref(body: Pick<CelestialBody, 'id'>): string {
  return `/planets/${body.id}`;
}
