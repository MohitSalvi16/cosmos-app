import { Camera, FlaskConical } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { DataBadge } from '@/components/shared/DataBadge';
import { DataList } from '@/components/shared/DataList';
import { NasaImageStrip } from '@/components/shared/NasaImageStrip';
import { Reveal } from '@/components/shared/Reveal';
import { SourceList } from '@/components/shared/SourceList';
import { BLACK_HOLE_CONCEPTS, BLACK_HOLES } from '@/data/blackHoles';
import { useDeviceTier } from '@/hooks/useDevice';
import { useMotionPreference } from '@/hooks/useMotionPreference';

const BlackHoleCanvas = lazy(() => import('@/components/blackholes/BlackHoleCanvas'));

export default function BlackHolesPage() {
  const tier = useDeviceTier();
  const { reduced } = useMotionPreference();
  return (
    <>
      <section className="relative h-[100svh] min-h-[560px] overflow-hidden" aria-labelledby="bh-title">
        <Suspense fallback={<div className="absolute inset-0 bg-void" />}>
          <BlackHoleCanvas tier={tier} reduced={reduced} />
        </Suspense>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void via-transparent to-void/40" aria-hidden />
        <div className="container-cosmos pointer-events-none relative flex h-full flex-col justify-end pb-16">
          <p className="eyebrow">Black holes</p>
          <h1 id="bh-title" className="display mt-4 max-w-4xl text-5xl sm:text-7xl">
            Where light <em className="text-gold">bends</em> and time slows.
          </h1>
          <p className="mt-5 max-w-xl text-stellar/75">Regions of spacetime so dense that nothing escapes — yet they shape the galaxies around them.</p>
          <p className="pointer-events-auto mt-6 inline-flex max-w-xl items-start gap-2 border border-gold/30 bg-void/60 px-3 py-2 text-xs text-gold backdrop-blur">
            <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Simulation / artistic visualization: a simplified real-time ray-traced model of a non-rotating black hole. Not a photograph. Move your pointer to shift
            the viewpoint.
          </p>
        </div>
      </section>

      <section className="container-cosmos pt-24" aria-labelledby="concepts">
        <Reveal>
          <p className="eyebrow">Understanding black holes</p>
          <h2 id="concepts" className="display mt-4 text-4xl sm:text-5xl">
            Six ideas to know
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-px border border-white/[0.06] bg-white/[0.06] md:grid-cols-2 lg:grid-cols-3">
          {BLACK_HOLE_CONCEPTS.map((c, i) => (
            <Reveal key={c.id} delay={(i % 3) * 0.06} className="bg-void p-7">
              <p className="font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</p>
              <h3 className={`mt-3 font-serif text-2xl ${c.id === 'unknowns' ? 'text-gold' : ''}`}>{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{c.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-cosmos pt-24" aria-labelledby="documented">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Gallery</p>
            <h2 id="documented" className="display mt-4 text-4xl sm:text-5xl">
              Documented black holes
            </h2>
          </div>
          <DataBadge provenance="curated" source="NASA, EHT & peer-reviewed studies" />
        </Reveal>
        <div className="mt-12 space-y-24">
          {BLACK_HOLES.map((b) => (
            <article key={b.id} id={b.id} className="scroll-mt-24">
              <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
                <Reveal>
                  <p className="eyebrow">{b.type}</p>
                  <h3 className="display mt-3 text-5xl">{b.name}</h3>
                  {b.imaged && (
                    <p className="mt-3 inline-flex items-center gap-2 text-xs text-cyan-cosmic">
                      <Camera className="h-3.5 w-3.5" aria-hidden /> Imaged by the Event Horizon Telescope
                    </p>
                  )}
                  <p className="mt-5 text-stellar/85">{b.summary}</p>
                  <ul className="mt-6 space-y-2">
                    {b.highlights.map((h) => (
                      <li key={h} className="flex gap-3 text-sm text-muted">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cyan-cosmic" aria-hidden />
                        {h}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <SourceList sources={b.sources} />
                  </div>
                </Reveal>
                <DataList
                  columns={1}
                  items={[
                    { label: 'Type', value: b.type },
                    { label: 'Mass', value: b.mass, estimate: true },
                    { label: 'Distance from Earth', value: b.distance, estimate: true },
                    { label: 'Location', value: b.host },
                  ]}
                />
              </div>
              <div className="mt-8">
                <NasaImageStrip query={b.imageQuery} count={3} />
              </div>
            </article>
          ))}
        </div>
        <p className="mt-16 max-w-3xl text-xs leading-relaxed text-muted">
          Event Horizon Telescope images are released by the EHT Collaboration under a Creative Commons Attribution licence; NASA imagery is shown via the NASA
          Image and Video Library with the credits supplied there. Many images of black holes in public archives are illustrations — check each caption.
        </p>
      </section>
    </>
  );
}
