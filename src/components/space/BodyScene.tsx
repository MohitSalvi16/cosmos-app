import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { BodyVisual, CelestialBody } from '@/types';
import type { DeviceTier } from '@/hooks/useDevice';
import { PlanetMesh } from './PlanetMesh';
import { StarField } from './StarField';
import { SceneCanvas } from './SceneCanvas';
import { angularSpeed } from './UniverseScene';

const LIGHT = new THREE.Vector3(1, 0.25, 0.55).normalize();

function CameraIntro({ distance, reduced }: { distance: number; reduced: boolean }) {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    const end = new THREE.Vector3(distance * 0.35, distance * 0.42, distance);
    if (reduced) {
      camera.position.copy(end);
      return;
    }
    camera.position.set(end.x * 3.2, end.y * 4, end.z * 3.4);
    const tween = gsap.to(camera.position, { x: end.x, y: end.y, z: end.z, duration: 2.8, ease: 'power3.out' });
    return () => {
      tween.kill();
    };
  }, [camera, distance, reduced]);
  return null;
}

function Moons({ moons, primaryRadius, reduced }: { moons: CelestialBody[]; primaryRadius: number; reduced: boolean }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  // Moon placement: compressed, ordered by real distance, outside any rings.
  const layout = useMemo(
    () =>
      [...moons]
        .sort((a, b) => (a.orbit.meanDistanceKm ?? 0) - (b.orbit.meanDistanceKm ?? 0))
        .map((m, i) => ({ body: m, orbit: primaryRadius * (2.6 + i * 0.9), radius: Math.max(0.12, Math.min(0.45, m.physical.diameterKm / 12000)) })),
    [moons, primaryRadius],
  );
  useFrame((state) => {
    const t = reduced ? 0 : state.clock.elapsedTime;
    layout.forEach((l, i) => {
      const g = refs.current[i];
      if (!g) return;
      const a = i * 2.1 + t * angularSpeed(l.body) * 0.6;
      g.position.set(Math.cos(a) * l.orbit, Math.sin(a) * l.orbit * 0.08, Math.sin(a) * l.orbit);
    });
  });
  return (
    <>
      {layout.map((l, i) => (
        <group
          key={l.body.id}
          ref={(g) => {
            refs.current[i] = g;
          }}
        >
          <PlanetMesh visual={l.body.visual} radius={l.radius} lightDir={LIGHT} quality="low" segments={40} animate={!reduced} />
        </group>
      ))}
    </>
  );
}

export function BodyScene({ visual, moons = [], reduced, tier, label }: { visual: BodyVisual; moons?: CelestialBody[]; reduced: boolean; tier: DeviceTier; label: string }) {
  const R = 2.2;
  const distance = visual.rings ? R * 5.2 : moons.length ? R * 4.6 : R * 3.4;
  return (
    <SceneCanvas className="absolute inset-0" label={label} camera={{ position: [0, 0, distance * 3], fov: 42, near: 0.05, far: 2000 }}>
      <CameraIntro distance={distance} reduced={reduced} />
      <OrbitControls makeDefault enablePan={false} enableDamping minDistance={R * 1.6} maxDistance={R * 14} rotateSpeed={0.6} />
      <StarField count={tier === 'low' ? 2000 : 5000} radius={[200, 500]} size={[1, 4]} seed={7} twinkle={!reduced} band={0.4} />
      <PlanetMesh visual={visual} radius={R} lightDir={visual.style === 'sun' ? undefined : LIGHT} quality={tier} spin={visual.style === 'sun' ? 0.03 : 0.12} animate={!reduced} />
      <Moons moons={moons} primaryRadius={visual.rings ? R * (visual.rings.outer / 2) + R * 0.4 : R} reduced={reduced} />
    </SceneCanvas>
  );
}

export default BodyScene;
