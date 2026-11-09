import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataBadge } from '@/components/shared/DataBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { Reveal } from '@/components/shared/Reveal';
import { useDeviceTier } from '@/hooks/useDevice';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { getGalaxies } from '@/services/nasa/galaxies';

const GalaxyScene = lazy(() => import('@/components/galaxies/GalaxyScene'));

export default function GalaxiesPage() {
  const galaxies = getGalaxies();
  const [activeId, setActiveId] = useState(galaxies[0]!.id);
  const active = galaxies.find((g) => g.id === activeId) ?? galaxies[0]!;
  const tier = useDeviceTier();
  const { reduced } = useMotionPreference();

  return (
    <>
      <PageHeader
        eyebrow="Galaxies"
        title={
          <>
            Island <em className="text-nebula">universes.</em>
          </>
        }
        intro="A curated selection of well-studied galaxies — from our own Milky Way to the giant elliptical M87. This is a hand-picked catalog, not a complete list: astronomers estimate the observable universe contains hundreds of billions of galaxies or more, and no public API offers an exhaustive census."
      >
        <DataBadge provenance="curated" source="NASA, NED & SIMBAD" />
      </PageHeader>

      <section className="container-cosmos grid gap-6 lg:grid-cols-[1.6fr_1fr]" aria-label="Galaxy visualizer">
        <div className="relative h-[460px] overflow-hidden border border-white/10 sm:h-[560px]">
          <Suspense fallback={<div className="css-starfield absolute inset-0" />}>
            <GalaxyScene galaxy={active} tier={tier} reduced={reduced} />
          </Suspense>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-void to-transparent p-5 pt-16">
            <AnimatePresence mode="wait">
              <motion.div key={active.id} initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0 }}>
                <p className="font-serif text-3xl">{active.name}</p>
                <p className="text-xs text-muted">
                  {active.classification} · procedural visualization (artistic)
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <ul className="grid content-start gap-px border border-white/[0.06] bg-white/[0.06]" aria-label="Choose a galaxy to visualize">
          {galaxies.map((g) => (
            <li key={g.id} className="bg-void">
              <button
                type="button"
                onClick={() => setActiveId(g.id)}
                aria-pressed={g.id === activeId}
                className={`flex w-full items-baseline justify-between gap-4 px-5 py-3.5 text-left transition ${g.id === activeId ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}
              >
                <span>
                  <span className={`block font-serif text-xl ${g.id === activeId ? 'text-cyan-cosmic' : ''}`}>{g.name}</span>
                  <span className="block text-xs text-muted">{g.identifiers.join(' · ')}</span>
                </span>
                <span className="shrink-0 text-right font-mono text-[11px] text-muted">{g.distance.split('(')[0]}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-cosmos mt-20" aria-labelledby="gal-list">
        <h2 id="gal-list" className="display text-4xl">
          The catalog
        </h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {galaxies.map((g, i) => (
            <li key={g.id}>
              <Reveal delay={(i % 2) * 0.06}>
                <Link to={`/galaxies/${g.id}`} className="glass group block p-6 transition hover:border-cyan-cosmic/30">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-serif text-3xl">{g.name}</p>
                      <p className="mt-1 text-xs text-muted">{g.identifiers.join(' · ')}</p>
                    </div>
                    <span
                      className="h-12 w-12 shrink-0 rounded-full blur-[2px]"
                      style={{ background: `radial-gradient(circle, ${g.visual.core} 0%, ${g.visual.outer}88 45%, transparent 72%)` }}
                      aria-hidden
                    />
                  </div>
                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted">{g.summary}</p>
                  <dl className="mt-5 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <dt className="data-label">Type</dt>
                      <dd className="mt-1 text-stellar/90">{g.classification}</dd>
                    </div>
                    <div>
                      <dt className="data-label">Distance</dt>
                      <dd className="mt-1 text-stellar/90">{g.distance}</dd>
                    </div>
                  </dl>
                  <span className="mt-5 inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-cyan-cosmic">
                    Details <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
