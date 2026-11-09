import { AlertTriangle, RotateCw, SearchX } from 'lucide-react';
import { describeError } from '@/services/nasa/http';

export function LoadingState({ label = 'Loading', className = '' }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={`flex items-center gap-3 py-10 text-sm text-muted ${className}`}>
      <span className="relative inline-flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-cosmic/50" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-cosmic" />
      </span>
      <span>{label}…</span>
    </div>
  );
}

export function ErrorState({ error, onRetry, context }: { error: unknown; onRetry?: () => void; context?: string }) {
  return (
    <div role="alert" className="glass flex flex-col gap-3 p-6 text-sm sm:flex-row sm:items-start">
      <AlertTriangle className="h-5 w-5 shrink-0 text-gold" aria-hidden />
      <div className="flex-1">
        <p className="font-medium text-stellar">{context ?? 'Live data is unavailable right now.'}</p>
        <p className="mt-1 text-muted">{describeError(error)}</p>
        <p className="mt-1 text-xs text-muted/80">
          COSMOS never substitutes invented data. Curated catalog sections remain available while the remote service recovers.
        </p>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-ghost !px-4 !py-2">
          <RotateCw className="h-3.5 w-3.5" aria-hidden /> Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted">
      <SearchX className="h-6 w-6 text-muted/70" aria-hidden />
      <p className="text-stellar">{title}</p>
      {hint && <p>{hint}</p>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse bg-white/[0.05] ${className}`} />;
}
