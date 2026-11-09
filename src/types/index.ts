// ---------- Shared ----------

export interface SourceLink {
  label: string;
  url: string;
}

/** Where a piece of data came from, so the UI never labels static data as live. */
export type DataProvenance = 'live' | 'curated';

export interface FetchMeta {
  /** ISO timestamp the upstream data was fetched (from the proxy, or the client clock for direct calls). */
  fetchedAt: string;
  /** Proxy cache status: HIT | MISS | STALE | CLIENT (served from the in-browser cache) | DIRECT */
  cache: string;
  source: string;
}

export interface Fetched<T> {
  data: T;
  meta: FetchMeta;
}

// ---------- Solar system (curated) ----------

export type BodyKind = 'star' | 'planet' | 'moon';

export type SurfaceStyle =
  | 'sun'
  | 'rocky'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'gas'
  | 'ice-giant'
  | 'moon'
  | 'icy-moon'
  | 'titan'
  | 'europa';

export interface BodyVisual {
  style: SurfaceStyle;
  /** Three base colours for the procedural shader: deep / mid / highlight. */
  palette: [string, string, string];
  atmosphere?: string;
  clouds?: boolean;
  rings?: { inner: number; outer: number; color: string; opacity: number };
  /** Axial tilt in degrees (real value, used for orientation). */
  tiltDeg: number;
  /** Visual-only radius used in the compressed explorer scene. */
  sceneRadius: number;
  /** Visual-only orbit radius in the compressed explorer scene. */
  sceneOrbit: number;
}

export interface Mission {
  name: string;
  years: string;
  agency: string;
  note: string;
}

export interface CelestialBody {
  id: string;
  name: string;
  kind: BodyKind;
  /** id of the body this one orbits (moons). */
  parent?: string;
  tagline: string;
  overview: string;
  physical: {
    diameterKm: number;
    /** Human-readable mass, e.g. "5.97 × 10²⁴ kg". */
    mass: string;
    massKg: number;
    gravity?: string;
    density?: string;
  };
  orbit: {
    /** Mean distance from the Sun (planets) or from the parent body (moons), human readable. */
    meanDistance: string;
    meanDistanceKm?: number;
    orbitalPeriod: string;
    orbitalPeriodDays?: number;
    rotationPeriod: string;
    eccentricity?: string;
  };
  temperature: string;
  atmosphere: {
    summary: string;
    composition: { gas: string; share: string }[];
  };
  moons?: {
    count: number | null;
    /** e.g. "NASA Solar System Exploration, accessed 2025" */
    countSource: string;
    countAsOf: string;
    notable: string[];
  };
  missions: Mission[];
  discoveries: string[];
  uncertainties?: string[];
  visual: BodyVisual;
  imageQuery: string;
  sources: SourceLink[];
}

// ---------- Galaxies / stars / black holes (curated) ----------

export interface Galaxy {
  id: string;
  name: string;
  identifiers: string[];
  classification: string;
  distance: string;
  diameter: string;
  constellation: string;
  summary: string;
  discoveries: string[];
  uncertainty?: string;
  imageQuery: string;
  visual: { arms: number; core: string; outer: string; type: 'spiral' | 'barred' | 'elliptical' | 'irregular' | 'lenticular' };
  sources: SourceLink[];
}

export interface StarEntry {
  id: string;
  name: string;
  designation: string;
  spectralType: string;
  distance: string;
  mass: string;
  radius: string;
  luminosity: string;
  temperature: string;
  temperatureK: number;
  constellation: string;
  planets: string;
  summary: string;
  estimates: string[];
  imageQuery: string;
  sources: SourceLink[];
}

export interface BlackHoleEntry {
  id: string;
  name: string;
  type: string;
  mass: string;
  distance: string;
  host: string;
  summary: string;
  highlights: string[];
  imaged: boolean;
  imageQuery: string;
  sources: SourceLink[];
}

// ---------- Exoplanets (live: NASA Exoplanet Archive pscomppars) ----------

/** Raw row as returned by TAP sync (format=json). Every field may be null. */
export interface ExoplanetRow {
  pl_name: string;
  hostname: string | null;
  discoverymethod: string | null;
  disc_year: number | null;
  pl_rade: number | null;
  pl_bmasse: number | null;
  pl_orbper: number | null;
  sy_dist: number | null;
  pl_eqt: number | null;
  disc_facility: string | null;
}

