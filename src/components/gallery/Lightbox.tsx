import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download, ExternalLink, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { fetchAssetLinks } from '@/services/nasa/images';
import type { NasaMediaItem } from '@/types';
import { formatDate } from '@/utils/format';

export function Lightbox({ item, onClose, onPrev, onNext }: { item: NasaMediaItem; onClose: () => void; onPrev?: () => void; onNext?: () => void }) {
  const { reduced } = useMotionPreference();
  const closeRef = useRef<HTMLButtonElement>(null);
  const assets = useAsync((signal) => fetchAssetLinks(item.manifestUrl, signal), [item.manifestUrl]);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      prevFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onPrev?.();
      else if (e.key === 'ArrowRight') onNext?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  const a = assets.data;
  const display = a?.large ?? item.preview ?? item.thumbnail;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-[85] flex flex-col bg-void/95 backdrop-blur-md lg:flex-row"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.25 }}
    >
      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 lg:p-10">
        {item.mediaType === 'video' && a?.video ? (
          <video key={a.video} src={a.video} poster={item.thumbnail ?? undefined} controls className="max-h-full max-w-full" crossOrigin="anonymous">
            {a.captions && <track kind="captions" src={a.captions} srcLang="en" label="English" default />}
          </video>
        ) : item.mediaType === 'audio' && a?.audio ? (
          <audio src={a.audio} controls className="w-full max-w-lg" />
        ) : display ? (
          <motion.img
            key={display}
            src={display}
            alt={item.title}
            className="max-h-full max-w-full object-contain"
            initial={reduced ? false : { opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          />
        ) : (
          <p className="text-sm text-muted">No preview available for this item.</p>
        )}
        {onPrev && (
          <button type="button" onClick={onPrev} className="absolute left-2 top-1/2 -translate-y-1/2 p-3 text-muted hover:text-stellar" aria-label="Previous item">
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {onNext && (
          <button type="button" onClick={onNext} className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-muted hover:text-stellar" aria-label="Next item">
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
      <aside className="scrollbar-thin max-h-[42vh] w-full shrink-0 overflow-y-auto border-t border-white/10 p-6 lg:max-h-none lg:w-[400px] lg:border-l lg:border-t-0">
        <div className="flex justify-end">
          <button ref={closeRef} type="button" onClick={onClose} className="p-1 text-muted hover:text-stellar" aria-label="Close (Esc)">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="eyebrow">{item.mediaType}</p>
        <h2 className="mt-2 font-serif text-3xl leading-tight">{item.title}</h2>
        <dl className="mt-5 space-y-2 text-xs">
          <div className="flex gap-2">
            <dt className="text-muted">Date</dt>
            <dd>{formatDate(item.dateCreated)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted">Credit</dt>
            <dd>{item.credit ?? 'Not supplied'}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted">NASA center</dt>
            <dd>{item.center ?? 'Not supplied'}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted">NASA ID</dt>
            <dd className="font-mono">{item.nasaId}</dd>
          </div>
        </dl>
        {item.description ? <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-stellar/80">{item.description}</p> : <p className="mt-5 text-sm text-muted">No description supplied.</p>}
        {item.keywords.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-1.5">
            {item.keywords.map((k) => (
              <li key={k} className="chip normal-case tracking-normal">
                {k}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <a href={item.detailsUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost !px-4 !py-2">
            images.nasa.gov <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
          {a?.original && (
            <a href={a.original} target="_blank" rel="noopener noreferrer" className="btn-ghost !px-4 !py-2">
              Original asset <Download className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
        </div>
        <p className="mt-6 text-[11px] leading-relaxed text-muted">
          Shown from the NASA Image and Video Library. NASA material is generally not copyrighted, but some items include third-party content — check the original
          record. Display here does not imply NASA endorsement.
        </p>
      </aside>
    </motion.div>
  );
}
