import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { DataBadge } from '@/components/shared/DataBadge';
import { DataList } from '@/components/shared/DataList';
import { NasaImageStrip } from '@/components/shared/NasaImageStrip';
import { Reveal } from '@/components/shared/Reveal';
import { ErrorState, LoadingState } from '@/components/shared/States';
import { useAsync } from '@/hooks/useAsync';
import { archiveOverviewUrl, fetchExoplanetDetail } from '@/services/nasa/exoplanets';
import type { ExoplanetDetailRow } from '@/types';
import { formatDistancePc, formatNumber, formatPeriodDays, formatText, NOT_AVAILABLE } from '@/utils/format';
import NotFoundPage from './NotFoundPage';

const EARTH_R = 1;
const JUPITER_R = 11.21; // Jupiter's equatorial radius in Earth radii

/** Side-by-side size comparison with Earth and Jupiter (to scale with each other). */
function SizeComparison({ radius }: { radius: number | null }) {
  if (radius === null) return <p className="text-sm text-muted">Radius not available — size comparison cannot be drawn.</p>;
  const items = [
    { label: 'Earth', r: EARTH_R, color: '#4f8fe0' },
    { label: 'This planet', r: radius, color: '#64E8FF' },
    { label: 'Jupiter', r: JUPITER_R, color: '#d8b48a' },
  ];
  const max = Math.max(...items.map((i) => i.r));
  const H = 180;
  const scale = (H / 2 - 6) / max;
  let x = 0;
  const placed = items.map((i) => {
    const r = Math.max(i.r * scale, 1.5);
    const cx = x + r;
    x += r * 2 + 28;
    return { ...i, cx, rr: r };
  });
  return (
    <figure>
      <svg viewBox={`0 0 ${x} ${H + 30}`} className="h-auto w-full max-w-xl" role="img" aria-label={`Radius ${radius.toFixed(2)} Earth radii, compared with Earth and Jupiter`}>
        {placed.map((p) => (
          <g key={p.label}>
            <circle cx={p.cx} cy={H / 2} r={p.rr} fill={p.color} fillOpacity={p.label === 'This planet' ? 0.85 : 0.35} stroke={p.color} />
            <text x={p.cx} y={H + 22} textAnchor="middle" fill="#9AA3BD" fontSize="12" fontFamily="Inter">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 text-xs text-muted">Circles are drawn to scale relative to one another (radius only).</figcaption>
    </figure>
  );
}

function massNote(p: ExoplanetDetailRow): string | undefined {
  if (p.pl_bmasse === null) return undefined;
  const prov = p.pl_bmassprov ?? '';
  if (/m-r relationship/i.test(prov)) return 'Estimated from a mass–radius relationship, not directly measured.';
  if (/msini/i.test(prov)) return 'Minimum mass (M sin i) from radial velocity.';
  return prov ? `Provenance: ${prov}` : undefined;
}

export default function ExoplanetDetailPage() {
  const { name = '' } = useParams();
  const decoded = decodeURIComponent(name);
  const { data, error, loading, reload } = useAsync((signal) => fetchExoplanetDetail(decoded, signal), [decoded]);

  if (loading) return <LoadingState label={`Querying the NASA Exoplanet Archive for ${decoded}`} className="container-cosmos min-h-[60vh] pt-40" />;
  if (error)
    return (
      <div className="container-cosmos pt-40">
        <ErrorState error={error} onRetry={reload} context={`Could not load ${decoded} from the NASA Exoplanet Archive.`} />
      </div>
    );
  if (!data?.data) return <NotFoundPage what="exoplanet" />;
  const p = data.data;
  const mNote = massNote(p);

  return (
    <article className="container-cosmos pt-32">
      <Link to="/exoplanets" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted hover:text-stellar">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All exoplanets
      </Link>
      <Reveal>
        <p className="eyebrow mt-8">Exoplanet · {formatText(p.discoverymethod)}</p>
        <h1 className="display mt-3 break-words text-6xl sm:text-8xl">{p.pl_name}</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Orbiting {formatText(p.hostname)}
          {p.sy_dist !== null ? `, ${formatDistancePc(p.sy_dist)} from Earth` : ''}. Discovered in {p.disc_year ?? NOT_AVAILABLE} by {formatText(p.disc_facility)}.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <DataBadge provenance="live" meta={data.meta} />
          <a href={archiveOverviewUrl(p.pl_name)} target="_blank" rel="noopener noreferrer" className="chip hover:text-stellar">
            Archive record <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </div>
      </Reveal>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1.3fr_1fr]">
        <section aria-labelledby="planet-props">
          <h2 id="planet-props" className="data-label mb-4">
            Planet
          </h2>
          <DataList
            columns={2}
            items={[
              { label: 'Radius', value: p.pl_rade === null ? NOT_AVAILABLE : `${formatNumber(p.pl_rade)} R⊕`, note: p.pl_radj !== null ? `${formatNumber(p.pl_radj, 3)} R♃` : undefined },
              { label: 'Mass', value: p.pl_bmasse === null ? NOT_AVAILABLE : `${formatNumber(p.pl_bmasse)} M⊕`, note: mNote, estimate: Boolean(mNote && /estimated/i.test(mNote)) },
              { label: 'Orbital period', value: formatPeriodDays(p.pl_orbper) },
              { label: 'Semi-major axis', value: p.pl_orbsmax === null ? NOT_AVAILABLE : `${formatNumber(p.pl_orbsmax, 4)} AU` },
              { label: 'Eccentricity', value: formatNumber(p.pl_orbeccen, 3) },
              { label: 'Equilibrium temperature', value: p.pl_eqt === null ? NOT_AVAILABLE : `${formatNumber(p.pl_eqt, 0)} K` },
              { label: 'Insolation', value: p.pl_insol === null ? NOT_AVAILABLE : `${formatNumber(p.pl_insol)} × Earth` },
              { label: 'Discovery', value: `${p.disc_year ?? NOT_AVAILABLE} · ${formatText(p.discoverymethod)}`, note: p.disc_telescope ?? undefined },
            ]}
          />
        </section>
        <section aria-labelledby="size-title">
          <h2 id="size-title" className="data-label mb-4">
            Size comparison
          </h2>
          <SizeComparison radius={p.pl_rade} />
        </section>
      </div>

      <section className="mt-14" aria-labelledby="host-props">
        <h2 id="host-props" className="data-label mb-4">
          Host star & system
        </h2>
        <DataList
          columns={3}
          items={[
            { label: 'Host star', value: formatText(p.hostname) },
            { label: 'Spectral type', value: formatText(p.st_spectype) },
            { label: 'Effective temperature', value: p.st_teff === null ? NOT_AVAILABLE : `${formatNumber(p.st_teff, 0)} K` },
            { label: 'Stellar radius', value: p.st_rad === null ? NOT_AVAILABLE : `${formatNumber(p.st_rad)} R☉` },
            { label: 'Stellar mass', value: p.st_mass === null ? NOT_AVAILABLE : `${formatNumber(p.st_mass)} M☉` },
            { label: 'Distance from Earth', value: formatDistancePc(p.sy_dist) },
            { label: 'Stars in system', value: p.sy_snum ?? NOT_AVAILABLE },
            { label: 'Known planets in system', value: p.sy_pnum ?? NOT_AVAILABLE },
            { label: 'Sky position (RA / Dec)', value: p.rastr && p.decstr ? `${p.rastr} / ${p.decstr}` : NOT_AVAILABLE },
          ]}
        />
      </section>

      <section className="mt-14" aria-labelledby="exo-images">
        <h2 id="exo-images" className="data-label mb-4">
          Related NASA imagery
        </h2>
        <p className="mb-4 text-xs text-muted">Most exoplanets have never been directly imaged; results are keyword matches and frequently artist’s concepts — check each caption.</p>
        <NasaImageStrip query={p.hostname ?? p.pl_name} count={6} />
      </section>
    </article>
  );
}
