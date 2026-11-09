import type { ReactNode } from 'react';

export interface DataItem {
  label: string;
  value: ReactNode;
  note?: string;
  estimate?: boolean;
}

/** Screen-reader-friendly definition list for scientific values. */
export function DataList({ items, columns = 2 }: { items: DataItem[]; columns?: 1 | 2 | 3 }) {
  const cols = columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : columns === 2 ? 'sm:grid-cols-2' : '';
  return (
    <dl className={`grid grid-cols-1 gap-px overflow-hidden border border-white/[0.07] bg-white/[0.07] ${cols}`}>
      {items.map((it) => (
        <div key={it.label} className="bg-void/95 p-4">
          <dt className="data-label flex items-center gap-2">
            {it.label}
            {it.estimate && (
              <span className="border border-gold/40 px-1.5 text-[9px] tracking-[0.14em] text-gold" title="Approximate / estimated value">
                EST.
              </span>
            )}
          </dt>
          <dd className="data-value mt-1.5 break-words">{it.value}</dd>
          {it.note && <dd className="mt-1 text-xs text-muted">{it.note}</dd>}
        </div>
      ))}
    </dl>
  );
}
