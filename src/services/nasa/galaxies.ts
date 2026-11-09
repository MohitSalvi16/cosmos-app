// Access layer for the curated galaxy catalog. Imagery is enriched live from the NASA Image Library.
import { GALAXIES } from '@/data/galaxyCatalog';
import type { Galaxy } from '@/types';

export function getGalaxies(): Galaxy[] {
  return GALAXIES;
}

export function getGalaxy(id: string | undefined): Galaxy | undefined {
  return GALAXIES.find((g) => g.id === id);
}
