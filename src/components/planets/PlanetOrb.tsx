import type { BodyVisual } from '@/types';

/** Lightweight CSS rendering of a body for lists (no WebGL needed). Artistic, not photographic. */
export function PlanetOrb({ visual, size = 96 }: { visual: BodyVisual; size?: number }) {
  const [a, b, c] = visual.palette;
  const isSun = visual.style === 'sun';
  const banded = visual.style === 'gas' || visual.style === 'ice-giant';
  return (
    <span className="relative inline-block" style={{ width: size, height: size }} aria-hidden>
      {visual.rings && (
        <span
          className="absolute left-1/2 top-1/2 rounded-[50%] border"
          style={{
            width: size * (visual.rings.outer / 1.05),
            height: size * (visual.rings.outer / 1.05) * 0.28,
            transform: `translate(-50%, -50%) rotate(${-Math.min(visual.tiltDeg, 30)}deg)`,
            borderColor: visual.rings.color,
            borderWidth: Math.max(2, size * 0.06),
            opacity: visual.rings.opacity * 0.8,
          }}
        />
      )}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: isSun
            ? `radial-gradient(circle at 50% 50%, ${c} 0%, ${b} 45%, ${a} 100%)`
            : `${banded ? `repeating-linear-gradient(${-visual.tiltDeg * 0.3}deg, ${b} 0 ${size * 0.06}px, ${c}33 ${size * 0.06}px ${size * 0.1}px),` : ''} radial-gradient(circle at 32% 30%, ${c} 0%, ${b} 38%, ${a} 78%, #000 100%)`,
          boxShadow: isSun
            ? `0 0 ${size * 0.5}px ${b}aa, 0 0 ${size}px ${a}55`
            : `inset -${size * 0.22}px -${size * 0.12}px ${size * 0.35}px rgba(0,0,0,0.85)${visual.atmosphere ? `, 0 0 ${size * 0.12}px ${visual.atmosphere}55` : ''}`,
        }}
      />
      {visual.rings && (
        <span
          className="absolute left-1/2 top-1/2 rounded-[50%] border-b"
          style={{
            width: size * (visual.rings.outer / 1.05),
            height: size * (visual.rings.outer / 1.05) * 0.28,
            transform: `translate(-50%, -50%) rotate(${-Math.min(visual.tiltDeg, 30)}deg)`,
            borderColor: visual.rings.color,
            borderBottomWidth: Math.max(2, size * 0.06),
            opacity: visual.rings.opacity * 0.9,
          }}
        />
      )}
    </span>
  );
}
