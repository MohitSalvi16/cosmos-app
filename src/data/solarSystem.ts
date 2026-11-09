// Curated Solar System catalog.
//
// Physical and orbital values follow the NASA Space Science Data Coordinated Archive (NSSDCA)
// Planetary Fact Sheets (https://nssdc.gsfc.nasa.gov/planetary/factsheet/) and NASA Science
// overview pages. Moon counts change as new moons are confirmed — each count carries its source
// and an "as of" date. This file is static, curated data; the UI labels it as such.
//
// `visual.sceneRadius` and `visual.sceneOrbit` are deliberately NOT to scale. See ScaleNotice.

import type { CelestialBody } from '@/types';

const FACT = 'https://nssdc.gsfc.nasa.gov/planetary/factsheet';
const SCI = 'https://science.nasa.gov';

const moonsNote = 'Moon counts change as new small moons are confirmed. Check the source for the latest figure.';

export const SOLAR_SYSTEM: CelestialBody[] = [
  {
    id: 'sun',
    name: 'Sun',
    kind: 'star',
    tagline: 'The G-type main-sequence star at the heart of our system.',
    overview:
      'The Sun is a yellow dwarf star (spectral type G2V) that contains about 99.8% of the Solar System’s mass. Nuclear fusion in its core converts hydrogen into helium, releasing the energy that powers Earth’s climate and life. It is roughly 4.6 billion years old — about halfway through its main-sequence lifetime.',
    physical: { diameterKm: 1_391_400, mass: '1.989 × 10³⁰ kg', massKg: 1.9885e30, gravity: '274 m/s²', density: '1,408 kg/m³' },
    orbit: {
      meanDistance: '~26,000 light-years from the galactic centre (estimate)',
      orbitalPeriod: '~230 million years around the Milky Way (estimate)',
      rotationPeriod: '~25.4 days at the equator; ~35 days near the poles (differential rotation)',
    },
    temperature: 'Photosphere ~5,772 K; corona 1–2 million K; core ~15 million K',
    atmosphere: {
      summary: 'Layered plasma: photosphere, chromosphere and the extremely hot corona, which streams outward as the solar wind.',
      composition: [
        { gas: 'Hydrogen', share: '~73% (by mass)' },
        { gas: 'Helium', share: '~25% (by mass)' },
        { gas: 'Heavier elements', share: '~2%' },
      ],
    },
    missions: [
      { name: 'SOHO', years: '1995–present', agency: 'ESA/NASA', note: 'Continuous observation of the Sun and its corona.' },
      { name: 'Solar Dynamics Observatory', years: '2010–present', agency: 'NASA', note: 'High-cadence imaging of the solar atmosphere.' },
      { name: 'Parker Solar Probe', years: '2018–present', agency: 'NASA', note: 'Closest-ever approach to the Sun, flying through the corona.' },
      { name: 'Solar Orbiter', years: '2020–present', agency: 'ESA/NASA', note: 'First close-up images of the Sun’s polar regions.' },
    ],
    discoveries: [
      'In 2021 Parker Solar Probe became the first spacecraft to fly through the Sun’s corona.',
      'Helioseismology revealed the Sun’s internal rotation and the tachocline, where its magnetic dynamo is thought to operate.',
      'The Sun follows an ~11-year magnetic activity cycle, flipping its magnetic poles at solar maximum.',
    ],
    uncertainties: ['Why the corona is hundreds of times hotter than the photosphere (the “coronal heating problem”) is still debated.'],
    visual: { style: 'sun', palette: ['#ff7a18', '#ffb347', '#fff1c4'], tiltDeg: 7.25, sceneRadius: 6, sceneOrbit: 0 },
    imageQuery: 'Sun solar dynamics observatory',
    sources: [
      { label: 'NASA Sun Fact Sheet (NSSDCA)', url: `${FACT}/sunfact.html` },
      { label: 'NASA Science — The Sun', url: `${SCI}/sun/` },
    ],
  },
  {
    id: 'mercury',
    name: 'Mercury',
    kind: 'planet',
    tagline: 'The smallest planet and the closest to the Sun.',
    overview:
      'Mercury is a heavily cratered, airless world only slightly larger than Earth’s Moon. Its enormous iron core makes it the second-densest planet. With almost no atmosphere to hold heat, its surface swings between scorching days and frigid nights.',
    physical: { diameterKm: 4_879, mass: '3.30 × 10²³ kg', massKg: 3.3e23, gravity: '3.7 m/s²', density: '5,429 kg/m³' },
    orbit: {
      meanDistance: '57.9 million km (0.39 AU)',
      meanDistanceKm: 57.9e6,
      orbitalPeriod: '88.0 Earth days',
      orbitalPeriodDays: 88.0,
      rotationPeriod: '58.6 Earth days (sidereal); one solar day lasts ~176 Earth days',
      eccentricity: '0.206',
    },
    temperature: 'Mean ~167 °C; from about −173 °C at night to 427 °C by day',
    atmosphere: {
      summary: 'No substantial atmosphere — only a thin exosphere of atoms blasted off the surface by the solar wind and micrometeoroids.',
      composition: [
        { gas: 'Oxygen, sodium, hydrogen, helium, potassium', share: 'Trace exosphere' },
      ],
    },
    moons: { count: 0, countSource: 'NASA Science', countAsOf: '2025', notable: [] },
    missions: [
      { name: 'Mariner 10', years: '1974–1975', agency: 'NASA', note: 'First spacecraft to visit Mercury (three flybys).' },
      { name: 'MESSENGER', years: '2011–2015 (orbit)', agency: 'NASA', note: 'First Mercury orbiter; mapped the entire planet.' },
      { name: 'BepiColombo', years: 'Launched 2018', agency: 'ESA/JAXA', note: 'Two orbiters travelling to Mercury.' },
    ],
    discoveries: [
      'MESSENGER found evidence of water ice in permanently shadowed craters near the poles.',
      'Long cliffs called lobate scarps show the planet has shrunk as its interior cooled.',
      'Its metallic core spans roughly 85% of the planet’s radius.',
    ],
    visual: { style: 'rocky', palette: ['#4a4541', '#8c8279', '#c7bdb3'], tiltDeg: 0.03, sceneRadius: 0.5, sceneOrbit: 12 },
    imageQuery: 'Mercury MESSENGER',
    sources: [
      { label: 'NASA Mercury Fact Sheet (NSSDCA)', url: `${FACT}/mercuryfact.html` },
      { label: 'NASA Science — Mercury', url: `${SCI}/mercury/` },
    ],
  },
  {
    id: 'venus',
    name: 'Venus',
    kind: 'planet',
    tagline: 'A runaway greenhouse wrapped in sulfuric-acid clouds.',
    overview:
      'Venus is similar to Earth in size and bulk composition, but its thick carbon-dioxide atmosphere traps heat so efficiently that its surface is hot enough to melt lead. It rotates slowly backwards (retrograde), so the Sun rises in the west.',
    physical: { diameterKm: 12_104, mass: '4.87 × 10²⁴ kg', massKg: 4.87e24, gravity: '8.9 m/s²', density: '5,243 kg/m³' },
    orbit: {
      meanDistance: '108.2 million km (0.72 AU)',
      meanDistanceKm: 108.2e6,
      orbitalPeriod: '224.7 Earth days',
      orbitalPeriodDays: 224.7,
      rotationPeriod: '243 Earth days, retrograde',
      eccentricity: '0.007',
    },
    temperature: 'Mean surface ~464 °C',
    atmosphere: {
      summary: 'Extremely dense — surface pressure about 92 times Earth’s — with clouds of sulfuric acid droplets.',
      composition: [
        { gas: 'Carbon dioxide', share: '~96.5%' },
        { gas: 'Nitrogen', share: '~3.5%' },
        { gas: 'Sulfur dioxide, argon, water', share: 'Trace' },
      ],
    },
    moons: { count: 0, countSource: 'NASA Science', countAsOf: '2025', notable: [] },
    missions: [
      { name: 'Mariner 2', years: '1962', agency: 'NASA', note: 'First successful planetary flyby.' },
      { name: 'Venera 7–14', years: '1970–1982', agency: 'USSR', note: 'First landings and surface images from another planet.' },
      { name: 'Magellan', years: '1990–1994', agency: 'NASA', note: 'Radar-mapped about 98% of the surface.' },
      { name: 'Akatsuki', years: '2015–2024', agency: 'JAXA', note: 'Studied atmospheric super-rotation.' },
      { name: 'DAVINCI & VERITAS', years: 'Planned', agency: 'NASA', note: 'Upcoming atmosphere probe and radar orbiter.' },
    ],
    discoveries: [
      'Venus’s upper atmosphere super-rotates, circling the planet in about four Earth days.',
      'Reanalysis of Magellan radar images (2023) showed a volcanic vent changing shape — evidence of recent volcanic activity.',
    ],
    uncertainties: ['A 2020 report of phosphine in the clouds remains disputed by follow-up studies.'],
    visual: { style: 'venus', palette: ['#8a5a2b', '#d9a85b', '#f3dcae'], atmosphere: '#f6d48f', tiltDeg: 177.4, sceneRadius: 0.95, sceneOrbit: 17 },
    imageQuery: 'Venus planet',
    sources: [
      { label: 'NASA Venus Fact Sheet (NSSDCA)', url: `${FACT}/venusfact.html` },
      { label: 'NASA Science — Venus', url: `${SCI}/venus/` },
    ],
  },
  {
    id: 'earth',
    name: 'Earth',
    kind: 'planet',
    tagline: 'Our home — the only world known to harbor life.',
    overview:
      'Earth is the largest of the rocky planets and the only place in the universe known to support life. Liquid water covers about 71% of its surface, and a nitrogen–oxygen atmosphere and global magnetic field shield it from harmful radiation.',
    physical: { diameterKm: 12_756, mass: '5.97 × 10²⁴ kg', massKg: 5.97e24, gravity: '9.8 m/s²', density: '5,514 kg/m³' },
    orbit: {
      meanDistance: '149.6 million km (1 AU)',
      meanDistanceKm: 149.6e6,
      orbitalPeriod: '365.25 days',
      orbitalPeriodDays: 365.25,
      rotationPeriod: '23.9 hours (sidereal)',
      eccentricity: '0.017',
    },
    temperature: 'Mean surface ~15 °C',
    atmosphere: {
      summary: 'A protective atmosphere that supports life and moderates temperature.',
      composition: [
        { gas: 'Nitrogen', share: '~78%' },
        { gas: 'Oxygen', share: '~21%' },
        { gas: 'Argon', share: '~0.9%' },
        { gas: 'Carbon dioxide, water vapor, others', share: 'Trace' },
      ],
    },
    moons: { count: 1, countSource: 'NASA Science', countAsOf: '2025', notable: ['The Moon'] },
    missions: [
      { name: 'Explorer 1', years: '1958', agency: 'NASA', note: 'Discovered the Van Allen radiation belts.' },
      { name: 'Landsat program', years: '1972–present', agency: 'NASA/USGS', note: 'Longest continuous record of Earth’s land surface.' },
      { name: 'Terra & Aqua', years: '1999/2002–present', agency: 'NASA', note: 'Global climate and Earth-system observations.' },
      { name: 'PACE', years: '2024–present', agency: 'NASA', note: 'Ocean color, aerosols and clouds.' },
    ],
    discoveries: [
      'Explorer 1 revealed the Van Allen belts — zones of charged particles trapped by Earth’s magnetic field.',
      'Satellite records show global sea-level rise and the decline of Arctic sea ice over recent decades.',
    ],
    visual: {
      style: 'earth',
      palette: ['#0b2a5b', '#1f6f4a', '#d9e7ff'],
      atmosphere: '#6fb7ff',
      clouds: true,
      tiltDeg: 23.4,
      sceneRadius: 1,
      sceneOrbit: 23,
    },
    imageQuery: 'Earth from space blue marble',
    sources: [
      { label: 'NASA Earth Fact Sheet (NSSDCA)', url: `${FACT}/earthfact.html` },
      { label: 'NASA Science — Earth', url: `${SCI}/earth/` },
    ],
  },
  {
    id: 'mars',
    name: 'Mars',
    kind: 'planet',
    tagline: 'A cold desert world that once had flowing water.',
    overview:
      'Mars is a dusty, cold planet with the largest volcano (Olympus Mons) and one of the largest canyons (Valles Marineris) in the Solar System. Ancient river valleys, lakebeds and minerals that form in water show it was once wetter and possibly habitable.',
    physical: { diameterKm: 6_792, mass: '6.42 × 10²³ kg', massKg: 6.42e23, gravity: '3.7 m/s²', density: '3,934 kg/m³' },
    orbit: {
      meanDistance: '228.0 million km (1.52 AU)',
      meanDistanceKm: 228.0e6,
      orbitalPeriod: '687 Earth days',
      orbitalPeriodDays: 687,
      rotationPeriod: '24.6 hours',
      eccentricity: '0.094',
    },
    temperature: 'Mean ~−65 °C',
    atmosphere: {
      summary: 'Thin — surface pressure is less than 1% of Earth’s.',
      composition: [
        { gas: 'Carbon dioxide', share: '~95%' },
        { gas: 'Nitrogen', share: '~2.8%' },
        { gas: 'Argon', share: '~2%' },
        { gas: 'Oxygen, carbon monoxide, water', share: 'Trace' },
      ],
    },
    moons: { count: 2, countSource: 'NASA Science', countAsOf: '2025', notable: ['Phobos', 'Deimos'] },
    missions: [
      { name: 'Viking 1 & 2', years: '1976–1982', agency: 'NASA', note: 'First successful US landers; searched for life.' },
      { name: 'Mars Reconnaissance Orbiter', years: '2006–present', agency: 'NASA', note: 'High-resolution orbital imaging.' },
      { name: 'Curiosity', years: '2012–present', agency: 'NASA', note: 'Exploring Gale Crater’s ancient lake deposits.' },
      { name: 'Perseverance & Ingenuity', years: '2021–present', agency: 'NASA', note: 'Caching samples in Jezero Crater; first powered flight on another planet.' },
    ],
    discoveries: [
      'Curiosity confirmed Gale Crater once held a long-lived lake with conditions that could have supported microbial life.',
      'In 2021 the Ingenuity helicopter made the first powered, controlled flight on another planet.',
      'Perseverance is collecting rock samples intended for future return to Earth.',
    ],
    uncertainties: ['The origin and variability of methane detected by Curiosity remain under investigation.'],
    visual: { style: 'mars', palette: ['#5a2412', '#b5532a', '#e8a070'], atmosphere: '#ff9c6b', tiltDeg: 25.2, sceneRadius: 0.62, sceneOrbit: 29 },
    imageQuery: 'Mars planet',
    sources: [
      { label: 'NASA Mars Fact Sheet (NSSDCA)', url: `${FACT}/marsfact.html` },
      { label: 'NASA Science — Mars', url: `${SCI}/mars/` },
    ],
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    kind: 'planet',
    tagline: 'The giant — more than twice the mass of all other planets combined.',
    overview:
      'Jupiter is a gas giant made mostly of hydrogen and helium. Its striped cloud bands are driven by powerful jet streams, and the Great Red Spot is a storm larger than Earth that has been observed for centuries. Its large moons include volcanic Io and ocean-hiding Europa.',
    physical: { diameterKm: 142_984, mass: '1.898 × 10²⁷ kg', massKg: 1.898e27, gravity: '23.1 m/s²', density: '1,326 kg/m³' },
    orbit: {
      meanDistance: '778.5 million km (5.2 AU)',
      meanDistanceKm: 778.5e6,
      orbitalPeriod: '11.86 Earth years',
      orbitalPeriodDays: 4331,
      rotationPeriod: '9.9 hours',
      eccentricity: '0.049',
    },
    temperature: '~−110 °C at the 1-bar level',
    atmosphere: {
      summary: 'Deep hydrogen–helium atmosphere with ammonia, ammonium hydrosulfide and water clouds.',
      composition: [
        { gas: 'Molecular hydrogen', share: '~90%' },
        { gas: 'Helium', share: '~10%' },
        { gas: 'Methane, ammonia, water', share: 'Trace' },
      ],
    },
    moons: {
      count: 95,
      countSource: 'NASA Science (officially recognized moons)',
      countAsOf: '2024',
      notable: ['Io', 'Europa', 'Ganymede', 'Callisto'],
    },
    missions: [
      { name: 'Pioneer 10 & 11', years: '1973–1974', agency: 'NASA', note: 'First flybys of Jupiter.' },
      { name: 'Voyager 1 & 2', years: '1979', agency: 'NASA', note: 'Discovered Jupiter’s faint rings and Io’s volcanoes.' },
      { name: 'Galileo', years: '1995–2003', agency: 'NASA', note: 'First Jupiter orbiter and atmospheric probe.' },
      { name: 'Juno', years: '2016–present', agency: 'NASA', note: 'Polar orbiter studying the interior and magnetic field.' },
      { name: 'Europa Clipper', years: 'Launched 2024', agency: 'NASA', note: 'Will investigate Europa’s habitability.' },
      { name: 'JUICE', years: 'Launched 2023', agency: 'ESA', note: 'Heading to Ganymede, Callisto and Europa.' },
    ],
    discoveries: [
      'Voyager 1 observed active volcanoes on Io — the first seen beyond Earth.',
      'Galileo found strong evidence for a salty ocean beneath Europa’s ice.',
      'Juno’s gravity data suggest Jupiter’s core is large and “dilute,” mixed with the surrounding envelope.',
    ],
    uncertainties: [moonsNote, 'The structure of Jupiter’s deep interior is still being refined from Juno data.'],
    visual: { style: 'gas', palette: ['#8b5e3c', '#d8b48a', '#f2e6d0'], tiltDeg: 3.1, sceneRadius: 3.2, sceneOrbit: 42 },
    imageQuery: 'Jupiter Juno',
    sources: [
      { label: 'NASA Jupiter Fact Sheet (NSSDCA)', url: `${FACT}/jupiterfact.html` },
      { label: 'NASA Science — Jupiter', url: `${SCI}/jupiter/` },
      { label: 'NASA Science — Jupiter moons', url: `${SCI}/jupiter/jupiter-moons/` },
    ],
  },
  {
    id: 'saturn',
    name: 'Saturn',
    kind: 'planet',
    tagline: 'The ringed jewel of the Solar System.',
    overview:
      'Saturn is a gas giant less dense than water, famous for its spectacular ring system made mostly of water-ice fragments. Its moons include Titan, with a thick atmosphere and methane lakes, and Enceladus, which sprays water from a hidden ocean.',
    physical: { diameterKm: 120_536, mass: '5.68 × 10²⁶ kg', massKg: 5.68e26, gravity: '9.0 m/s²', density: '687 kg/m³' },
    orbit: {
      meanDistance: '1.43 billion km (9.5 AU)',
      meanDistanceKm: 1432.0e6,
      orbitalPeriod: '29.4 Earth years',
      orbitalPeriodDays: 10747,
      rotationPeriod: '10.7 hours',
      eccentricity: '0.052',
    },
    temperature: '~−140 °C at the 1-bar level',
    atmosphere: {
      summary: 'Hydrogen–helium atmosphere with muted bands and a persistent hexagonal jet stream at the north pole.',
      composition: [
        { gas: 'Molecular hydrogen', share: '~96%' },
        { gas: 'Helium', share: '~3%' },
        { gas: 'Methane, ammonia', share: 'Trace' },
      ],
    },
    moons: {
      count: 274,
      countSource: 'IAU Minor Planet Center / NASA Science',
      countAsOf: 'March 2025',
      notable: ['Titan', 'Enceladus', 'Mimas', 'Rhea', 'Iapetus'],
    },
    missions: [
      { name: 'Pioneer 11', years: '1979', agency: 'NASA', note: 'First Saturn flyby.' },
      { name: 'Voyager 1 & 2', years: '1980–1981', agency: 'NASA', note: 'Detailed views of rings and moons.' },
      { name: 'Cassini–Huygens', years: '2004–2017', agency: 'NASA/ESA/ASI', note: '13 years in orbit; Huygens landed on Titan in 2005.' },
      { name: 'Dragonfly', years: 'Planned launch 2028', agency: 'NASA', note: 'Rotorcraft lander bound for Titan.' },
    ],
    discoveries: [
      'Cassini discovered water-rich plumes erupting from Enceladus’s south pole.',
      'Huygens made the first landing in the outer Solar System, on Titan, in 2005.',
      'Cassini mapped seas and lakes of liquid methane and ethane on Titan.',
    ],
    uncertainties: [moonsNote, 'The age of Saturn’s rings — young (hundreds of millions of years) or primordial — is actively debated.'],
    visual: {
      style: 'gas',
      palette: ['#9b7a4c', '#d9c08f', '#f5ead0'],
      rings: { inner: 1.24, outer: 2.27, color: '#d8c49a', opacity: 0.9 },
      tiltDeg: 26.7,
      sceneRadius: 2.7,
      sceneOrbit: 56,
    },
    imageQuery: 'Saturn Cassini',
    sources: [
      { label: 'NASA Saturn Fact Sheet (NSSDCA)', url: `${FACT}/saturnfact.html` },
      { label: 'NASA Science — Saturn', url: `${SCI}/saturn/` },
      { label: 'NASA Science — Saturn moons', url: `${SCI}/saturn/moons/` },
    ],
  },
  {
    id: 'uranus',
    name: 'Uranus',
    kind: 'planet',
    tagline: 'The ice giant that rolls around the Sun on its side.',
    overview:
      'Uranus is an ice giant whose interior is thought to be mostly a dense fluid of water, methane and ammonia over a small rocky core. Its extreme axial tilt of about 98° means each pole spends roughly 42 years in continuous sunlight, then 42 years in darkness.',
    physical: { diameterKm: 51_118, mass: '8.68 × 10²⁵ kg', massKg: 8.68e25, gravity: '8.7 m/s²', density: '1,270 kg/m³' },
    orbit: {
      meanDistance: '2.87 billion km (19.2 AU)',
      meanDistanceKm: 2867.0e6,
      orbitalPeriod: '84 Earth years',
      orbitalPeriodDays: 30589,
      rotationPeriod: '17.2 hours, retrograde',
      eccentricity: '0.047',
    },
    temperature: '~−195 °C at the 1-bar level',
    atmosphere: {
      summary: 'Methane absorbs red light, giving Uranus its cyan color.',
      composition: [
        { gas: 'Molecular hydrogen', share: '~83%' },
        { gas: 'Helium', share: '~15%' },
        { gas: 'Methane', share: '~2.3%' },
      ],
    },
    moons: {
      count: 29,
      countSource: 'NASA (JWST discovery of S/2025 U1)',
      countAsOf: 'August 2025',
      notable: ['Titania', 'Oberon', 'Umbriel', 'Ariel', 'Miranda'],
    },
    missions: [{ name: 'Voyager 2', years: '1986', agency: 'NASA', note: 'The only spacecraft to visit Uranus.' }],
    discoveries: [
      'Discovered by William Herschel in 1781 — the first planet found with a telescope.',
      'Its rings were discovered in 1977 when they blocked the light of a background star.',
      'A 2024 reanalysis suggests Voyager 2 flew by during an unusual solar-wind event, so its magnetosphere may be less extreme than once thought.',
    ],
    uncertainties: [moonsNote, 'What tipped Uranus onto its side is unknown; a giant impact is one leading hypothesis.'],
    visual: {
      style: 'ice-giant',
      palette: ['#3d8fa0', '#82d4dc', '#d4f4f5'],
      atmosphere: '#a8f0ff',
      rings: { inner: 1.6, outer: 2.0, color: '#9fb7c0', opacity: 0.35 },
      tiltDeg: 97.8,
      sceneRadius: 1.8,
      sceneOrbit: 70,
    },
    imageQuery: 'Uranus planet',
    sources: [
      { label: 'NASA Uranus Fact Sheet (NSSDCA)', url: `${FACT}/uranusfact.html` },
      { label: 'NASA Science — Uranus', url: `${SCI}/uranus/` },
    ],
  },
  {
    id: 'neptune',
    name: 'Neptune',
    kind: 'planet',
    tagline: 'The windswept, deep-blue world at the edge of the planets.',
    overview:
      'Neptune is the most distant planet from the Sun. It was the first planet located through mathematical prediction rather than observation. Despite receiving little sunlight, it has the fastest winds measured in the Solar System.',
    physical: { diameterKm: 49_528, mass: '1.02 × 10²⁶ kg', massKg: 1.02e26, gravity: '11.0 m/s²', density: '1,638 kg/m³' },
    orbit: {
      meanDistance: '4.5 billion km (30.1 AU)',
      meanDistanceKm: 4515.0e6,
      orbitalPeriod: '164.8 Earth years',
      orbitalPeriodDays: 59800,
      rotationPeriod: '16.1 hours',
      eccentricity: '0.010',
    },
    temperature: '~−200 °C at the 1-bar level',
    atmosphere: {
      summary: 'Dynamic atmosphere with dark storms and winds exceeding 2,000 km/h.',
      composition: [
        { gas: 'Molecular hydrogen', share: '~80%' },
        { gas: 'Helium', share: '~19%' },
        { gas: 'Methane', share: '~1.5%' },
      ],
    },
    moons: { count: 16, countSource: 'NASA Science', countAsOf: '2024', notable: ['Triton', 'Proteus', 'Nereid'] },
    missions: [{ name: 'Voyager 2', years: '1989', agency: 'NASA', note: 'The only spacecraft to visit Neptune.' }],
    discoveries: [
      'Predicted by Urbain Le Verrier and observed by Johann Galle in 1846.',
      'Voyager 2 imaged the Great Dark Spot and nitrogen geysers on Triton.',
      'Triton orbits backwards, suggesting it is a captured Kuiper Belt object.',
    ],
    uncertainties: [moonsNote],
    visual: { style: 'ice-giant', palette: ['#1b2f8f', '#3f66d6', '#a6c1ff'], atmosphere: '#6f95ff', tiltDeg: 28.3, sceneRadius: 1.75, sceneOrbit: 82 },
    imageQuery: 'Neptune Voyager',
    sources: [
      { label: 'NASA Neptune Fact Sheet (NSSDCA)', url: `${FACT}/neptunefact.html` },
      { label: 'NASA Science — Neptune', url: `${SCI}/neptune/` },
    ],
  },
  // ---------------- Moons ----------------
  {
    id: 'moon',
    name: 'The Moon',
    kind: 'moon',
    parent: 'earth',
    tagline: 'Earth’s only natural satellite — and the only other world humans have walked on.',
    overview:
      'The Moon likely formed from debris after a Mars-sized body collided with the early Earth. It is tidally locked, always showing the same face to us, and its gravity drives Earth’s ocean tides. Twelve astronauts walked on its surface during the Apollo program (1969–1972).',
    physical: { diameterKm: 3_475, mass: '7.35 × 10²² kg', massKg: 7.35e22, gravity: '1.6 m/s²', density: '3,344 kg/m³' },
    orbit: {
      meanDistance: '384,400 km from Earth',
      meanDistanceKm: 384_400,
      orbitalPeriod: '27.3 days (sidereal)',
      orbitalPeriodDays: 27.3,
      rotationPeriod: '27.3 days (synchronous)',
      eccentricity: '0.055',
    },
    temperature: 'From about −173 °C at night to 127 °C at midday (equator)',
    atmosphere: { summary: 'Only a tenuous exosphere.', composition: [{ gas: 'Helium, argon, sodium, potassium', share: 'Trace exosphere' }] },
    missions: [
      { name: 'Apollo 11–17', years: '1969–1972', agency: 'NASA', note: 'Crewed landings; 382 kg of samples returned.' },
      { name: 'Lunar Reconnaissance Orbiter', years: '2009–present', agency: 'NASA', note: 'High-resolution global mapping.' },
      { name: 'Chang’e 4', years: '2019', agency: 'CNSA', note: 'First soft landing on the far side.' },
      { name: 'Artemis program', years: '2022–present', agency: 'NASA & partners', note: 'Returning humans to the Moon.' },
    ],
    discoveries: [
      'LCROSS (2009) detected water ice in a permanently shadowed crater near the south pole.',
      'Apollo seismometers revealed moonquakes and a layered interior.',
    ],
    visual: { style: 'moon', palette: ['#3b3b3d', '#8a8a8c', '#cfcfd1'], tiltDeg: 6.7, sceneRadius: 0.27, sceneOrbit: 2.2 },
    imageQuery: 'Moon lunar surface',
    sources: [
      { label: 'NASA Moon Fact Sheet (NSSDCA)', url: `${FACT}/moonfact.html` },
      { label: 'NASA Science — Earth’s Moon', url: `${SCI}/moon/` },
    ],
  },
  {
    id: 'europa',
    name: 'Europa',
    kind: 'moon',
    parent: 'jupiter',
    tagline: 'An icy moon hiding a global ocean.',
    overview:
      'Europa, slightly smaller than Earth’s Moon, has a bright, cracked ice shell. Magnetic-field measurements by Galileo indicate a salty liquid-water ocean beneath — potentially with more water than all of Earth’s oceans — making it a prime target in the search for habitable environments.',
    physical: { diameterKm: 3_122, mass: '4.80 × 10²² kg', massKg: 4.8e22 },
    orbit: {
      meanDistance: '~671,000 km from Jupiter',
      meanDistanceKm: 671_000,
      orbitalPeriod: '3.55 days',
      orbitalPeriodDays: 3.55,
      rotationPeriod: '3.55 days (synchronous)',
    },
    temperature: 'Equatorial surface never rises above about −160 °C',
    atmosphere: { summary: 'Extremely thin oxygen exosphere.', composition: [{ gas: 'Molecular oxygen', share: 'Trace exosphere' }] },
    missions: [
      { name: 'Galileo', years: '1995–2003', agency: 'NASA', note: 'Found evidence for the subsurface ocean.' },
      { name: 'Europa Clipper', years: 'Launched 2024; arrival 2030', agency: 'NASA', note: 'Dedicated habitability investigation.' },
    ],
    discoveries: ['Galileo magnetometer data indicated an induced magnetic field consistent with a salty subsurface ocean.'],
    uncertainties: ['The thickness of the ice shell and whether the ocean is habitable remain open questions.'],
    visual: { style: 'europa', palette: ['#8a6b4d', '#d6c7b0', '#f4efe6'], tiltDeg: 0.1, sceneRadius: 0.3, sceneOrbit: 5 },
    imageQuery: 'Europa moon Jupiter',
    sources: [{ label: 'NASA Science — Europa', url: `${SCI}/jupiter/jupiter-moons/europa/` }],
  },
  {
    id: 'titan',
    name: 'Titan',
    kind: 'moon',
    parent: 'saturn',
    tagline: 'A hazy moon with rain, rivers and seas — of methane.',
    overview:
      'Titan is Saturn’s largest moon and the only moon with a dense atmosphere. On its frigid surface, liquid methane and ethane rain from clouds, carve channels and pool into lakes and seas, making Titan the only other world known to have stable surface liquids.',
    physical: { diameterKm: 5_150, mass: '1.35 × 10²³ kg', massKg: 1.345e23 },
    orbit: {
      meanDistance: '~1.22 million km from Saturn',
      meanDistanceKm: 1_221_870,
      orbitalPeriod: '15.95 days',
      orbitalPeriodDays: 15.95,
      rotationPeriod: '15.95 days (synchronous)',
    },
    temperature: 'Surface ~−179 °C',
    atmosphere: {
      summary: 'Dense, hazy nitrogen atmosphere; surface pressure ~1.5 times Earth’s.',
      composition: [
        { gas: 'Nitrogen', share: '~95%' },
        { gas: 'Methane', share: '~5%' },
      ],
    },
    missions: [
      { name: 'Cassini–Huygens', years: '2004–2017', agency: 'NASA/ESA/ASI', note: 'Huygens probe landed on Titan in 2005.' },
      { name: 'Dragonfly', years: 'Planned launch 2028', agency: 'NASA', note: 'Rotorcraft to explore Titan’s surface chemistry.' },
    ],
    discoveries: ['Cassini radar revealed large hydrocarbon seas such as Kraken Mare and Ligeia Mare near the north pole.'],
    visual: { style: 'titan', palette: ['#7a4a14', '#c98a32', '#f0c070'], atmosphere: '#e6a447', tiltDeg: 0.3, sceneRadius: 0.4, sceneOrbit: 8.5 },
    imageQuery: 'Titan moon Saturn Cassini',
    sources: [{ label: 'NASA Science — Titan', url: `${SCI}/saturn/moons/titan/` }],
  },
  {
    id: 'enceladus',
    name: 'Enceladus',
    kind: 'moon',
    parent: 'saturn',
    tagline: 'A tiny, brilliant moon venting its ocean into space.',
    overview:
      'Enceladus is only about 500 km across, yet it is one of the most reflective objects in the Solar System. Cassini flew through plumes of water vapor and ice grains jetting from cracks near its south pole, sampling material from a subsurface ocean.',
    physical: { diameterKm: 504, mass: '1.08 × 10²⁰ kg', massKg: 1.08e20 },
    orbit: {
      meanDistance: '~238,000 km from Saturn',
      meanDistanceKm: 238_000,
      orbitalPeriod: '1.37 days',
      orbitalPeriodDays: 1.37,
      rotationPeriod: '1.37 days (synchronous)',
    },
    temperature: 'Mean surface ~−198 °C',
    atmosphere: { summary: 'Localized water-vapor plumes rather than a global atmosphere.', composition: [{ gas: 'Water vapor (plumes)', share: 'Dominant in plumes' }] },
    missions: [{ name: 'Cassini', years: '2004–2017', agency: 'NASA/ESA/ASI', note: 'Discovered and sampled the plumes.' }],
    discoveries: [
      'Cassini detected salts, silica and molecular hydrogen in the plumes, pointing to hydrothermal activity on the ocean floor.',
      'Its plumes supply material to Saturn’s E ring.',
    ],
    visual: { style: 'icy-moon', palette: ['#b9c9d6', '#e8f1f8', '#ffffff'], tiltDeg: 0, sceneRadius: 0.22, sceneOrbit: 6.8 },
    imageQuery: 'Enceladus plumes Cassini',
    sources: [{ label: 'NASA Science — Enceladus', url: `${SCI}/saturn/moons/enceladus/` }],
  },
];

export const PLANET_IDS = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'] as const;
