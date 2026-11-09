import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Crosshair, Eye, EyeOff, Pause, Play, RotateCcw, X } from 'lucide-react';
import { lazy, Suspense, useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SOLAR_SYSTEM } from '@/data/solarSystem';
import { DataBadge } from '@/components/shared/DataBadge';
import { ScaleNotice } from '@/components/shared/ScaleNotice';
import { useDeviceTier, useWebGLSupport } from '@/hooks/useDevice';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { getBody } from '@/services/nasa/planetaryData';
import { formatKm } from '@/utils/format';

// Heavy 3D modules are dynamically imported.
const SceneCanvas = lazy(() => import('@/components/space/SceneCanvas').then((m) => ({ default: m.SceneCanvas })));
const UniverseScene = lazy(() => import('@/components/space/UniverseScene').then((m) => ({ default: m.UniverseScene })));

export default function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const focus = params.get('focus');
  const selected = getBody(focus ?? undefined) ? focus : null;
  const [hovered, setHovered] = useState<string | null>(null);
  const { reduced } = useMotionPreference();
  const [paused, setPaused] = useState(reduced);
  const [labels, setLabels] = useState(true);
  const [resetToken, setResetToken] = useState(0);
  const tier = useDeviceTier();
  const webgl = useWebGLSupport();
  const body = getBody(selected ?? undefined);

  const select = useCallback(
    (id: string | null) => {
      setParams(id ? { focus: id } : {}, { replace: true });
    },
    [setParams],
  );

  const reset = () => {
    select(null);
    setResetToken((n) => n + 1);
  };

  return (
    <>
      <section className="relative h-[100svh] min-h-[600px] w-full overflow-hidden" aria-labelledby="explore-title">
        <Suspense fallback={<div className="css-starfield absolute inset-0" aria-hidden />}>
          <SceneCanvas
            className="absolute inset-0"
            label="Interactive 3D model of the Solar System. Use the object list below for an accessible alternative."
            camera={{ position: [0, 55, 118], fov: 50, near: 0.1, far: 4000 }}
            fallback={
              <div className="css-starfield absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted">
                3D view unavailable on this device (WebGL not supported). Use the object list below.
              </div>
            }
          >
            <UniverseScene
              selectedId={selected}
              hoveredId={hovered}
              onSelect={select}
              onHover={setHovered}
              paused={paused}
              showLabels={labels}
              resetToken={resetToken}
              tier={tier}
              reduced={reduced}
            />
          </SceneCanvas>
        </Suspense>

        <div className="pointer-events-none absolute inset-0 flex flex-col">
          <div className="container-cosmos pointer-events-none pt-24">
            <div className="pointer-events-auto max-w-sm">
              <p className="eyebrow">Universe explorer</p>
              <h1 id="explore-title" className="display mt-3 text-4xl sm:text-5xl">
                The Solar System
              </h1>
              <p className="mt-3 text-sm text-muted">Drag to orbit · scroll or pinch to zoom · tap a world to travel to it.</p>
              <div className="mt-4 hidden sm:block">
                <ScaleNotice compact />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="container-cosmos pointer-events-none mt-auto pb-6">
            <div className="pointer-events-auto glass flex flex-wrap items-center gap-2 p-2">
              <label className="sr-only" htmlFor="focus-select">
                Focus on object
              </label>
              <div className="flex items-center gap-2 px-2">
                <Crosshair className="h-4 w-4 text-cyan-cosmic" aria-hidden />
                <select
                  id="focus-select"
                  value={selected ?? ''}
                  onChange={(e) => select(e.target.value || null)}
                  className="bg-transparent py-1.5 text-sm text-stellar focus:outline-none"
                >
                  <option value="" className="bg-void">
                    Focus on…
                  </option>
                  {SOLAR_SYSTEM.map((b) => (
                    <option key={b.id} value={b.id} className="bg-void">
                      {b.kind === 'moon' ? `— ${b.name}` : b.name}
                    </option>
                  ))}
                </select>
              </div>
              <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" aria-hidden />
              <button type="button" onClick={reset} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-stellar/85 hover:text-cyan-cosmic">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset camera
              </button>
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-pressed={paused}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-stellar/85 hover:text-cyan-cosmic"
              >
                {paused ? <Play className="h-3.5 w-3.5" aria-hidden /> : <Pause className="h-3.5 w-3.5" aria-hidden />}
                {paused ? 'Resume orbits' : 'Pause orbits'}
              </button>
              <button
                type="button"
                onClick={() => setLabels((l) => !l)}
                aria-pressed={labels}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-stellar/85 hover:text-cyan-cosmic"
              >
                {labels ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
                {labels ? 'Hide labels' : 'Show labels'}
              </button>
            </div>
          </div>
        </div>

        {/* Selected object panel */}
        <AnimatePresence>
          {body && (
            <motion.aside
              key={body.id}
              initial={reduced ? false : { opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? undefined : { opacity: 0, x: 40 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="glass absolute bottom-24 right-4 top-24 z-10 w-[min(380px,calc(100vw-2rem))] overflow-y-auto p-6 sm:right-8"
              aria-live="polite"
              aria-label={`${body.name} summary`}
            >
              <button type="button" onClick={() => select(null)} className="absolute right-3 top-3 p-1 text-muted hover:text-stellar" aria-label="Close panel">
                <X className="h-4 w-4" />
              </button>
              <p className="eyebrow">{body.kind === 'moon' ? `Moon of ${getBody(body.parent)?.name ?? ''}` : body.kind}</p>
              <h2 className="mt-2 font-serif text-4xl">{body.name}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{body.tagline}</p>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-2">
                  <dt className="data-label">Diameter</dt>
                  <dd className="font-mono">{formatKm(body.physical.diameterKm)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-2">
                  <dt className="data-label">Mass</dt>
                  <dd className="font-mono">{body.physical.mass}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-2">
                  <dt className="data-label">{body.kind === 'moon' ? 'Distance from parent' : 'Distance'}</dt>
                  <dd className="text-right font-mono text-xs">{body.orbit.meanDistance}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-2">
                  <dt className="data-label">Orbital period</dt>
                  <dd className="text-right font-mono text-xs">{body.orbit.orbitalPeriod}</dd>
                </div>
              </dl>
              <div className="mt-5">
                <DataBadge provenance="curated" source="NASA fact sheets" />
              </div>
              <Link to={`/planets/${body.id}`} className="btn-primary mt-6 w-full">
                Open detail view <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </motion.aside>
          )}
        </AnimatePresence>
      </section>

      {/* Accessible alternative to the 3D scene */}
      <section className="container-cosmos pt-16" aria-labelledby="objects-title">
        <h2 id="objects-title" className="font-serif text-3xl">
          Objects in this scene
        </h2>
        <p className="mt-2 text-sm text-muted">
          {webgl ? 'A text alternative to the 3D view.' : 'The 3D view is not available on this device; all objects are listed here.'} Values are from NASA planetary fact sheets.
        </p>
        <div className="sm:hidden mt-4">
          <ScaleNotice compact />
        </div>
        <div className="scrollbar-thin mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Solar System objects with diameter, distance and orbital period</caption>
            <thead>
              <tr className="border-b border-white/10">
                {['Object', 'Type', 'Diameter', 'Mean distance', 'Orbital period', ''].map((h) => (
                  <th key={h} scope="col" className="data-label py-3 pr-4 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SOLAR_SYSTEM.map((b) => (
                <tr key={b.id} className="border-b border-white/[0.05]">
                  <th scope="row" className="py-3 pr-4 font-normal">
                    <Link to={`/planets/${b.id}`} className="link-underline">
                      {b.name}
                    </Link>
                  </th>
                  <td className="py-3 pr-4 capitalize text-muted">{b.kind === 'moon' ? `Moon of ${getBody(b.parent)?.name}` : b.kind}</td>
                  <td className="py-3 pr-4 font-mono">{formatKm(b.physical.diameterKm)}</td>
                  <td className="py-3 pr-4 text-muted">{b.orbit.meanDistance}</td>
                  <td className="py-3 pr-4 text-muted">{b.orbit.orbitalPeriod}</td>
                  <td className="py-3">
                    {webgl && (
                      <button
                        type="button"
                        onClick={() => {
                          select(b.id);
                          window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
                        }}
                        className="text-xs uppercase tracking-[0.16em] text-cyan-cosmic hover:text-stellar"
                      >
                        Focus<span className="sr-only"> {b.name} in 3D view</span>
                      </button>
                    )}
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
