import { AnimatePresence, motion } from 'framer-motion';
import { ImageOff, Loader2, PlayCircle, Search, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApodFeature } from '@/components/gallery/ApodFeature';
import { Lightbox } from '@/components/gallery/Lightbox';
import { DataBadge } from '@/components/shared/DataBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '@/components/shared/States';
import { useDebounce } from '@/hooks/useDebounce';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { isAbortError } from '@/services/nasa/http';
import { searchNasaMedia } from '@/services/nasa/images';
import type { FetchMeta, NasaMediaItem, NasaMediaType } from '@/types';

const MEDIA: { id: NasaMediaType; label: string }[] = [
  { id: 'image', label: 'Images' },
  { id: 'video', label: 'Video' },
  { id: 'audio', label: 'Audio' },
];
const SUGGESTED = ['nebula', 'James Webb', 'Saturn rings', 'galaxy cluster', 'aurora', 'Apollo 11', 'Mars rover'];
const PAGE_SIZE = 24;

export default function GalleryPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? 'nebula';
  const types = (params.get('media')?.split(',').filter((t): t is NasaMediaType => ['image', 'video', 'audio'].includes(t)) ?? ['image']) as NasaMediaType[];
  const [input, setInput] = useState(q);
  const debounced = useDebounce(input, 450);
  const { reduced } = useMotionPreference();

  const [items, setItems] = useState<NasaMediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [meta, setMeta] = useState<FetchMeta>();
  const [open, setOpen] = useState<number | null>(null);
  const [nonce, setNonce] = useState(0);
  const typeKey = types.join(',');
  const lastQuery = useRef('');

  useEffect(() => {
    if (debounced.trim() && debounced !== q) setParams({ q: debounced, media: typeKey }, { replace: true });
  }, [debounced, q, typeKey, setParams]);

  useEffect(() => {
    const key = `${q}|${typeKey}`;
    const reset = lastQuery.current !== key;
    lastQuery.current = key;
    const currentPage = reset ? 1 : page;
    if (reset && page !== 1) {
      setPage(1);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    if (currentPage === 1) setItems([]);
    searchNasaMedia({ q, mediaTypes: types.length ? types : ['image'], page: currentPage, pageSize: PAGE_SIZE }, controller.signal)
      .then((res) => {
        setItems((prev) => (currentPage === 1 ? res.data.items : [...prev, ...res.data.items.filter((i) => !prev.some((p) => p.nasaId === i.nasaId))]));
        setHasNext(res.data.hasNext);
        setTotal(res.data.totalHits);
        setMeta(res.meta);
      })
      .catch((err: unknown) => {
        if (!isAbortError(err)) setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, typeKey, page, nonce]);

  const toggleType = (t: NasaMediaType) => {
    const next = types.includes(t) ? types.filter((x) => x !== t) : [...types, t];
    setParams({ q, media: (next.length ? next : ['image']).join(',') }, { replace: true });
  };

  const current = open !== null ? items[open] : undefined;

  return (
    <>
      <PageHeader
        eyebrow="NASA Gallery"
        title={
          <>
            Through NASA’s <em className="text-gold">eyes.</em>
          </>
        }
        intro="Search more than 140,000 images, videos and audio files in the NASA Image and Video Library. Every item links to its original record with the credits NASA supplies."
      />

      <section className="container-cosmos" aria-label="Astronomy Picture of the Day">
        <ApodFeature />
      </section>

      <section className="container-cosmos mt-24" aria-labelledby="library-title">
        <h2 id="library-title" className="display text-4xl sm:text-5xl">
          The library
        </h2>
        <form
          role="search"
          className="glass mt-8 flex flex-col gap-4 p-4 md:flex-row md:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) setParams({ q: input.trim(), media: typeKey }, { replace: true });
          }}
        >
          <label className="relative block flex-1">
            <span className="sr-only">Search NASA media</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input className="input pl-10" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search keyword (e.g. Pillars of Creation)" />
          </label>
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Media types</legend>
            {MEDIA.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={types.includes(m.id)}
                onClick={() => toggleType(m.id)}
                className={`chip transition ${types.includes(m.id) ? 'border-cyan-cosmic/60 text-cyan-cosmic' : 'hover:text-stellar'}`}
              >
                {m.label}
              </button>
            ))}
          </fieldset>
        </form>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setInput(s);
                setParams({ q: s, media: typeKey }, { replace: true });
              }}
              className="chip normal-case tracking-normal hover:text-stellar"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted">
          <DataBadge provenance="live" meta={meta} source="NASA Image and Video Library" />
          {!loading && !error && <span>{total.toLocaleString('en-US')} results for “{q}”</span>}
        </div>

        <div className="mt-8" aria-live="polite" aria-busy={loading}>
          {Boolean(error) && <ErrorState error={error} onRetry={() => setNonce((n) => n + 1)} context="The NASA Image Library could not be reached." />}
          {!error && !loading && items.length === 0 && <EmptyState title={`No NASA media found for “${q}”.`} hint="Try a broader keyword or another media type." />}
          <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>li]:mb-3">
            <AnimatePresence initial={false}>
              {items.map((item, i) => (
                <motion.li
                  key={item.nasaId}
                  layout={!reduced}
                  initial={reduced ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: reduced ? 0 : (i % PAGE_SIZE) * 0.02 }}
                  className="break-inside-avoid"
                >
                  <button type="button" onClick={() => setOpen(i)} className="group relative block w-full overflow-hidden border border-white/10 text-left" aria-label={`Open ${item.title}`}>
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-full transition duration-700 group-hover:scale-[1.05] group-hover:brightness-110"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center bg-white/[0.03] text-muted">
                        {item.mediaType === 'audio' ? <Volume2 className="h-6 w-6" /> : <ImageOff className="h-6 w-6" />}
                      </div>
                    )}
                    {item.mediaType === 'video' && <PlayCircle className="absolute right-2 top-2 h-6 w-6 text-stellar drop-shadow" aria-hidden />}
                    <span className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-void via-void/80 to-transparent p-3 pt-10 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                      <span className="line-clamp-2 block text-xs text-stellar">{item.title}</span>
                      <span className="block text-[10px] text-muted">{item.credit ?? item.center ?? 'NASA'}</span>
                    </span>
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          {loading && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="aspect-[4/3] w-full" />
              ))}
            </div>
          )}
          {!loading && hasNext && !error && (
            <div className="mt-10 flex justify-center">
              <button type="button" className="btn-ghost" onClick={() => setPage((p) => p + 1)}>
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Load more
              </button>
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {current && open !== null && (
          <Lightbox
            key="lightbox"
            item={current}
            onClose={() => setOpen(null)}
            onPrev={open > 0 ? () => setOpen(open - 1) : undefined}
            onNext={open < items.length - 1 ? () => setOpen(open + 1) : undefined}
          />
        )}
      </AnimatePresence>
    </>
  );
}
