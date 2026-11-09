import { ArrowLeft } from 'lucide-react';
import { lazy, Suspense, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DataBadge } from '@/components/shared/DataBadge';
import { DataList } from '@/components/shared/DataList';
import { NasaImageStrip } from '@/components/shared/NasaImageStrip';
import { Reveal } from '@/components/shared/Reveal';
import { SourceList } from '@/components/shared/SourceList';
import { starColor } from '@/data/starCatalog';
import { useDeviceTier } from '@/hooks/useDevice';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { getStar } from '@/services/nasa/stars';
import type { BodyVisual } from '@/types';
import NotFoundPage from './NotFoundPage';

const BodyScene = lazy(() => import('@/components/space/BodyScene'));

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

export default function StarDetailPage() {
  const { id } = useParams();
  const s = getStar(id);
  const tier = useDeviceTier();
  const { reduced } = useMotionPreference();

  const visual = useMemo<BodyVisual | null>(() => {
    if (!s) return null;
    const c = starColor(s.temperatureK);
    return { style: 'sun', palette: [shade(c, 0.75), c, '#ffffff'], tiltDeg: 0, sceneRadius: 1, sceneOrbit: 0 };
  }, [s]);

  if (!s || !visual) return <NotFoundPage what="star" />;
  const est = new Set(s.estimates);

  return (
    <article>
      <section className="relative h-[66svh] min-h-[460px] overflow-hidden">
        <Suspense fallback={<div className="css-starfield absolute inset-0" />}>
          <BodyScene key={s.id} visual={visual} reduced={reduced} tier={tier} label={`Procedural rendering of ${s.name}, coloured by its approximate surface temperature (artistic).`} />
        </Suspense>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-void to-transparent" aria-hidden />
        <div className="container-cosmos pointer-events-none relative flex h-full flex-col justify-end pb-10">
          <div className="pointer-events-auto">
            <Link to="/stars" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted hover:text-stellar">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All stars
            </Link>
            <p className="eyebrow mt-6">
              {s.designation} · {s.spectralType}
            </p>
            <h1 className="display mt-3 text-6xl sm:text-8xl">{s.name}</h1>
            <div className="mt-5 flex flex-wrap gap-3">
              <DataBadge provenance="curated" />
              <span className="chip">Rendering: procedural, artistic</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container-cosmos mt-12 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <p className="font-serif text-2xl leading-relaxed text-stellar/90 sm:text-3xl">{s.summary}</p>
          <div className="mt-10">
            <p className="data-label">Known planetary system</p>
            <p className="mt-2 text-stellar/90">{s.planets}</p>
          </div>
          <div className="mt-10">
            <SourceList sources={s.sources} />
          </div>
        </Reveal>
        <DataList
          columns={1}
          items={[
            { label: 'Spectral type', value: s.spectralType },
            { label: 'Distance from Earth', value: s.distance, estimate: est.has('distance') },
            { label: 'Mass', value: s.mass, estimate: est.has('mass') },
            { label: 'Radius', value: s.radius, estimate: est.has('radius') },
            { label: 'Luminosity', value: s.luminosity, estimate: est.has('luminosity') },
            { label: 'Surface temperature', value: s.temperature, estimate: est.has('temperature') },
            { label: 'Constellation', value: s.constellation },
          ]}
        />
      </div>

      <section className="container-cosmos mt-16" aria-labelledby="star-images">
        <h2 id="star-images" className="data-label mb-4">
          NASA imagery
        </h2>
        <NasaImageStrip query={s.imageQuery} count={6} />
      </section>
    </article>
  );
}
