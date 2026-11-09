// Curated set of scientifically documented black holes. Masses and distances are rounded
// values from the cited sources and carry real measurement uncertainty.

import type { BlackHoleEntry } from '@/types';

export const BLACK_HOLES: BlackHoleEntry[] = [
  {
    id: 'sgr-a-star',
    name: 'Sagittarius A*',
    type: 'Supermassive',
    mass: '~4 million M☉',
    distance: '~27,000 ly',
    host: 'Centre of the Milky Way',
    summary:
      'The supermassive black hole at the heart of our galaxy. Its mass was pinned down by decades of tracking stars orbiting it at thousands of kilometres per second.',
    highlights: [
      'The 2020 Nobel Prize in Physics recognised the discovery of a supermassive compact object at the galactic centre.',
      'In May 2022 the Event Horizon Telescope collaboration released the first image of its shadow.',
      'In 2024 the EHT published a polarized-light image revealing organised magnetic fields near its edge.',
    ],
    imaged: true,
    imageQuery: 'Sagittarius A* black hole',
    sources: [
      { label: 'NASA Science — Black holes', url: 'https://science.nasa.gov/universe/black-holes/' },
      { label: 'NASA Science — The Milky Way', url: 'https://science.nasa.gov/milky-way/' },
      { label: 'Event Horizon Telescope', url: 'https://eventhorizontelescope.org/' },
    ],
  },
  {
    id: 'm87-star',
    name: 'M87*',
    type: 'Supermassive',
    mass: '~6.5 billion M☉',
    distance: '~55 million ly',
    host: 'Galaxy Messier 87',
    summary:
      'The first black hole ever imaged. Its glowing ring of hot gas surrounding a dark shadow matched predictions from Einstein’s general relativity.',
    highlights: [
      'Image released by the Event Horizon Telescope in April 2019.',
      'It powers a relativistic jet extending thousands of light-years from the galaxy’s core.',
    ],
    imaged: true,
    imageQuery: 'M87 black hole Event Horizon Telescope',
    sources: [
      { label: 'NASA — M87 black hole', url: 'https://science.nasa.gov/universe/black-holes/' },
      { label: 'Event Horizon Telescope', url: 'https://eventhorizontelescope.org/' },
    ],
  },
  {
    id: 'cygnus-x-1',
    name: 'Cygnus X-1',
    type: 'Stellar-mass (X-ray binary)',
    mass: '~21 M☉',
    distance: '~7,200 ly',
    host: 'Binary system with a blue supergiant, in Cygnus',
    summary:
      'One of the brightest X-ray sources in the sky and the first object widely accepted as a black hole. Material pulled from its companion star heats up to millions of degrees.',
    highlights: [
      'Discovered as an X-ray source in 1964.',
      'Famously the subject of a 1974 bet between Stephen Hawking and Kip Thorne (Hawking conceded in 1990).',
      'A 2021 study revised its mass upward to about 21 solar masses.',
    ],
    imaged: false,
    imageQuery: 'Cygnus X-1',
    sources: [{ label: 'NASA Chandra — Cygnus X-1', url: 'https://chandra.harvard.edu/photo/2011/cygx1/' }],
  },
  {
    id: 'gaia-bh1',
    name: 'Gaia BH1',
    type: 'Stellar-mass (dormant)',
    mass: '~9.6 M☉',
    distance: '~1,560 ly',
    host: 'Binary with a Sun-like star, in Ophiuchus',
    summary:
      'The nearest known black hole to Earth (as of its 2022 discovery). It is “dormant” — not accreting — and was found only from the wobble it induces in its companion star.',
    highlights: ['Identified using astrometry from ESA’s Gaia mission and follow-up spectroscopy.'],
    imaged: false,
    imageQuery: 'Gaia black hole',
    sources: [{ label: 'NOIRLab — Gaia BH1', url: 'https://noirlab.edu/public/news/noirlab2304/' }],
  },
];

export const BLACK_HOLE_CONCEPTS: { id: string; title: string; body: string }[] = [
  {
    id: 'what',
    title: 'What is a black hole?',
    body:
      'A region of spacetime where gravity is so strong that nothing — not even light — can escape once inside. Stellar-mass black holes form when massive stars collapse; supermassive black holes, millions to billions of times the Sun’s mass, sit at the centres of most large galaxies.',
  },
  {
    id: 'horizon',
    title: 'Event horizon',
    body:
      'The boundary beyond which escape is impossible. For a non-rotating black hole its radius (the Schwarzschild radius) is about 3 km per solar mass. The EHT images show the shadow cast by this region, which appears roughly 2.5 times larger than the horizon itself because of light bending.',
  },
  {
    id: 'disk',
    title: 'Accretion disk',
    body:
      'Gas spiralling inward heats up through friction and magnetic turbulence, glowing brightly across the spectrum — often in X-rays. Accretion can launch jets of particles at nearly the speed of light.',
  },
  {
    id: 'lensing',
    title: 'Gravitational lensing',
    body:
      'Mass curves spacetime, bending the path of light. Near a black hole, light from the far side of the disk is bent over and under the hole, producing the arching halo familiar from visualizations — and the ring seen in EHT images.',
  },
  {
    id: 'smbh',
    title: 'Supermassive black holes',
    body:
      'Their masses correlate with the properties of their host galaxies, suggesting galaxies and black holes grow together. JWST has found surprisingly massive black holes less than a billion years after the Big Bang.',
  },
  {
    id: 'unknowns',
    title: 'Open questions',
    body:
      'How supermassive black holes grew so large so early, what happens to information that falls in (the information paradox), and what replaces the singularity predicted by general relativity are all unresolved. A theory of quantum gravity is likely required.',
  },
];
