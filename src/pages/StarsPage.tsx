import { Link } from 'react-router-dom';
import { DataBadge } from '@/components/shared/DataBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { Reveal } from '@/components/shared/Reveal';
import { StarSizeChart } from '@/components/stars/StarSizeChart';
import { starColor } from '@/data/starCatalog';
import { getStars } from '@/services/nasa/stars';

export default function StarsPage() {
  const stars = getStars();
  return (
    <>
      <PageHeader
        eyebrow="Stars"
        title={
          <>
            The engines <em className="text-gold">of light.</em>
          </>
        }
        intro="From the dim red dwarf next door to the blazing supergiants of Orion. Values are rounded literature figures; many — especially for distant supergiants — are estimates with wide uncertainties, marked EST."
      >
        <DataBadge provenance="curated" source="SIMBAD & NASA" />
      </PageHeader>

      <section className="container-cosmos" aria-label="Star catalog">
        <ul className="grid gap-px border border-white/[0.06] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-3">
          {stars.map((s, i) => (
            <li key={s.id} className="bg-void">
              <Reveal delay={(i % 3) * 0.05} className="h-full">
                <Link to={`/stars/${s.id}`} className="group flex h-full flex-col p-6 transition hover:bg-white/[0.02]">
                  <span
                    className="block h-14 w-14 rounded-full transition-transform duration-700 group-hover:scale-110"
                    style={{ background: `radial-gradient(circle, #fff 0%, ${starColor(s.temperatureK)} 35%, transparent 70%)`, boxShadow: `0 0 40px ${starColor(s.temperatureK)}66` }}
                    aria-hidden
                  />
                  <p className="mt-5 font-serif text-3xl">{s.name}</p>
                  <p className="text-xs text-muted">{s.designation}</p>
                  <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="data-label">Spectral type</dt>
                      <dd className="mt-1 font-mono text-stellar">{s.spectralType}</dd>
                    </div>
                    <div>
                      <dt className="data-label">Distance</dt>
                      <dd className="mt-1 font-mono text-stellar">{s.distance.split('—')[0]}</dd>
                    </div>
                  </dl>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-cosmos mt-20" aria-labelledby="sizes">
        <h2 id="sizes" className="display mb-8 text-4xl">
          How big is a star?
        </h2>
        <StarSizeChart stars={stars} />
      </section>

      <section className="container-cosmos mt-20" aria-labelledby="star-table">
        <h2 id="star-table" className="font-serif text-3xl">
          At a glance
        </h2>
        <div className="scrollbar-thin mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <caption className="sr-only">Notable stars with spectral type, distance, mass, radius, luminosity, temperature and constellation</caption>
            <thead>
              <tr className="border-b border-white/10">
                {['Star', 'Type', 'Distance', 'Mass', 'Radius', 'Luminosity', 'Temperature', 'Constellation'].map((h) => (
                  <th key={h} scope="col" className="data-label py-3 pr-4 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stars.map((s) => (
                <tr key={s.id} className="border-b border-white/[0.05]">
                  <th scope="row" className="py-3 pr-4 font-normal">
                    <Link to={`/stars/${s.id}`} className="link-underline">
                      {s.name}
                    </Link>
                  </th>
                  <td className="py-3 pr-4 font-mono">{s.spectralType}</td>
                  <td className="py-3 pr-4 text-muted">{s.distance}</td>
                  <td className="py-3 pr-4 text-muted">{s.mass}</td>
                  <td className="py-3 pr-4 text-muted">{s.radius}</td>
                  <td className="py-3 pr-4 text-muted">{s.luminosity}</td>
                  <td className="py-3 pr-4 text-muted">{s.temperature}</td>
                  <td className="py-3 pr-4 text-muted">{s.constellation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">“~” marks approximate values. M☉, R☉, L☉ = solar mass, radius and luminosity.</p>
      </section>
    </>
  );
}