export interface ExoplanetDetailRow extends ExoplanetRow {
  sy_snum: number | null;
  sy_pnum: number | null;
  disc_telescope: string | null;
  pl_orbsmax: number | null;
  pl_radj: number | null;
  pl_bmassj: number | null;
  pl_bmassprov: string | null;
  pl_orbeccen: number | null;
  pl_insol: number | null;
  st_spectype: string | null;
  st_teff: number | null;
  st_rad: number | null;
  st_mass: number | null;
  ra: number | null;
  dec: number | null;
  rastr: string | null;
  decstr: string | null;
}

export type ExoplanetSort =
  | 'disc_year_desc'
  | 'disc_year_asc'
  | 'distance_asc'
  | 'distance_desc'
  | 'period_asc'
  | 'period_desc'
  | 'name_asc';

export interface ExoplanetFilters {
  name?: string;
  method?: string;
  yearMin?: number;
  yearMax?: number;
  /** Maximum distance from Earth in parsecs. */
  maxDistancePc?: number;
}

/** Keyset cursor: the sort-column value and name of the last row on the previous page. */
export interface ExoplanetCursor {
  value: number | string;
  name: string;
}

// ---------- Near-Earth objects (live: NASA NeoWs) ----------

export interface NeoFeedResponse {
  element_count: number;
  near_earth_objects: Record<string, NeoRaw[]>;
}

export interface NeoRaw {
  id: string;
  neo_reference_id: string;
  name: string;
  nasa_jpl_url: string;
  absolute_magnitude_h: number;
  is_potentially_hazardous_asteroid: boolean;
  is_sentry_object: boolean;
  estimated_diameter: {
    meters: { estimated_diameter_min: number; estimated_diameter_max: number };
  };
  close_approach_data: {
    close_approach_date: string;
    close_approach_date_full: string | null;
    epoch_date_close_approach: number;
    relative_velocity: { kilometers_per_second: string; kilometers_per_hour: string };
    miss_distance: { astronomical: string; lunar: string; kilometers: string };
    orbiting_body: string;
  }[];
}

export interface NeoApproach {
  id: string;
  name: string;
  jplUrl: string;
  absoluteMagnitude: number;
  hazardous: boolean;
  sentry: boolean;
  diameterMinM: number;
  diameterMaxM: number;
  approachDate: string;
  approachDateFull: string | null;
  epochMs: number;
  velocityKmS: number;
  missKm: number;
  missLunar: number;
  missAu: number;
  orbitingBody: string;
}

// ---------- APOD (live) ----------

export interface ApodResponse {
  date: string;
  title: string;
  explanation: string;
  media_type: 'image' | 'video' | 'other' | string;
  url?: string;
  hdurl?: string;
  thumbnail_url?: string;
  copyright?: string;
  service_version?: string;
}

// ---------- NASA Image and Video Library (live) ----------

export type NasaMediaType = 'image' | 'video' | 'audio';

export interface NasaImageSearchRaw {
  collection: {
    items: {
      href: string;
      data?: {
        nasa_id: string;
        title?: string;
        description?: string;
        description_508?: string;
        date_created?: string;
        center?: string;
        photographer?: string;
        secondary_creator?: string;
        keywords?: string[];
        media_type: NasaMediaType;
      }[];
      links?: { href: string; rel: string; render?: string; width?: number; height?: number }[];
    }[];
    metadata?: { total_hits?: number };
    links?: { rel: string; prompt?: string; href: string }[];
  };
}

export interface NasaMediaItem {
  nasaId: string;
  title: string;
  description: string | null;
  dateCreated: string | null;
  center: string | null;
  credit: string | null;
  keywords: string[];
  mediaType: NasaMediaType;
  thumbnail: string | null;
  /** Medium-size preview for the lightbox (falls back to the thumbnail). */
  preview: string | null;
  detailsUrl: string;
  manifestUrl: string;
}

export interface NasaImageSearchResult {
  items: NasaMediaItem[];
  totalHits: number;
  hasNext: boolean;
}

// ---------- Search ----------

export type SearchCategory =
  | 'Solar System'
  | 'Moons'
  | 'Galaxies'
  | 'Stars'
  | 'Black Holes'
  | 'Sections'
  | 'Exoplanets'
  | 'NASA Images';

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: SearchCategory;
  href: string;
  /** true for results returned by a remote, live dataset. */
  remote?: boolean;
  external?: boolean;
}
