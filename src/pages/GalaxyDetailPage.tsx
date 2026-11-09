import { ArrowLeft } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DataBadge } from '@/components/shared/DataBadge';
import { DataList } from '@/components/shared/DataList';
import { NasaImageStrip } from '@/components/shared/NasaImageStrip';
import { Reveal } from '@/components/shared/Reveal';
import { SourceList } from '@/components/shared/SourceList';
import { useDeviceTier } from '@/hooks/useDevice';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { getGalaxy } from '@/services/nasa/galaxies';
import NotFoundPage from './NotFoundPage';

const GalaxyScene = lazy(() => import('@/components/galaxies/GalaxyScene'));

export default function GalaxyDetailPage() {
  const { id } = useParams();
  const g = getGalaxy(id);
  const tier = useDeviceTier();
  const { reduced } = useMotionPreference();
  if (!g) return <NotFoundPage what="galaxy" />;

  return (
    <article>
      <section className="relative h-[70svh] min-h-[480px] overflow-hidden">
        <Suspense fallback={<div className="css-starfield absolute inset-0" />}>
          <GalaxyScene galaxy={g} tier={tier} reduced={reduced} />
        </Suspense>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-void to-transparent" aria-hidden />
        <div className="container-cosmos pointer-events-none relative flex h-full flex-col justify-end pb-10">
          <div className="pointer-events-auto">
            <Link to="/galaxies" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted hover:text-stellar">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All galaxies
            </Link>
            <p className="eyebrow mt-6">{g.classification}</p>
            <h1 className="display mt-3 text-6xl sm:text-8xl">{g.name}</h1>
            <div className="mt-5 flex flex-wrap gap-3">
              <DataBadge provenance="curated" />
              <span className="chip">Visualization: procedural, artistic</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container-cosmos mt-12 grid gap-12 lg:grid-cols-[1.3fr_1fr]">
        <Reveal>
          <p className="font-serif text-2xl leading-relaxed text-stellar/90 sm:text-3xl">{g.summary}</p>
          <h2 className="data-label mt-10">Relevant discoveries</h2>
          <ul className="mt-4 space-y-3">
            {g.discoveries.map((d) => (
              <li key={d} className="flex gap-3 text-sm leading-relaxed text-stellar/85">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cyan-cosmic" aria-hidden />
                {d}
              </li>
            ))}
          </ul>
          {g.uncertainty && (
            <div className="mt-8 border-l-2 border-gold/50 pl-4 text-sm text-muted">
              <p className="data-label text-gold">Uncertainty</p>
              <p className="mt-2">{g.uncertainty}</p>
            </div>
          )}
        </Reveal>
        <div className="space-y-8">
          <DataList
            columns={1}
            items={[
              { label: 'Catalog identifiers', value: g.identifiers.join(' · ') },
              { label: 'Classification', value: g.classification },
              { label: 'Distance from Earth', value: g.distance, estimate: true },
              { label: 'Approximate diameter', value: g.diameter, estimate: true },
              { label: 'Constellation / sky region', value: g.constellation },
            ]}
          />
          <SourceList sources={g.sources} />
        </div>
      </div>

      <section className="container-cosmos mt-16" aria-labelledby="gal-images">
        <h2 id="gal-images" className="data-label mb-4">
          NASA imagery
        </h2>
        <NasaImageStrip query={g.imageQuery} count={9} />
      </section>
    </article>
  );
}
