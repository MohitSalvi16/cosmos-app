import { ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { DataBadge } from '@/components/shared/DataBadge';
import { ErrorState, Skeleton } from '@/components/shared/States';
import { useAsync } from '@/hooks/useAsync';
import { APOD_FIRST_DATE, apodDisplayImage, apodPageUrl, fetchApod } from '@/services/nasa/apod';
import { formatDate, toIsoDate } from '@/utils/format';

export function ApodFeature() {
  const today = toIsoDate(new Date());
  const [date, setDate] = useState('');
  const { data, error, loading, reload } = useAsync((signal) => fetchApod(date || undefined, signal), [date]);
  const apod = data?.data;
  const img = apod ? apodDisplayImage(apod) : null;
  const isYouTubeish = apod?.media_type === 'video' && apod.url && /youtube|vimeo/.test(apod.url);

  return (
    <section id="apod" className="scroll-mt-24" aria-labelledby="apod-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Astronomy Picture of the Day</p>
          <h2 id="apod-title" className="display mt-3 text-4xl sm:text-5xl">
            {apod?.title ?? 'APOD'}
          </h2>
        </div>
        <label className="block">
          <span className="data-label">Choose a date</span>
          <input
            type="date"
            className="input mt-1.5 [color-scheme:dark]"
            min={APOD_FIRST_DATE}
            max={today}
            value={date || apod?.date || ''}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>
      <div className="mt-8" aria-live="polite" aria-busy={loading}>
        {error ? (
          <ErrorState error={error} onRetry={reload} context="APOD is unavailable for this date right now." />
        ) : loading || !apod ? (
          <Skeleton className="aspect-[16/9] w-full" />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div className="overflow-hidden border border-white/10 bg-black">
              {isYouTubeish ? (
                <iframe
                  title={apod.title}
                  src={apod.url}
                  className="aspect-video w-full"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  referrerPolicy="strict-origin-when-cross-origin"
                  loading="lazy"
                />
              ) : img ? (
                <a href={apod.hdurl ?? apod.url ?? img} target="_blank" rel="noopener noreferrer">
                  <img src={img} alt={apod.title} className="w-full object-contain" loading="lazy" />
                </a>
              ) : (
                <div className="flex aspect-video items-center justify-center p-6 text-sm text-muted">
                  This APOD is a {apod.media_type} item that can’t be embedded.{' '}
                  <a className="link-underline ml-1" href={apodPageUrl(apod.date)} target="_blank" rel="noopener noreferrer">
                    View it on apod.nasa.gov
                  </a>
                </div>
              )}
            </div>
            <div>
              <DataBadge provenance="live" meta={data?.meta} />
              <p className="mt-4 text-xs text-muted">
                {formatDate(apod.date, { dateStyle: 'full' })}
                {apod.copyright ? ` · Image credit & copyright: ${apod.copyright.trim()}` : ' · Credit: see APOD page'}
              </p>
              <p className="mt-5 text-sm leading-relaxed text-stellar/85">{apod.explanation}</p>
              <a href={apodPageUrl(apod.date)} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-6 !px-4 !py-2">
                Original APOD page <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
              <p className="mt-4 text-[11px] text-muted">
                APOD is a service of NASA and Michigan Technological University. Copyrighted images are shown as provided by the APOD API with their credit.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
