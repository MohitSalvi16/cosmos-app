import { RotateCcw, Search } from 'lucide-react';
import { DISCOVERY_METHODS } from '@/services/nasa/exoplanets';
import type { ExoplanetSort } from '@/types';

export interface FilterDraft {
  name: string;
  method: string;
  yearMin: string;
  yearMax: string;
  maxDistanceLy: string;
  sort: ExoplanetSort;
}

export const EMPTY_FILTERS: FilterDraft = { name: '', method: '', yearMin: '', yearMax: '', maxDistanceLy: '', sort: 'disc_year_desc' };

export const SORT_LABELS: Record<ExoplanetSort, string> = {
  disc_year_desc: 'Discovery year (newest)',
  disc_year_asc: 'Discovery year (oldest)',
  distance_asc: 'Distance (nearest)',
  distance_desc: 'Distance (farthest)',
  period_asc: 'Orbital period (shortest)',
  period_desc: 'Orbital period (longest)',
  name_asc: 'Name (A–Z)',
};

const CURRENT_YEAR = new Date().getFullYear();

export function ExoplanetFiltersBar({ value, onChange }: { value: FilterDraft; onChange: (v: FilterDraft) => void }) {
  const set = <K extends keyof FilterDraft>(k: K, v: FilterDraft[K]) => onChange({ ...value, [k]: v });
  const dirty = JSON.stringify(value) !== JSON.stringify(EMPTY_FILTERS);
  return (
    <form className="glass grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.4fr_0.8fr_0.8fr_1fr_1.4fr_auto] lg:items-end" role="search" onSubmit={(e) => e.preventDefault()} aria-label="Filter exoplanets">
      <label className="block">
        <span className="data-label">Planet name</span>
        <span className="relative mt-1.5 block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" aria-hidden />
          <input className="input pl-9" value={value.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Kepler-452, TRAPPIST" />
        </span>
      </label>
      <label className="block">
        <span className="data-label">Discovery method</span>
        <select className="input mt-1.5" value={value.method} onChange={(e) => set('method', e.target.value)}>
          <option value="" className="bg-void">
            All methods
          </option>
          {DISCOVERY_METHODS.map((m) => (
            <option key={m} value={m} className="bg-void">
              {m}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="data-label">Year from</span>
        <input className="input mt-1.5" type="number" inputMode="numeric" min={1989} max={CURRENT_YEAR} value={value.yearMin} onChange={(e) => set('yearMin', e.target.value)} placeholder="1989" />
      </label>
      <label className="block">
        <span className="data-label">Year to</span>
        <input className="input mt-1.5" type="number" inputMode="numeric" min={1989} max={CURRENT_YEAR} value={value.yearMax} onChange={(e) => set('yearMax', e.target.value)} placeholder={String(CURRENT_YEAR)} />
      </label>
      <label className="block">
        <span className="data-label">Max distance (ly)</span>
        <input className="input mt-1.5" type="number" inputMode="decimal" min={0} value={value.maxDistanceLy} onChange={(e) => set('maxDistanceLy', e.target.value)} placeholder="Any" />
      </label>
      <label className="block">
        <span className="data-label">Sort by</span>
        <select className="input mt-1.5" value={value.sort} onChange={(e) => set('sort', e.target.value as ExoplanetSort)}>
          {(Object.keys(SORT_LABELS) as ExoplanetSort[]).map((s) => (
            <option key={s} value={s} className="bg-void">
              {SORT_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <button type="button" disabled={!dirty} onClick={() => onChange(EMPTY_FILTERS)} className="btn-ghost !px-4 !py-2.5 disabled:opacity-40" aria-label="Reset filters">
        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
        <span className="lg:sr-only">Reset</span>
      </button>
    </form>
  );
}
