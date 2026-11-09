import { ExternalLink, ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ApproachChart } from '@/components/asteroids/ApproachChart';
import { DataBadge } from '@/components/shared/DataBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '@/components/shared/States';
import { useAsync } from '@/hooks/useAsync';
import { fetchNeoFeed, NEO_MAX_RANGE_DAYS } from '@/services/nasa/neo';
import type { NeoApproach } from '@/types';
import { addDays, clamp, formatDate, toIsoDate } from '@/utils/format';

type SortKey = 'date' | 'distance' | 'size' | 'velocity';

export default function AsteroidsPage() {
  const today = toIsoDate(new Date());
  const [start, setStart] = useState(today);
  const [days, setDays] = useState(3);
  const [hazardOnly, setHazardOnly] = useState(false);
  const [minSize, setMinSize] = useState(0);
  const [sort, setSort] = useState<SortKey>('date');
  const [selected, setSelected] = useState<string | null>(null);
  const end = addDays(start, clamp(days, 1, NEO_MAX_RANGE_DAYS) - 1);

  const { data, error, loading, reload } = useAsync((signal) => fetchNeoFeed(start, end, signal), [start, end]);

  const rows = useMemo(() => {
    const list = (data?.data ?? []).filter((n) => (!hazardOnly || n.hazardous) && n.diameterMaxM >= minSize);
    const by: Record<SortKey, (a: NeoApproach, b: NeoApproach) => number> = {
      date: (a, b) => a.epochMs - b.epochMs,
      distance: (a, b) => a.missKm - b.missKm,
      size: (a, b) => b.diameterMaxM - a.diameterMaxM,
      velocity: (a, b) => b.velocityKmS - a.velocityKmS,
    };
    return [...list].sort(by[sort]);
  }, [data, hazardOnly, minSize, sort]);

  const hazardousCount = data?.data.filter((d) => d.hazardous).length ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Asteroids & near-Earth objects"
        title={
          <>
            Close encounters, <em className="text-cyan-cosmic">this week.</em>
          </>
        }
        intro="Asteroids passing near Earth, as reported by NASA’s Near Earth Object Web Service (NeoWs), which draws on data from the Center for Near Earth Object Studies at JPL."
      >
        <DataBadge provenance="live" meta={data?.meta} source="NASA NeoWs" />
      </PageHeader>

      <section className="container-cosmos" aria-label="Asteroid close approaches">
        <div className="glass mb-6 flex gap-3 p-4 text-sm text-muted">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
          <p>
            <span className="text-stellar">“Potentially hazardous” does not mean an asteroid will hit Earth.</span> It is a classification for objects larger than
            roughly 140 m whose orbits come within 0.05 AU (~7.5 million km, about 19 lunar distances) of Earth’s orbit, so they are monitored closely. Impact risk
            assessments are published separately by NASA’s CNEOS Sentry system.
          </p>
        </div>

        <form className="glass grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end" onSubmit={(e) => e.preventDefault()} aria-label="Filter close approaches">
          <label className="block">
            <span className="data-label">Start date</span>
            <input type="date" className="input mt-1.5 [color-scheme:dark]" value={start} onChange={(e) => e.target.value && setStart(e.target.value)} />
          </label>
          <label className="block">
            <span className="data-label">Range</span>
            <select className="input mt-1.5" value={days} onChange={(e) => setDays(Number(e.target.value))}>
              {[1, 2, 3, 5, 7].map((d) => (
                <option key={d} value={d} className="bg-void">
                  {d} day{d > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="data-label">Min. size (max est. diameter)</span>
            <select className="input mt-1.5" value={minSize} onChange={(e) => setMinSize(Number(e.target.value))}>
              {[0, 50, 140, 500, 1000].map((m) => (
                <option key={m} value={m} className="bg-void">
                  {m === 0 ? 'Any size' : `≥ ${m} m`}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="data-label">Sort</span>
            <select className="input mt-1.5" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="date" className="bg-void">
                Approach time
              </option>
              <option value="distance" className="bg-void">
                Miss distance (closest)
              </option>
              <option value="size" className="bg-void">
                Size (largest)
              </option>
              <option value="velocity" className="bg-void">
                Velocity (fastest)
              </option>
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-3 py-2.5 text-sm">
            <input type="checkbox" className="accent-cyan-cosmic" checked={hazardOnly} onChange={(e) => setHazardOnly(e.target.checked)} />
            Potentially hazardous only
          </label>
        </form>

        <p className="mt-4 text-xs text-muted">
          Showing {formatDate(start)} – {formatDate(end)} · NeoWs returns up to {NEO_MAX_RANGE_DAYS} days per request.
          {data && ` ${data.data.length} approaches, ${hazardousCount} by objects classified potentially hazardous.`}
        </p>

        <div className="mt-8" aria-live="polite" aria-busy={loading}>
          {error ? (
            <ErrorState error={error} onRetry={reload} context="Could not load close approaches from NASA NeoWs." />
          ) : loading ? (
            <Skeleton className="h-[340px] w-full" />
          ) : rows.length === 0 ? (
            <EmptyState title="No approaches match these filters." hint="Try another date range or remove the size filter." />
          ) : (
            <>
              <ApproachChart data={rows} onSelect={setSelected} selectedId={selected} />
              <div className="scrollbar-thin mt-10 overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <caption className="sr-only">Asteroid close approaches with diameter, date, velocity, miss distance and hazard classification</caption>
                  <thead>
                    <tr className="border-b border-white/10">
                      {['Asteroid', 'Est. diameter', 'Close approach (UTC)', 'Relative velocity', 'Miss distance', 'Hazard classification', 'Source'].map((h) => (
                        <th key={h} scope="col" className="data-label whitespace-nowrap py-3 pr-4 font-normal">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((n) => (
                      <tr
                        key={n.id + n.epochMs}
                        className={`border-b border-white/[0.05] ${selected === n.id ? 'bg-white/[0.05]' : 'hover:bg-white/[0.02]'}`}
                        onClick={() => setSelected(n.id)}
                      >
                        <th scope="row" className="py-3 pr-4 font-mono font-normal">
                          {n.name}
                          {n.sentry && <span className="ml-2 text-[10px] uppercase tracking-wider text-gold">Sentry</span>}
                        </th>
                        <td className="py-3 pr-4 font-mono text-xs">
                          {Math.round(n.diameterMinM).toLocaleString('en-US')}–{Math.round(n.diameterMaxM).toLocaleString('en-US')} m
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted">{n.approachDateFull ?? n.approachDate}</td>
                        <td className="py-3 pr-4 font-mono text-xs">{n.velocityKmS.toFixed(2)} km/s</td>
                        <td className="py-3 pr-4 font-mono text-xs">
                          {Math.round(n.missKm).toLocaleString('en-US')} km
                          <span className="block text-muted">{n.missLunar.toFixed(1)} LD</span>
                        </td>
                        <td className="py-3 pr-4 text-xs">{n.hazardous ? <span className="text-[#ff8a5c]">Potentially hazardous</span> : <span className="text-muted">Not hazardous</span>}</td>
                        <td className="py-3 pr-4">
                          <a href={n.jplUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-cyan-cosmic hover:text-stellar" onClick={(e) => e.stopPropagation()}>
                            JPL SBDB <ExternalLink className="h-3 w-3" aria-hidden />
                            <span className="sr-only">record for {n.name} (opens in a new tab)</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        <p className="mt-6 text-xs text-muted">
          Diameters are estimated from absolute magnitude assuming a range of surface reflectivities, so true sizes may differ. LD = lunar distance (~384,400 km).
        </p>
      </section>
    </>
  );
}
