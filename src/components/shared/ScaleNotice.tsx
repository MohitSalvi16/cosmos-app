import { Info } from 'lucide-react';

/** States plainly that a 3D scene is compressed and/or procedurally rendered. */
export function ScaleNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`glass flex gap-3 text-xs leading-relaxed text-muted ${compact ? 'p-3' : 'p-4'}`}>
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-cosmic" aria-hidden />
      <p>
        <span className="text-stellar">Not to scale.</span> Distances are compressed and planet sizes exaggerated so everything fits on screen —
        at true scale the planets would be invisible specks. Surfaces are <span className="text-stellar">procedural artistic renderings</span>, not NASA
        photographs. Orbital speeds are sped up and relative.
      </p>
    </div>
  );
}
