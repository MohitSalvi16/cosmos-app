import { useMemo, useState } from 'react';
import type { NeoApproach } from '@/types';
import { formatDate } from '@/utils/format';

/**
 * Close-approach chart: time on X, miss distance (lunar distances, log scale) on Y, bubble size ∝
 * mean estimated diameter. The dashed line marks the Moon's average distance (1 LD).
 */
export function ApproachChart({ data, onSelect, selectedId }: { data: NeoApproach[]; onSelect: (id: string) => void; selectedId: string | null }) {
  const [hover, setHover] = useState<NeoApproach | null>(null);
  const W = 900;
  const H = 340;
  const pad = { l: 56, r: 20, t: 20, b: 40 };

  const { xs, ys, rs, ticks, yTicks } = useMemo(() => {
    const t0 = Math.min(...data.map((d) => d.epochMs));
    const t1 = Math.max(...data.map((d) => d.epochMs));
    const span = Math.max(t1 - t0, 3_600_000);
    const minLd = 0.1;
    const maxLd = Math.max(200, ...data.map((d) => d.missLunar));
    const ly = (v: number) => Math.log10(Math.max(v, minLd));
    const y0 = ly(minLd);
    const y1 = ly(maxLd);
    const maxDia = Math.max(...data.map((d) => (d.diameterMinM + d.diameterMaxM) / 2));
    const xs = (d: NeoApproach) => pad.l + ((d.epochMs - t0) / span) * (W - pad.l - pad.r);
    const ys = (v: number) => pad.t + (1 - (ly(v) - y0) / (y1 - y0)) * (H - pad.t - pad.b);
    const rs = (d: NeoApproach) => 3 + Math.sqrt((d.diameterMinM + d.diameterMaxM) / 2 / maxDia) * 14;
    const days = new Map<string, number>();
    for (const d of data) if (!days.has(d.approachDate)) days.set(d.approachDate, xs(d));
    const ticks = [...days.entries()].sort((a, b) => a[1] - b[1]);
    const yTicks = [0.1, 1, 10, 100, 1000].filter((v) => v <= maxLd * 1.01);
    return { xs, ys, rs, ticks, yTicks };
  }, [data, pad.l, pad.r, pad.t, pad.b]);

  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Chart of asteroid close approaches: miss distance in lunar distances against date. A table with the same data follows.">
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={ys(v)} y2={ys(v)} stroke="rgba(244,247,255,0.06)" />
            <text x={pad.l - 8} y={ys(v) + 4} textAnchor="end" fontSize="11" fill="#9AA3BD" fontFamily="JetBrains Mono">
              {v}
            </text>
          </g>
        ))}
        <line x1={pad.l} x2={W - pad.r} y1={ys(1)} y2={ys(1)} stroke="#FFC878" strokeDasharray="4 4" strokeOpacity="0.7" />
        <text x={W - pad.r} y={ys(1) - 6} textAnchor="end" fontSize="11" fill="#FFC878" fontFamily="Inter">
          Moon’s distance (1 LD)
        </text>
        {ticks.map(([day, x]) => (
          <text key={day} x={x} y={H - 14} fontSize="11" fill="#9AA3BD" fontFamily="Inter">
            {formatDate(day, { month: 'short', day: 'numeric' })}
          </text>
        ))}
        <text x={14} y={H / 2} transform={`rotate(-90 14 ${H / 2})`} textAnchor="middle" fontSize="11" fill="#9AA3BD" fontFamily="Inter">
          Miss distance (lunar distances, log)
        </text>
        {data.map((d) => (
          <circle
            key={d.id + d.epochMs}
            cx={xs(d)}
            cy={ys(d.missLunar)}
            r={rs(d)}
            fill={d.hazardous ? '#ff8a5c' : '#64E8FF'}
            fillOpacity={selectedId === d.id ? 0.95 : 0.35}
            stroke={selectedId === d.id ? '#F4F7FF' : d.hazardous ? '#ff8a5c' : '#64E8FF'}
            strokeOpacity={0.9}
            className="cursor-pointer transition-[fill-opacity]"
            onMouseEnter={() => setHover(d)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onSelect(d.id)}
          >
            <title>
              {d.name}: {d.missLunar.toFixed(1)} LD on {d.approachDate}
            </title>
          </circle>
        ))}
      </svg>
      {hover && (
        <div className="glass pointer-events-none absolute right-2 top-2 p-3 text-xs">
          <p className="font-mono text-stellar">{hover.name}</p>
          <p className="text-muted">
            {hover.missLunar.toFixed(1)} LD · {hover.velocityKmS.toFixed(1)} km/s
          </p>
        </div>
      )}
      <figcaption className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-cosmic/70" /> Not classified potentially hazardous
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff8a5c]" /> Potentially hazardous (per NASA)
        </span>
        <span>Bubble size ∝ estimated diameter.</span>
      </figcaption>
    </figure>
  );
}
