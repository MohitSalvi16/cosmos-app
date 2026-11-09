import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, Telescope } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '@/components/hero/Hero';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { DataBadge } from '@/components/shared/DataBadge';
import { Reveal } from '@/components/shared/Reveal';
import { ErrorState, Skeleton } from '@/components/shared/States';
import { useAsync } from '@/hooks/useAsync';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { apodDisplayImage, fetchApod } from '@/services/nasa/apod';
import { fetchExoplanetCount, fetchExoplanetPage } from '@/services/nasa/exoplanets';
import { fetchNeoFeed } from '@/services/nasa/neo';
import { formatDate, formatDistancePc, toIsoDate } from '@/utils/format';

gsap.registerPlugin(ScrollTrigger);

const SECTIONS = [
  { to: '/planets', title: 'Planets', text: 'Eight worlds, the Sun and remarkable moons — with fact-sheet data and mission history.', tag: 'Curated', accent: '#FFC878' },
  { to: '/exoplanets', title: 'Exoplanets', text: 'Search thousands of confirmed worlds around other stars, straight from the NASA Exoplanet Archive.', tag: 'Live', accent: '#64E8FF' },
  { to: '/galaxies', title: 'Galaxies', text: 'From our Milky Way to the giant elliptical M87 — island universes across millions of light-years.', tag: 'Curated', accent: '#6E44FF' },
  { to: '/stars', title: 'Stars', text: 'Red dwarfs, blue supergiants and the North Star: the engines of the cosmos.', tag: 'Curated', accent: '#FFC878' },
  { to: '/black-holes', title: 'Black Holes', text: 'Event horizons, accretion disks and the first images of Sagittarius A* and M87*.', tag: 'Curated', accent: '#ff8a5c' },
  { to: '/asteroids', title: 'Asteroids', text: 'Near-Earth objects making close approaches this week, from NASA NeoWs.', tag: 'Live', accent: '#64E8FF' },
  { to: '/gallery', title: 'NASA Gallery', text: 'Search NASA’s image and video library and today’s Astronomy Picture of the Day.', tag: 'Live', accent: '#64E8FF' },
];

function LiveExoplanetStat() {
  const { data, error } = useAsync((signal) => fetchExoplanetCount({}, undefined, signal), []);
  if (error) return <span className="text-muted">—</span>;
  if (data === undefined) return <Skeleton className="inline-block h-12 w-40 align-middle" />;
  return <AnimatedNumber value={data} />;
}

