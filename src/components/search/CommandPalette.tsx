import { AnimatePresence, motion } from 'framer-motion';
import { CornerDownLeft, ExternalLink, History, Loader2, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { searchExoplanetNames } from '@/services/nasa/exoplanets';
import { describeError, isAbortError } from '@/services/nasa/http';
import { searchNasaMedia } from '@/services/nasa/images';
import type { SearchCategory, SearchResult } from '@/types';
import { formatDistancePc } from '@/utils/format';
import { addRecentSearch, buildLocalIndex, getRecentSearches, groupResults, hasRecentConsent, searchLocal, setRecentConsent } from '@/utils/search';
import { useSearch } from './SearchContext';

const EXAMPLES = ['Kepler-452 b', 'Andromeda', 'Saturn', 'Sagittarius A*', 'Asteroids approaching Earth', 'Jupiter moons'];

export function CommandPalette() {
  const { open, initialQuery, closeSearch } = useSearch();
  const { reduced } = useMotionPreference();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState<SearchResult[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [consent, setConsent] = useState(hasRecentConsent);
  const [recent, setRecent] = useState<string[]>(getRecentSearches);

  const index = useMemo(buildLocalIndex, []);
  const debounced = useDebounce(query, 320);
  const local = useMemo(() => (query.trim() ? searchLocal(index, query, 10) : []), [index, query]);

  useEffect(() => {
    if (open) {
      restoreFocus.current = document.activeElement as HTMLElement | null;
      setQuery(initialQuery);
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      restoreFocus.current?.focus?.();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, initialQuery]);

  // Remote datasets (debounced, cancellable): NASA Exoplanet Archive + NASA Image Library.
  useEffect(() => {
    const term = debounced.trim();
    setRemote([]);
    setRemoteError(null);
    if (!open || term.length < 3) {
      setRemoteLoading(false);
      return;
    }
    const controller = new AbortController();
    setRemoteLoading(true);
    Promise.allSettled([searchExoplanetNames(term, controller.signal, 5), searchNasaMedia({ q: term, pageSize: 3 }, controller.signal)])
      .then(([exo, img]) => {
        if (controller.signal.aborted) return;
        const out: SearchResult[] = [];
        if (exo.status === 'fulfilled') {
          for (const p of exo.value) {
            out.push({
              id: `exo:${p.pl_name}`,
              title: p.pl_name,
              subtitle: `Exoplanet · host ${p.hostname ?? 'unknown'} · ${formatDistancePc(p.sy_dist)}`,
              category: 'Exoplanets',
              href: `/exoplanets/${encodeURIComponent(p.pl_name)}`,
              remote: true,
            });
          }
        }
        if (img.status === 'fulfilled') {
          for (const it of img.value.data.items) {
            out.push({ id: `img:${it.nasaId}`, title: it.title, subtitle: `NASA Image Library · ${it.center ?? 'NASA'}`, category: 'NASA Images', href: it.detailsUrl, remote: true, external: true });
          }
        }
        const failures = [exo, img].filter((r): r is PromiseRejectedResult => r.status === 'rejected' && !isAbortError(r.reason));
        if (failures.length) setRemoteError(`Some live sources could not be searched: ${describeError(failures[0]!.reason)}`);
        setRemote(out);
      })
      .finally(() => {
        if (!controller.signal.aborted) setRemoteLoading(false);
      });
    return () => controller.abort();
  }, [debounced, open]);

  const results = useMemo(() => groupResults(local, remote), [local, remote]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = (r: SearchResult) => {
    setRecent(addRecentSearch(query || r.title));
    closeSearch();
    if (r.external) window.open(r.href, '_blank', 'noopener,noreferrer');
    else navigate(r.href);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      const r = results[active];
      if (r) {
        e.preventDefault();
        choose(r);
      }
    }
  };

  // Simple focus trap.
  const onDialogKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const nodes = e.currentTarget.querySelectorAll<HTMLElement>('input, button, [href], [tabindex]:not([tabindex="-1"])');
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  let lastCategory: SearchCategory | null = null;
  const trimmed = query.trim();
  const showEmpty = trimmed.length > 0 && !results.length && !remoteLoading && debounced.trim() === trimmed;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center bg-void/70 px-4 pt-[12vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeSearch();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search the universe"
            onKeyDown={onDialogKey}
            className="glass w-full max-w-2xl shadow-2xl shadow-black/60"
            initial={reduced ? false : { opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              <Search className="h-4 w-4 text-muted" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search planets, stars, galaxies, exoplanets, NASA images…"
                className="h-14 flex-1 bg-transparent text-[15px] text-stellar placeholder:text-muted/70 focus:outline-none"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls="cosmos-search-results"
                aria-activedescendant={results[active] ? `search-opt-${active}` : undefined}
                aria-autocomplete="list"
              />
              {remoteLoading && <Loader2 className="h-4 w-4 animate-spin text-cyan-cosmic" aria-label="Searching live datasets" />}
              <button type="button" onClick={closeSearch} className="p-1 text-muted hover:text-stellar" aria-label="Close search">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="scrollbar-thin max-h-[56vh] overflow-y-auto">
              {!trimmed && (
                <div className="space-y-5 p-4">
                  {consent && recent.length > 0 && (
                    <div>
                      <p className="data-label mb-2 flex items-center gap-2">
                        <History className="h-3 w-3" aria-hidden /> Recent
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recent.map((r) => (
                          <button key={r} type="button" className="chip hover:text-stellar" onClick={() => setQuery(r)}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="data-label mb-2">Try</p>
                    <div className="flex flex-wrap gap-2">
                      {EXAMPLES.map((ex) => (
                        <button key={ex} type="button" className="chip normal-case tracking-normal hover:border-cyan-cosmic/50 hover:text-stellar" onClick={() => setQuery(ex)}>
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <ul id="cosmos-search-results" ref={listRef} role="listbox" aria-label="Search results" className="py-2">
                {results.map((r, i) => {
                  const header = r.category !== lastCategory ? r.category : null;
                  lastCategory = r.category;
                  return (
                    <li key={r.id} role="presentation">
                      {header && (
                        <p className="data-label px-4 pb-1 pt-3" role="presentation">
                          {header}
                          {(header === 'Exoplanets' || header === 'NASA Images') && <span className="ml-2 text-cyan-cosmic/80">· live</span>}
                        </p>
                      )}
                      <div
                        id={`search-opt-${i}`}
                        data-index={i}
                        role="option"
                        aria-selected={i === active}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => choose(r)}
                        className={`mx-2 flex cursor-pointer items-center gap-3 px-3 py-2.5 ${i === active ? 'bg-white/[0.07]' : ''}`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-stellar">{r.title}</p>
                          <p className="truncate text-xs text-muted">{r.subtitle}</p>
                        </div>
                        {r.external ? <ExternalLink className="h-3.5 w-3.5 text-muted" aria-hidden /> : i === active && <CornerDownLeft className="h-3.5 w-3.5 text-muted" aria-hidden />}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {showEmpty && <p className="px-4 pb-6 pt-2 text-sm text-muted">No matches in the curated catalog or live datasets for “{trimmed}”.</p>}
              {trimmed.length > 0 && trimmed.length < 3 && <p className="px-4 pb-4 text-xs text-muted">Type at least 3 characters to search live NASA datasets.</p>}
              {remoteError && (
                <p role="status" className="px-4 pb-4 text-xs text-gold">
                  {remoteError}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-2.5 text-[11px] text-muted">
              <span>↑↓ navigate · Enter open · Esc close</span>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setRecentConsent(e.target.checked);
                    setConsent(e.target.checked);
                    setRecent(getRecentSearches());
                  }}
                  className="accent-cyan-cosmic"
                />
                Remember recent searches on this device
              </label>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
