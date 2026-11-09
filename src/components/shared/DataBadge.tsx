import { Database, Radio } from 'lucide-react';
import type { DataProvenance, FetchMeta } from '@/types';
import { relativeTime } from '@/utils/format';

/**
 * Labels where data on screen comes from. "Live" is only shown for data fetched from a remote
 * API in this session; curated catalogs are always labelled as curated.
 */
export function DataBadge({ provenance, meta, source }: { provenance: DataProvenance; meta?: FetchMeta; source?: string }) {
  if (provenance === 'curated') {
    return (
      <span className="chip" title="Static, hand-curated catalog with cited sources">
        <Database className="h-3 w-3 text-gold" aria-hidden />
        Curated catalog{source ? ` · ${source}` : ''}
      </span>
    );
  }
  const when = meta ? new Date(meta.fetchedAt) : null;
  return (
    <span className="chip" title={when ? `Fetched ${when.toLocaleString()} (cache: ${meta?.cache})` : undefined}>
      <Radio className="h-3 w-3 text-cyan-cosmic" aria-hidden />
      Live · {meta?.source ?? source}
      {meta && <span className="normal-case tracking-normal text-muted/80">· updated {relativeTime(meta.fetchedAt)}</span>}
    </span>
  );
}
