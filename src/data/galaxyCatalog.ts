// Curated galaxy catalog — a hand-picked selection, NOT a complete catalog of known galaxies.
// Values are rounded figures from NASA Science, NASA/IPAC Extragalactic Database (NED) and
// SIMBAD. Distances and diameters of galaxies are estimates with real uncertainty, and published
// values vary between methods; the UI marks them as approximate.

import type { Galaxy } from '@/types';

const NED = (name: string) => `https://ned.ipac.caltech.edu/byname?objname=${encodeURIComponent(name)}`;
const SIMBAD = (name: string) => `https://simbad.cds.unistra.fr/simbad/sim-id?Ident=${encodeURIComponent(name)}`;

export const GALAXIES: Galaxy[] = [
  {
    id: 'milky-way',
    name: 'Milky Way',
    identifiers: ['The Galaxy'],
    classification: 'Barred spiral (SBbc)',
    distance: 'We live inside it — the Sun is ~26,000 ly from the centre',
    diameter: '~100,000 ly across the stellar disk (estimates vary up to ~200,000 ly)',
    constellation: 'Centre lies toward Sagittarius',
    summary:
      'Our home galaxy contains an estimated 100–400 billion stars arranged in a barred spiral disk. At its centre sits Sagittarius A*, a supermassive black hole about four million times the Sun’s mass.',
    discoveries: [
      'Galileo resolved the Milky Way’s glow into countless individual stars in 1610.',
      'Decades of stellar-orbit tracking near Sagittarius A* (Nobel Prize in Physics, 2020) proved a compact supermassive object.',
      'ESA’s Gaia mission has measured positions and motions for more than a billion stars.',
    ],
    uncertainty: 'Because we observe from inside the disk, the Milky Way’s exact size, arm structure and star count are hard to measure.',
    imageQuery: 'Milky Way galaxy center',
    visual: { arms: 4, core: '#ffd9a0', outer: '#7aa8ff', type: 'barred' },
    sources: [
      { label: 'NASA Science — Milky Way', url: 'https://science.nasa.gov/resource/the-milky-way-galaxy/' },
      { label: 'NASA Science — Galaxies', url: 'https://science.nasa.gov/universe/galaxies/' },
    ],
  },
  {
    id: 'andromeda',
    name: 'Andromeda Galaxy',
    identifiers: ['M31', 'NGC 224'],
    classification: 'Spiral (SA(s)b)',
    distance: '~2.5 million ly',
    diameter: '~150,000 ly or more (halo far larger)',
    constellation: 'Andromeda',
    summary:
      'The nearest large spiral galaxy and the most distant object easily visible to the naked eye. Andromeda and the Milky Way are approaching each other and may merge in several billion years.',
    discoveries: [
      'In 1925 Edwin Hubble measured Cepheid variable stars in Andromeda, proving it lies far beyond the Milky Way.',
      'Hubble Space Telescope mosaics (PHAT) resolved over 100 million of its stars.',
    ],
    uncertainty: 'Recent studies suggest a Milky Way–Andromeda merger is less certain than once thought; estimates of its likelihood vary.',
    imageQuery: 'Andromeda galaxy M31',
    visual: { arms: 2, core: '#ffe2b5', outer: '#9bb8ff', type: 'spiral' },
    sources: [
      { label: 'NASA — Messier 31', url: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-31/' },
      { label: 'NED — M31', url: NED('M31') },
      { label: 'SIMBAD — M31', url: SIMBAD('M31') },
    ],
  },
  {
    id: 'triangulum',
    name: 'Triangulum Galaxy',
    identifiers: ['M33', 'NGC 598'],
    classification: 'Spiral (SA(s)cd)',
    distance: '~2.7–3 million ly',
    diameter: '~60,000 ly',
    constellation: 'Triangulum',
    summary:
      'The third-largest member of the Local Group, after Andromeda and the Milky Way. Its loosely wound arms are rich in star-forming regions such as the giant nebula NGC 604.',
    discoveries: ['Hubble’s largest-ever mosaic of M33 (2019) captured nearly 25 million individually resolved stars.'],
    imageQuery: 'Triangulum galaxy M33',
    visual: { arms: 3, core: '#ffe6c0', outer: '#8fc3ff', type: 'spiral' },
    sources: [
      { label: 'NASA — Messier 33', url: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-33/' },
      { label: 'NED — M33', url: NED('M33') },
    ],
  },
  {
    id: 'whirlpool',
    name: 'Whirlpool Galaxy',
    identifiers: ['M51a', 'NGC 5194'],
    classification: 'Grand-design spiral (SA(s)bc pec)',
    distance: '~31 million ly (estimates range ~23–31 million ly)',
    diameter: '~76,000 ly',
    constellation: 'Canes Venatici',
    summary:
      'A classic face-on spiral interacting with its smaller companion NGC 5195. The gravitational tug of the encounter is thought to sharpen the Whirlpool’s spiral arms and trigger star formation.',
    discoveries: [
      'In 1845 Lord Rosse sketched its spiral structure — the first galaxy recognised as a spiral.',
      'Chandra X-ray observations revealed hundreds of X-ray sources, including black-hole candidates.',
    ],
    imageQuery: 'Whirlpool galaxy M51',
    visual: { arms: 2, core: '#ffdcae', outer: '#a1b6ff', type: 'spiral' },
    sources: [
      { label: 'NASA — Messier 51', url: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-51/' },
      { label: 'NED — M51', url: NED('M51') },
    ],
  },
  {
    id: 'sombrero',
    name: 'Sombrero Galaxy',
    identifiers: ['M104', 'NGC 4594'],
    classification: 'Spiral / lenticular (SA(s)a)',
    distance: '~28–31 million ly',
    diameter: '~50,000 ly',
    constellation: 'Virgo',
    summary:
      'Seen nearly edge-on, the Sombrero has a brilliant central bulge and a prominent dust lane. Its centre hosts a supermassive black hole estimated at about a billion solar masses.',
    discoveries: ['JWST’s mid-infrared view (2024) showed the dust ring as clumpy, with the bulge almost invisible.'],
    imageQuery: 'Sombrero galaxy M104',
    visual: { arms: 1, core: '#fff0d0', outer: '#c2b3a0', type: 'lenticular' },
    sources: [
      { label: 'NASA — Messier 104', url: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-104/' },
      { label: 'NED — M104', url: NED('M104') },
    ],
  },
  {
    id: 'lmc',
    name: 'Large Magellanic Cloud',
    identifiers: ['LMC'],
    classification: 'Barred Magellanic spiral / irregular (SB(s)m)',
    distance: '~160,000 ly',
    diameter: '~14,000 ly (estimates vary)',
    constellation: 'Dorado and Mensa',
    summary:
      'A satellite galaxy of the Milky Way, visible from the Southern Hemisphere. It hosts the Tarantula Nebula, the most active star-forming region in the Local Group.',
    discoveries: ['Supernova 1987A in the LMC was the closest observed supernova since the invention of the telescope.'],
    imageQuery: 'Large Magellanic Cloud',
    visual: { arms: 1, core: '#ffe0c8', outer: '#b49cff', type: 'irregular' },
    sources: [
      { label: 'NASA Science — Galaxies', url: 'https://science.nasa.gov/universe/galaxies/' },
      { label: 'NED — LMC', url: NED('LMC') },
    ],
  },
  {
    id: 'smc',
    name: 'Small Magellanic Cloud',
    identifiers: ['SMC', 'NGC 292'],
    classification: 'Dwarf irregular (SB(s)m pec)',
    distance: '~200,000 ly',
    diameter: '~7,000 ly',
    constellation: 'Tucana',
    summary:
      'A dwarf galaxy orbiting the Milky Way. Its low abundance of heavy elements makes it a laboratory for how stars formed in the early universe.',
    discoveries: ['Henrietta Swan Leavitt’s study of Cepheids in the SMC (1912) produced the period–luminosity relation used to measure cosmic distances.'],
    imageQuery: 'Small Magellanic Cloud',
    visual: { arms: 0, core: '#ffe9d0', outer: '#9fc8ff', type: 'irregular' },
    sources: [
      { label: 'NED — SMC', url: NED('SMC') },
      { label: 'SIMBAD — SMC', url: SIMBAD('SMC') },
    ],
  },
  {
    id: 'm87',
    name: 'Messier 87',
    identifiers: ['M87', 'NGC 4486', 'Virgo A'],
    classification: 'Giant elliptical (E0–E1, cD)',
    distance: '~53–55 million ly',
    diameter: '~120,000 ly or more (extended halo far larger)',
    constellation: 'Virgo',
    summary:
      'One of the most massive galaxies in the nearby universe, at the heart of the Virgo Cluster. A relativistic jet thousands of light-years long blasts from its central black hole, M87*.',
    discoveries: [
      'In 2019 the Event Horizon Telescope released the first image of a black hole’s shadow, M87*.',
      'Hubble has tracked apparent superluminal motion in its jet.',
    ],
    imageQuery: 'M87 galaxy jet',
    visual: { arms: 0, core: '#fff1d8', outer: '#e0c7a0', type: 'elliptical' },
    sources: [
      { label: 'NASA — Messier 87', url: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-87/' },
      { label: 'NED — M87', url: NED('M87') },
    ],
  },
];