function ApodCard() {
  const { data, error, loading, reload } = useAsync((signal) => fetchApod(undefined, signal), []);
  if (error) return <ErrorState error={error} onRetry={reload} context="Astronomy Picture of the Day is unavailable." />;
  if (loading || !data) return <Skeleton className="aspect-[16/10] w-full" />;
  const apod = data.data;
  const img = apodDisplayImage(apod);
  return (
    <Link to="/gallery#apod" className="group relative block overflow-hidden border border-white/10">
      {img ? (
        <img src={img} alt={apod.title} loading="lazy" className="aspect-[16/10] w-full object-cover transition duration-[1.6s] group-hover:scale-[1.03]" />
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center bg-abyss text-sm text-muted">Today’s APOD is a {apod.media_type} — open the gallery to view it.</div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void via-void/80 to-transparent p-5 pt-16">
        <DataBadge provenance="live" meta={data.meta} />
        <p className="mt-3 font-serif text-2xl leading-tight">{apod.title}</p>
        <p className="mt-1 text-xs text-muted">
          {formatDate(apod.date, { dateStyle: 'long' })}
          {apod.copyright ? ` · © ${apod.copyright.trim()}` : ''}
        </p>
      </div>
    </Link>
  );
}

function NeoToday() {
  const today = toIsoDate(new Date());
  const { data, error, reload } = useAsync((signal) => fetchNeoFeed(today, today, signal), [today]);
  if (error) return <ErrorState error={error} onRetry={reload} context="NASA NeoWs is unavailable." />;
  if (!data) return <Skeleton className="h-40 w-full" />;
  const list = data.data;
  const closest = [...list].sort((a, b) => a.missLunar - b.missLunar)[0];
  return (
    <Link to="/asteroids" className="glass group block p-6 transition hover:border-cyan-cosmic/40">
      <DataBadge provenance="live" meta={data.meta} />
      <p className="mt-5 font-serif text-6xl leading-none">
        <AnimatedNumber value={list.length} />
      </p>
      <p className="mt-2 text-sm text-muted">near-Earth objects make a close approach today ({formatDate(today)}).</p>
      {closest && (
        <p className="mt-4 text-sm text-stellar/85">
          Closest: <span className="font-mono">{closest.name}</span> at {closest.missLunar.toFixed(1)} lunar distances.
        </p>
      )}
      <span className="mt-5 inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-cyan-cosmic">
        Track approaches <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </span>
    </Link>
  );
}

function LatestExoplanets() {
  const { data, error, reload } = useAsync((signal) => fetchExoplanetPage({}, 'disc_year_desc', undefined, signal, 5), []);
  if (error) return <ErrorState error={error} onRetry={reload} context="NASA Exoplanet Archive is unavailable." />;
  if (!data) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="glass p-6">
      <DataBadge provenance="live" meta={data.meta} />
      <p className="mt-5 data-label">Recently confirmed worlds</p>
      <ul className="mt-3 divide-y divide-white/[0.06]">
        {data.data.rows.map((p) => (
          <li key={p.pl_name}>
            <Link to={`/exoplanets/${encodeURIComponent(p.pl_name)}`} className="flex items-baseline justify-between gap-4 py-2.5 text-sm hover:text-cyan-cosmic">
              <span className="font-mono">{p.pl_name}</span>
              <span className="text-xs text-muted">
                {p.disc_year} · {p.discoverymethod}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HomePage() {
  const root = useRef<HTMLDivElement>(null);
  const { reduced } = useMotionPreference();

  // Scroll-linked parallax for decorative layers (disabled for reduced motion).
  useLayoutEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
        const speed = Number(el.dataset.parallax ?? 0.2);
        gsap.fromTo(el, { yPercent: speed * 40 }, { yPercent: -speed * 40, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <div ref={root}>
      <Hero dataAnchor="nasa-data" />

      <section className="container-cosmos relative overflow-hidden py-28 sm:py-40" aria-labelledby="scale-title">
        <div data-parallax="0.6" className="pointer-events-none absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-nebula/20 blur-[120px]" aria-hidden />
        <div data-parallax="0.3" className="pointer-events-none absolute -right-20 bottom-0 h-[320px] w-[320px] rounded-full bg-cyan-cosmic/10 blur-[110px]" aria-hidden />
        <Reveal>
          <p className="eyebrow">A sense of scale</p>
          <h2 id="scale-title" className="display mt-5 max-w-4xl text-4xl sm:text-6xl">
            Light leaving the Sun reaches Earth in about eight minutes. From Andromeda, it set out <em className="text-gold">2.5 million years</em> ago.
          </h2>
        </Reveal>
        <dl className="mt-20 grid grid-cols-2 gap-y-12 lg:grid-cols-4">
          <Reveal delay={0.05}>
            <dt className="data-label">Planets in our Solar System</dt>
            <dd className="mt-3 font-serif text-6xl">
              <AnimatedNumber value={8} />
            </dd>
          </Reveal>
          <Reveal delay={0.1}>
            <dt className="data-label flex items-center gap-2">
              Confirmed exoplanets <span className="text-cyan-cosmic">· live</span>
            </dt>
            <dd className="mt-3 font-serif text-6xl">
              <LiveExoplanetStat />
            </dd>
          </Reveal>
          <Reveal delay={0.15}>
            <dt className="data-label">Age of the Sun (approx.)</dt>
            <dd className="mt-3 font-serif text-6xl">
              <AnimatedNumber value={4.6} decimals={1} />
              <span className="ml-2 text-2xl text-muted">bn yrs</span>
            </dd>
          </Reveal>
          <Reveal delay={0.2}>
            <dt className="data-label">Age of the universe (approx.)</dt>
            <dd className="mt-3 font-serif text-6xl">
              <AnimatedNumber value={13.8} decimals={1} />
              <span className="ml-2 text-2xl text-muted">bn yrs</span>
            </dd>
          </Reveal>
        </dl>
      </section>

      <section className="container-cosmos" aria-labelledby="sections-title">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Explore</p>
            <h2 id="sections-title" className="display mt-4 text-4xl sm:text-5xl">
              Choose a destination
            </h2>
          </div>
          <Link to="/explore" className="btn-ghost">
            <Telescope className="h-4 w-4" aria-hidden /> Open the 3D explorer
          </Link>
        </Reveal>
        <ul className="mt-12 grid gap-px border border-white/[0.06] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s, i) => (
            <li key={s.to} className="bg-void">
              <Reveal delay={(i % 3) * 0.06} className="h-full">
                <Link to={s.to} className="group relative flex h-full min-h-[220px] flex-col justify-between overflow-hidden p-7 transition-colors hover:bg-white/[0.02]">
                  <span
                    className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-60"
                    style={{ background: s.accent }}
                    aria-hidden
                  />
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</span>
                    <span className={`chip ${s.tag === 'Live' ? 'text-cyan-cosmic' : 'text-gold'}`}>{s.tag}</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-3xl transition-transform duration-500 group-hover:translate-x-1">{s.title}</h3>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{s.text}</p>
                  </div>
                  <ArrowUpRight className="absolute bottom-7 right-7 h-5 w-5 text-muted transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-stellar" aria-hidden />
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section id="nasa-data" className="container-cosmos scroll-mt-24 pt-32" aria-labelledby="live-title">
        <Reveal>
          <p className="eyebrow">Live from NASA</p>
          <h2 id="live-title" className="display mt-4 max-w-3xl text-4xl sm:text-5xl">
            Real data, fetched as you arrive.
          </h2>
          <p className="mt-4 max-w-2xl text-muted">
            These panels query NASA services in real time (through a small caching proxy). Each shows its source and when it was last updated.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Reveal>
            <ApodCard />
          </Reveal>
          <div className="grid gap-6">
            <Reveal delay={0.08}>
              <NeoToday />
            </Reveal>
            <Reveal delay={0.14}>
              <LatestExoplanets />
            </Reveal>
          </div>
        </div>
        <p className="mt-6 text-xs text-muted">
          The Exoplanet Archive reports distances in parsecs; COSMOS also shows light-years (e.g. the Proxima Centauri system is {formatDistancePc(1.30119)}).
        </p>
      </section>
    </div>
  );
}
