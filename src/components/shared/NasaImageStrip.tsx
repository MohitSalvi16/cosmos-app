import { ExternalLink, ImageOff } from 'lucide-react';
import { useAsync } from '@/hooks/useAsync';
import { searchNasaMedia } from '@/services/nasa/images';
import { DataBadge } from './DataBadge';
import { ErrorState, Skeleton } from './States';

/**
 * Shows authentic NASA Image Library results for a query. These are live search results — the
 * caption makes clear they are matches for a keyword, not a curated "official" image of the object.
 */
export function NasaImageStrip({ query, count = 6 }: { query: string; count?: number }) {
  const { data, error, loading, reload } = useAsync((signal) => searchNasaMedia({ q: query, pageSize: count }, signal), [query, count]);

  if (error) return <ErrorState error={error} onRetry={reload} context="NASA Image Library is unavailable right now." />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <DataBadge provenance="live" meta={data?.meta} source="NASA Image and Video Library" />
        <span className="text-xs text-muted">Keyword results for “{query}”.</span>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {loading &&
          Array.from({ length: count }, (_, i) => (
            <li key={i}>
              <Skeleton className="aspect-[4/3] w-full" />
            </li>
          ))}
        {!loading && data?.data.items.length === 0 && <li className="col-span-full text-sm text-muted">No NASA imagery found for this query.</li>}
        {!loading &&
          data?.data.items.map((item) => (
            <li key={item.nasaId} className="group">
              <a href={item.detailsUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden border border-white/10 focus-visible:outline-offset-0">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/3] w-full object-cover opacity-90 transition duration-700 group-hover:scale-[1.04] group-hover:opacity-100"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-white/[0.03] text-muted">
                    <ImageOff className="h-5 w-5" aria-hidden />
                  </div>
                )}
              </a>
              <p className="mt-2 line-clamp-2 text-xs text-stellar/90">{item.title}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                {item.credit ?? item.center ?? 'NASA'}
                <ExternalLink className="h-2.5 w-2.5" aria-hidden />
              </p>
            </li>
          ))}
      </ul>
    </div>
  );
}
