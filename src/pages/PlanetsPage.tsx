import { ArrowUpRight, Telescope } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PlanetOrb } from '@/components/planets/PlanetOrb';
import { DataBadge } from '@/components/shared/DataBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { Reveal } from '@/components/shared/Reveal';
import { getAllBodies, getBody, getPlanets } from '@/services/nasa/planetaryData';
import { formatKm } from '@/utils/format';

export default function PlanetsPage() {
  const planets = getPlanets();
  const sun = getBody('sun')!;
  const moons = getAllBodies().filter((b) => b.kind === 'moon');
  const maxD = Math.max(...planets.map((p) => p.physical.diameterKm));

  return (
    <>
      <PageHeader
        eyebrow="Solar System"
        title={
          <>
            Eight worlds, <em className="text-gold">one star.</em>
          </>
        }
        intro="The officially recognized planets of our Solar System, the Sun at its centre, and four moons that are reshaping our search for habitable worlds."
      >
        <DataBadge provenance="curated" source="NASA NSSDCA fact sheets" />
        <Link to="/explore" className="btn-ghost !py-2">
          <Telescope className="h-4 w-4" aria-hidden /> View in 3D
        </Link>
      </PageHeader>

      <section className="container-cosmos" aria-label="The Sun">
        <Reveal>
          <Link to="/planets/sun" className="group glass flex flex-col items-center gap-8 p-8 sm:flex-row">
            <PlanetOrb visual={sun.visual} size={120} />
            <div className="flex-1">
              <p className="eyebrow">Our star</p>
              <h2 className="mt-2 font-serif text-4xl">The Sun</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted">{sun.overview}</p>
            </div>
            <ArrowUpRight className="h-6 w-6 text-muted transition group-hover:text-stellar" aria-hidden />
          </Link>
        </Reveal>
      </section>

      <section className="container-cosmos mt-16" aria-labelledby="planets-title">
        <h2 id="planets-title" className="sr-only">
          Planets
        </h2>
        <ul className="grid gap-px border border-white/[0.06] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
          {planets.map((p, i) => (
            <li key={p.id} className="bg-void">
              <Reveal delay={(i % 4) * 0.05} className="h-full">
                <Link to={`/planets/${p.id}`} className="group flex h-full flex-col p-6 transition-colors hover:bg-white/[0.02]">
                  <div className="flex h-36 items-center justify-center transition-transform duration-700 group-hover:scale-105">
                    <PlanetOrb visual={p.visual} size={Math.max(44, Math.round(110 * Math.sqrt(p.physical.diameterKm / maxD)))} />
                  </div>
                  <p className="mt-4 font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</p>
                  <h3 className="mt-1 font-serif text-3xl">{p.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{p.tagline}</p>
                  <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="data-label">Diameter</dt>
                      <dd className="mt-1 font-mono text-stellar">{formatKm(p.physical.diameterKm)}</dd>
                    </div>
                    <div>
                      <dt className="data-label">Moons</dt>
                      <dd className="mt-1 font-mono text-stellar">{p.moons?.count ?? '—'}</dd>
                    </div>
                  </dl>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">Orb sizes use a square-root scale of diameter for legibility. Illustrations are artistic, not photographs.</p>
      </section>

      <section className="container-cosmos mt-20" aria-labelledby="moons-title">
        <Reveal>
          <p className="eyebrow">Notable moons</p>
          <h2 id="moons-title" className="display mt-3 text-4xl">
            Worlds that orbit worlds
          </h2>
        </Reveal>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {moons.map((m) => (
            <li key={m.id}>
              <Link to={`/planets/${m.id}`} className="glass group flex items-center gap-4 p-5 transition hover:border-cyan-cosmic/40">
                <PlanetOrb visual={m.visual} size={52} />
                <div>
                  <p className="font-serif text-2xl">{m.name}</p>
                  <p className="text-xs text-muted">Moon of {getBody(m.parent)?.name}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-cosmos mt-20" aria-labelledby="compare-title">
        <h2 id="compare-title" className="font-serif text-3xl">
          Compare the planets
        </h2>
        <div className="scrollbar-thin mt-6 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <caption className="sr-only">Planetary comparison: diameter, mass, distance, orbital period, rotation, temperature and moons</caption>
            <thead>
              <tr className="border-b border-white/10">
                {['Planet', 'Diameter', 'Mass', 'Mean distance from Sun', 'Orbital period', 'Rotation', 'Moons'].map((h) => (
                  <th key={h} scope="col" className="data-label py-3 pr-4 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {planets.map((p) => (
                <tr key={p.id} className="border-b border-white/[0.05] align-top">
                  <th scope="row" className="py-3 pr-4 font-normal">
                    <Link to={`/planets/${p.id}`} className="link-underline">
                      {p.name}
                    </Link>
                  </th>
                  <td className="py-3 pr-4 font-mono">{p.physical.diameterKm.toLocaleString('en-US')} km</td>
                  <td className="py-3 pr-4 font-mono">{p.physical.mass}</td>
                  <td className="py-3 pr-4 text-muted">{p.orbit.meanDistance}</td>
                  <td className="py-3 pr-4 text-muted">{p.orbit.orbitalPeriod}</td>
                  <td className="py-3 pr-4 text-muted">{p.orbit.rotationPeriod}</td>
                  <td className="py-3 pr-4 font-mono">
                    {p.moons?.count ?? '—'}
                    <span className="block font-sans text-[10px] text-muted">as of {p.moons?.countAsOf}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
