// Access layer for the curated star catalog.
import { STARS } from '@/data/starCatalog';
import type { StarEntry } from '@/types';

export function getStars(): StarEntry[] {
  return STARS;
}

export function getStar(id: string | undefined): StarEntry | undefined {
  return STARS.find((s) => s.id === id);
}
