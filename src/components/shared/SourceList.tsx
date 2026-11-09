import { ExternalLink } from 'lucide-react';
import type { SourceLink } from '@/types';

export function SourceList({ sources, title = 'Sources' }: { sources: SourceLink[]; title?: string }) {
  if (!sources.length) return null;
  return (
    <div>
      <h3 className="data-label mb-3">{title}</h3>
      <ul className="space-y-2 text-sm">
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="link-underline inline-flex items-center gap-1.5 text-stellar/90">
              {s.label}
              <ExternalLink className="h-3 w-3" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
