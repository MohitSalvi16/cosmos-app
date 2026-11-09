import type { DeviceTier } from '@/hooks/useDevice';
import { BlackHoleScene } from '@/components/space/BlackHoleScene';
import { SceneCanvas } from '@/components/space/SceneCanvas';

/** The ray-traced shader is per-pixel heavy, so it renders below native resolution. */
export default function BlackHoleCanvas({ tier, reduced }: { tier: DeviceTier; reduced: boolean }) {
  return (
    <SceneCanvas
      className="absolute inset-0"
      label="Simulated black hole with a lensed accretion disk. This is an artistic visualization, not a photograph."
      dpr={tier === 'low' ? 0.5 : 0.75}
      camera={{ position: [0, 0, 1] }}
      staticFrame={reduced}
    >
      <BlackHoleScene steps={tier === 'low' ? 70 : 120} animate={!reduced} />
    </SceneCanvas>
  );
}
