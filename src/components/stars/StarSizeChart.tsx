import type { StarEntry } from '@/types';
import { starColor } from '@/data/starCatalog';

/** Parses the first number in a string like "~1.71 R☉" or "~700–1,000 R☉" (uses the lower bound). */
export function parseLeadingNumber(s: string): number | null {
  const m = s.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

/**
 * Compares stellar radii on a logarithmic scale — a linear scale is impossible on screen
 * (Betelgeuse is hundreds of times wider than the Sun).
 */
export function StarSizeChart({ stars }: { stars: StarEntry[] }) {
  const rows = stars
    .map((s) => ({ s, r: parseLeadingNumber(s.radius) }))
    .filter((x): x is { s: StarEntry; r: number } => x.r !== null)
    .sort((a, b) => a.r - b.r);
  const maxLog = Math.log10(Math.max(...rows.map((x) => x.r)));
  const minLog = Math.log10(Math.min(...rows.map((x) => x.r)));
  return (
    <figure>
      <ul className="space-y-3">
        {rows.map(({ s, r }) => {
          const pct = 8 + ((Math.log10(r) - minLog) / (maxLog - minLog || 1)) * 92;
          return (
            <li key={s.id} className="grid grid-cols-[120px_1fr_90px] items-center gap-4 text-sm sm:grid-cols-[160px_1fr_110px]">
              <span className="truncate">{s.name}</span>
              <span className="relative block h-2.5 bg-white/[0.04]">
                <span className="absolute inset-y-0 left-0" style={{ width: `${pct}%`, background: `linear-gradient(90deg, transparent, ${starColor(s.temperatureK)})` }} />
              </span>
              <span className="text-right font-mono text-xs text-muted">{s.radius.split('(')[0]}</span>
            </li>
          );
        })}
      </ul>
      <figcaption className="mt-3 text-xs text-muted">Radius in solar radii (R☉), logarithmic scale. Where a range is published, the lower bound is plotted. Colours approximate surface temperature.</figcaption>
    </figure>
  );
}
