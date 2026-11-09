// Fixtures trimmed from real responses captured from the live services on 2026-10-25,
// so parsers are tested against the documented/observed schemas rather than invented shapes.

import type { ApodResponse, ExoplanetRow, NasaImageSearchRaw, NeoFeedResponse, NeoRaw } from '@/types';

export const NEO_RAW: NeoRaw = {
  absolute_magnitude_h: 20.61,
  close_approach_data: [
    {
      close_approach_date: '2026-10-26',
      close_approach_date_full: '2026-Oct-26 04:00',
      epoch_date_close_approach: 1792987200000,
      miss_distance: { astronomical: '0.4440255654', kilometers: '66425278.809385698', lunar: '172.7259449406' },
      orbiting_body: 'Earth',
      relative_velocity: { kilometers_per_hour: '67073.2296998069', kilometers_per_second: '18.6314526944' },
    },
  ],
  estimated_diameter: { meters: { estimated_diameter_max: 448.7867008808, estimated_diameter_min: 200.7035141135 } },
  id: '2488509',
  is_potentially_hazardous_asteroid: false,
  is_sentry_object: false,
  name: '488509 (2000 UW13)',
  nasa_jpl_url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=2488509',
  neo_reference_id: '2488509',
};

export function neoFeed(): NeoFeedResponse {
  const later: NeoRaw = {
    ...NEO_RAW,
    id: '3',
    name: '(2026 AB)',
    is_potentially_hazardous_asteroid: true,
    close_approach_data: [{ ...NEO_RAW.close_approach_data[0]!, close_approach_date: '2026-10-27', epoch_date_close_approach: 1793073600000 }],
  };
  const noApproach: NeoRaw = { ...NEO_RAW, id: '9', close_approach_data: [] };
  return { element_count: 3, near_earth_objects: { '2026-10-27': [later], '2026-10-26': [NEO_RAW, noApproach] } };
}

export const EXO_ROWS: ExoplanetRow[] = [
  {
    pl_name: '55 Cnc c',
    hostname: '55 Cnc',
    discoverymethod: 'Radial Velocity',
    disc_year: 2004,
    pl_rade: 8.51,
    pl_bmasse: 54.4738,
    pl_orbper: 44.3936,
    sy_dist: 12.5855,
    pl_eqt: 499.27,
    disc_facility: 'McDonald Observatory',
  },
  {
    pl_name: "O'Hara b",
    hostname: null,
    discoverymethod: 'Transit',
    disc_year: 2004,
    pl_rade: null,
    pl_bmasse: null,
    pl_orbper: null,
    sy_dist: null,
    pl_eqt: null,
    disc_facility: null,
  },
];

export const IMAGES_RAW: NasaImageSearchRaw = {
  collection: {
    items: [
      {
        href: 'https://images-assets.nasa.gov/image/PIA20970/collection.json',
        data: [
          {
            center: 'JPL',
            date_created: '2017-03-23T15:50:41Z',
            description: "NASA's Nuclear Spectroscope Telescope Array, or NuSTAR, has identified a candidate pulsar in Andromeda.",
            description_508: 'NASA NuSTAR has identified a candidate pulsar in Andromeda.',
            keywords: ['Galaxy Evolution Explorer GALEX,NuSTAR', 'Andromeda galaxy'],
            media_type: 'image',
            nasa_id: 'PIA20970',
            secondary_creator: 'NASA/JPL-Caltech/GSFC/JHU',
            title: 'Pulsar Candidate in Andromeda',
          },
        ],
        links: [
          { href: 'http://images-assets.nasa.gov/image/PIA20970/PIA20970~small.jpg', rel: 'alternate', render: 'image', width: 640, height: 360 },
          { href: 'https://images-assets.nasa.gov/image/PIA20970/PIA20970~thumb.jpg', rel: 'preview', render: 'image', width: 640, height: 360 },
        ],
      },
      { href: 'x', data: [] },
    ],
    metadata: { total_hits: 43 },
    links: [{ rel: 'next', prompt: 'Next', href: 'https://images-api.nasa.gov/search?q=andromeda&page=2' }],
  },
};

export const APOD_IMAGE: ApodResponse = {
  date: '2026-10-25',
  title: 'Rosetta Selfie',
  explanation: 'This Rosetta spacecraft selfie was snapped on October 7th, 2014.',
  media_type: 'image',
  url: 'https://apod.nasa.gov/apod/image/rosetta_small.jpg',
  hdurl: 'https://apod.nasa.gov/apod/image/rosetta.jpg',
  service_version: 'v1',
};

/** Builds a minimal fetch Response. */
export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}
