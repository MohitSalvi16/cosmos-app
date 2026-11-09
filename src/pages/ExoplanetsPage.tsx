import { motion } from 'framer-motion';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EMPTY_FILTERS, ExoplanetFiltersBar, SORT_LABELS, type FilterDraft } from '@/components/exoplanets/ExoplanetFiltersBar';
import { DataBadge } from '@/components/shared/DataBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '@/components/shared/States';
import { useDebounce } from '@/hooks/useDebounce';
import { useExoplanetList } from '@/hooks/useExoplanetList';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import type { ExoplanetFilters, ExoplanetSort } from '@/types';
import { formatDistancePc, formatNumber, formatPeriodDays, formatText, PC_TO_LY } from '@/utils/format';

function draftFromParams(p: URLSearchParams): FilterDraft {
  const sort = p.get('sort') as ExoplanetSort | null;
  return {
    name: p.get('q') ?? '',
    method: p.get('method') ?? '',
    yearMin: p.get('from') ?? '',
    yearMax: p.get('to') ?? '',
    maxDistanceLy: p.get('maxly') ?? '',
    sort: sort && sort in SORT_LABELS ? sort : EMPTY_FILTERS.sort,
  };
}

function paramsFromDraft(d: FilterDraft): Record<string, string> {
  const out: Record<string, string> = {};
  if (d.name) out.q = d.name;
  if (d.method) out.method = d.method;
  if (d.yearMin) out.from = d.yearMin;
  if (d.yearMax) out.to = d.yearMax;
  if (d.maxDistanceLy) out.maxly = d.maxDistanceLy;
  if (d.sort !== EMPTY_FILTERS.sort) out.sort = d.sort;
  return out;
}

export function toFilters(d: FilterDraft): ExoplanetFilters {
  const num = (s: string) => (s.trim() === '' ? undefined : Number(s));
  const ly = num(d.maxDistanceLy);
  return {
    name: d.name.trim() || undefined,
    method: d.method || undefined,
    yearMin: num(d.yearMin),
    yearMax: num(d.yearMax),
    maxDistancePc: ly !== undefined && Number.isFinite(ly) ? ly / PC_TO_LY : undefined,
  };
}

export default function ExoplanetsPage() {
  const [params, setParams] = useSearchParams();
  const draft = draftFromParams(params);
  const { reduced } = useMotionPreference();
  // Debounce the serialized query string (a stable primitive) rather than the draft object.
  const debouncedQs = useDebounce(params.toString(), 400);
  const debouncedDraft = useMemo(() => draftFromParams(new URLSearchParams(debouncedQs)), [debouncedQs]);
  const filters = useMemo(() => toFilters(debouncedDraft), [debouncedDraft]);
  const list = useExoplanetList(filters, debouncedDraft.sort);

  return (
    <>
      <PageHeader
        eyebrow="Exoplanets"
        title={
          <>
            Worlds around <em className="text-cyan-cosmic">other suns.</em>
          </>
        }
        intro="Search confirmed exoplanets directly from the NASA Exoplanet Archive’s Planetary Systems Composite Parameters table. Every value shown is from the archive; missing measurements are shown as “Not available”."
      >
        <DataBadge provenance="live" meta={list.meta} source="NASA Exoplanet Archive" />
        {list.total !== null && (
          <span className="chip">
            <span className="font-mono text-stellar">{list.total.toLocaleString('en-US')}</span> matching planets
          </span>
        )}
      </PageHeader>

      <section className="container-cosmos" aria-label="Exoplanet search">
        <ExoplanetFiltersBar value={draft} onChange={(d) => setParams(paramsFromDraft(d), { replace: true })} />
        {debouncedDraft.sort.startsWith('distance') && (
          <p className="mt-3 text-xs text-muted">Sorting by distance excludes planets without a measured system distance.</p>
        )}
        {debouncedDraft.sort.startsWith('period') && <p className="mt-3 text-xs text-muted">Sorting by orbital period excludes planets without a measured period.</p>}

        <div className="mt-8" aria-live="polite" aria-busy={list.loading}>
          {list.error ? (
            <ErrorState error={list.error} onRetry={list.retry} context="Could not load exoplanets from the NASA Exoplanet Archive." />
          ) : list.loading ? (
            <div className="space-y-px">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : list.rows.length === 0 ? (
            <EmptyState title="No confirmed exoplanets match these filters." hint="Try widening the year range or removing the distance limit." />
          ) : (
            <>
              <div className="scrollbar-thin overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <caption className="sr-only">Confirmed exoplanets, sorted by {SORT_LABELS[debouncedDraft.sort]}</caption>
                  <thead>
                    <tr className="border-b border-white/10">
                      {['Planet', 'Host star', 'Method', 'Year', 'Radius (R⊕)', 'Mass (M⊕)', 'Orbital period', 'Distance', 'Eq. temp.', 'Facility'].map((h) => (
                        <th key={h} scope="col" className="data-label whitespace-nowrap py-3 pr-4 font-normal">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {list.rows.map((p, i) => (
                      <motion.tr
                        key={p.pl_name}
                        initial={reduced ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.35, delay: reduced ? 0 : Math.min(i % 30, 12) * 0.02 }}
                        className="group border-b border-white/[0.05] hover:bg-white/[0.02]"
                      >
                        <th scope="row" className="py-3 pr-4 font-normal">
                          <Link to={`/exoplanets/${encodeURIComponent(p.pl_name)}`} className="inline-flex items-center gap-1 font-mono text-stellar hover:text-cyan-cosmic">
                            {p.pl_name}
                            <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" aria-hidden />
                          </Link>
                        </th>
                        <td className="py-3 pr-4 text-muted">{formatText(p.hostname)}</td>
                        <td className="py-3 pr-4 text-muted">{formatText(p.discoverymethod)}</td>
                        <td className="py-3 pr-4 font-mono">{p.disc_year ?? 'Not available'}</td>
                        <td className="py-3 pr-4 font-mono">{formatNumber(p.pl_rade, 2)}</td>
                        <td className="py-3 pr-4 font-mono">{formatNumber(p.pl_bmasse, 2)}</td>
                        <td className="py-3 pr-4 font-mono">{formatPeriodDays(p.pl_orbper)}</td>
                        <td className="py-3 pr-4 font-mono text-xs">{formatDistancePc(p.sy_dist)}</td>
                        <td className="py-3 pr-4 font-mono">{p.pl_eqt === null ? 'Not available' : `${formatNumber(p.pl_eqt, 0)} K`}</td>
                        <td className="py-3 pr-4 text-xs text-muted">{formatText(p.disc_facility)}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
                <span>
                  Showing {list.rows.length.toLocaleString('en-US')}
                  {list.total !== null ? ` of ${list.total.toLocaleString('en-US')}` : ''} planets
                </span>
                {list.hasMore && (
                  <button type="button" onClick={list.loadMore} disabled={list.loadingMore} className="btn-ghost">
                    {list.loadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                    {list.loadingMore ? 'Loading' : 'Load more'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-muted">
          Data: NASA Exoplanet Archive, Planetary Systems Composite Parameters (pscomppars), queried live via the archive’s TAP service. Composite rows combine
          values from multiple publications, so individual parameters may come from different studies. Some masses are estimated from mass–radius relations;
          see each planet’s page for provenance.
        </p>
      </section>
    </>
  );
}
