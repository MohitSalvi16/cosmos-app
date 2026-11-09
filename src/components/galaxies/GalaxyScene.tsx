import { OrbitControls } from '@react-three/drei';
import type { Galaxy } from '@/types';
import type { DeviceTier } from '@/hooks/useDevice';
import { GalaxyParticles } from '@/components/space/GalaxyParticles';
import { SceneCanvas } from '@/components/space/SceneCanvas';
import { StarField } from '@/components/space/StarField';

export default function GalaxyScene({ galaxy, tier, reduced }: { galaxy: Galaxy; tier: DeviceTier; reduced: boolean }) {
  return (
    <SceneCanvas
      className="absolute inset-0"
      label={`Procedural particle visualization inspired by ${galaxy.name} (${galaxy.classification}). Artistic, not a map of real stars.`}
      camera={{ position: [0, 9, 22], fov: 45, near: 0.1, far: 1500 }}
    >
      <OrbitControls makeDefault enablePan={false} enableDamping minDistance={8} maxDistance={60} autoRotate={!reduced} autoRotateSpeed={0.25} />
      <StarField count={tier === 'low' ? 1500 : 4000} radius={[300, 700]} size={[1, 3.5]} seed={19} twinkle={!reduced} />
      <GalaxyParticles key={galaxy.id} galaxy={galaxy} count={tier === 'low' ? 14000 : 38000} />
    </SceneCanvas>
  );
}
