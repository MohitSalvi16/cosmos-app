import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Telescope } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PlanetOrb } from '@/components/planets/PlanetOrb';
import { DataBadge } from '@/components/shared/DataBadge';
import { DataList } from '@/components/shared/DataList';
import { NasaImageStrip } from '@/components/shared/NasaImageStrip';
import { SourceList } from '@/components/shared/SourceList';
import { tabPanelProps, Tabs } from '@/components/shared/Tabs';
import { useDeviceTier } from '@/hooks/useDevice';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { getBody, getMoonsOf } from '@/services/nasa/planetaryData';
import { formatKm } from '@/utils/format';
import NotFoundPage from './NotFoundPage';

const BodyScene = lazy(() => import('@/components/space/BodyScene'));

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'physical', label: 'Physical Properties' },
  { id: 'atmosphere', label: 'Atmosphere' },
  { id: 'orbit', label: 'Orbit' },
  { id: 'moons', label: 'Moons' },
  { id: 'missions', label: 'Missions' },
  { id: 'images', label: 'Images' },
  { id: 'sources', label: 'Sources' },
];

export default function PlanetDetailPage() {
  const { id } = useParams();
  const body = getBody(id);
  const { reduced } = useMotionPreference();
  const tier = useDeviceTier();
  const [tab, setTab] = useState('overview');
  useEffect(() => setTab('overview'), [id]);

  if (!body) return <NotFoundPage what="world" />;

  const parent = getBody(body.parent);
  const catalogMoons = getMoonsOf(body.id);
  const tabs = body.kind === 'planet' ? TABS : TABS.filter((t) => t.id !== 'moons');

  return (
    <article>
      <section className="relative h-[78svh] min-h-[520px] overflow-hidden">
        <Suspense fallback={<div className="css-starfield absolute inset-0" />}>
          <BodyScene
            key={body.id}
            visual={body.visual}
            moons={catalogMoons}
            reduced={reduced}
            tier={tier}
            label={`Procedural 3D rendering of ${body.name}${catalogMoons.length ? ` with ${catalogMoons.map((m) => m.name).join(', ')}` : ''}. Drag to rotate.`}
          />
        </Suspense>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-void via-void/70 to-transparent" aria-hidden />
        <div className="container-cosmos pointer-events-none relative flex h-full flex-col justify-end pb-10">
          <div className="pointer-events-auto">
            <Link to={parent ? `/planets/${parent.id}` : '/planets'} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted hover:text-stellar">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {parent ? parent.name : 'All planets'}
            </Link>
            <p className="eyebrow mt-6">{body.kind === 'moon' ? `Moon of ${parent?.name}` : body.kind === 'star' ? 'Star' : 'Planet'}</p>
            <motion.h1
              className="display mt-3 text-6xl sm:text-8xl"
              initial={reduced ? false : { opacity: 0, y: 30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {body.name}
            </motion.h1>
            <p className="mt-4 max-w-xl text-stellar/80">{body.tagline}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <DataBadge provenance="curated" source="NASA fact sheets" />
              <span className="chip">Rendering: procedural artistic</span>
              <Link to={`/explore?focus=${body.id}`} className="chip hover:text-stellar">
                <Telescope className="h-3 w-3" aria-hidden /> Locate in explorer
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container-cosmos mt-8">
        <Tabs tabs={tabs} active={tab} onChange={setTab} label={`${body.name} information`} idBase="body" />
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            {...tabPanelProps('body', tab)}
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="py-10 focus:outline-none"
          >
            {tab === 'overview' && (
              <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
                <div>
                  <p className="font-serif text-2xl leading-relaxed text-stellar/90 sm:text-3xl">{body.overview}</p>
                  <h2 className="data-label mt-10">Scientific discoveries</h2>
                  <ul className="mt-4 space-y-3">
                    {body.discoveries.map((d) => (
                      <li key={d} className="flex gap-3 text-sm leading-relaxed text-stellar/85">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cyan-cosmic" aria-hidden />
                        {d}
                      </li>
                    ))}
                  </ul>
                  {body.uncertainties && body.uncertainties.length > 0 && (
                    <div className="mt-8 border-l-2 border-gold/50 pl-4">
                      <h2 className="data-label text-gold">Open questions & uncertainty</h2>
                      <ul className="mt-2 space-y-2 text-sm text-muted">
                        {body.uncertainties.map((u) => (
                          <li key={u}>{u}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <DataList
                  columns={1}
                  items={[
                    { label: 'Diameter', value: `${body.physical.diameterKm.toLocaleString('en-US')} km` },
                    { label: 'Mass', value: body.physical.mass },
                    { label: body.kind === 'moon' ? 'Mean distance from parent' : 'Mean distance', value: body.orbit.meanDistance, estimate: body.kind === 'star' },
                    { label: 'Temperature', value: body.temperature },
                  ]}
                />
              </div>
            )}

            {tab === 'physical' && (
              <DataList
                columns={3}
                items={[
                  { label: 'Diameter', value: `${body.physical.diameterKm.toLocaleString('en-US')} km`, note: formatKm(body.physical.diameterKm) },
                  { label: 'Mass', value: body.physical.mass },
                  { label: 'Surface gravity', value: body.physical.gravity ?? 'Not available' },
                  { label: 'Mean density', value: body.physical.density ?? 'Not available' },
                  { label: 'Temperature', value: body.temperature },
                  { label: 'Axial tilt', value: `${body.visual.tiltDeg}°` },
                ]}
              />
            )}

            {tab === 'atmosphere' && (
              <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
                <p className="font-serif text-2xl leading-relaxed text-stellar/90">{body.atmosphere.summary}</p>
                <div>
                  <h2 className="data-label mb-4">Composition</h2>
                  <ul className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
                    {body.atmosphere.composition.map((c) => (
                      <li key={c.gas} className="flex items-baseline justify-between gap-6 py-3 text-sm">
                        <span>{c.gas}</span>
                        <span className="font-mono text-cyan-cosmic">{c.share}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-muted">Shares are approximate, by volume unless noted.</p>
                </div>
              </div>
            )}

            {tab === 'orbit' && (
              <DataList
                columns={2}
                items={[
                  { label: body.kind === 'moon' ? 'Mean distance from parent' : 'Mean distance from the Sun', value: body.orbit.meanDistance },
                  { label: 'Orbital period', value: body.orbit.orbitalPeriod },
                  { label: 'Rotation period', value: body.orbit.rotationPeriod },
                  { label: 'Orbital eccentricity', value: body.orbit.eccentricity ?? 'Not available' },
                ]}
              />
            )}

            {tab === 'moons' && body.moons && (
              <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
                <div>
                  <p className="data-label">Confirmed moons</p>
                  <p className="mt-2 font-serif text-8xl leading-none">{body.moons.count ?? '—'}</p>
                  <p className="mt-3 text-sm text-muted">
                    Source: {body.moons.countSource}, as of {body.moons.countAsOf}. Counts change as new moons are confirmed.
                  </p>
                </div>
                <div>
                  {body.moons.notable.length > 0 ? (
                    <>
                      <p className="data-label mb-3">Notable moons</p>
                      <ul className="flex flex-wrap gap-2">
                        {body.moons.notable.map((n) => {
                          const m = catalogMoons.find((c) => c.name === n || c.name === `The ${n}`);
                          return (
                            <li key={n}>
                              {m ? (
                                <Link to={`/planets/${m.id}`} className="chip normal-case tracking-normal text-stellar hover:border-cyan-cosmic/50">
                                  <PlanetOrb visual={m.visual} size={14} /> {n} →
                                </Link>
                              ) : (
                                <span className="chip normal-case tracking-normal">{n}</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  ) : (
                    <p className="text-muted">{body.name} has no known moons.</p>
                  )}
                </div>
              </div>
            )}

            {tab === 'missions' && (
              <ol className="relative space-y-8 border-l border-white/10 pl-6">
                {body.missions.map((m) => (
                  <li key={m.name} className="relative">
                    <span className="absolute -left-[29px] top-1.5 h-2 w-2 rounded-full bg-cyan-cosmic shadow-[0_0_10px_#64E8FF]" aria-hidden />
                    <p className="font-mono text-xs text-muted">
                      {m.years} · {m.agency}
                    </p>
                    <p className="mt-1 font-serif text-2xl">{m.name}</p>
                    <p className="mt-1 text-sm text-muted">{m.note}</p>
                  </li>
                ))}
              </ol>
            )}

            {tab === 'images' && <NasaImageStrip query={body.imageQuery} count={9} />}

            {tab === 'sources' && (
              <div className="grid gap-10 md:grid-cols-2">
                <SourceList sources={body.sources} />
                <p className="text-sm leading-relaxed text-muted">
                  Values are taken from NASA planetary fact sheets and NASA Science pages and rounded for display. The 3D rendering above is procedural
                  and artistic; it is not a photograph and is not to scale.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </article>
  );
}
