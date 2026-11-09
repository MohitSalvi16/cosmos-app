import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SOLAR_SYSTEM } from '@/data/solarSystem';
import { SceneCanvas } from '@/components/space/SceneCanvas';
import { Nebula } from '@/components/space/Nebula';
import { PlanetMesh } from '@/components/space/PlanetMesh';
import { StarField } from '@/components/space/StarField';
import type { DeviceTier } from '@/hooks/useDevice';

/** Mutable values animated by the GSAP intro timeline and ScrollTrigger (read every frame). */
export interface IntroState {
  stars: number;
  nebula: number;
  planet: number;
  dust: number;
  camZ: number;
  scroll: number;
}

const earth = SOLAR_SYSTEM.find((b) => b.id === 'earth')!;
const HERO_VISUAL = { ...earth.visual, tiltDeg: 18 };
// Light from behind-left gives a cinematic crescent rim.
const LIGHT = new THREE.Vector3(-0.75, 0.3, -1).normalize();

function Rig({ intro, reduced }: { intro: IntroState; reduced: boolean }) {
  const camera = useThree((s) => s.camera);
  const look = useMemo(() => new THREE.Vector3(0, 0, -120), []);
  const pointer = useRef(new THREE.Vector2());
  useFrame((state, delta) => {
    const k = Math.min(1, delta * 1.6);
    if (!reduced) pointer.current.lerp(state.pointer, k);
    const z = intro.camZ - intro.scroll * 26;
    camera.position.set(pointer.current.x * 1.6, pointer.current.y * 0.9 - intro.scroll * 2, z);
    look.set(pointer.current.x * 4, pointer.current.y * 2, z - 120);
    camera.lookAt(look);
  });
  return null;
}

function Scene({ intro, reduced, tier }: { intro: IntroState; reduced: boolean; tier: DeviceTier }) {
  const starsRef = useRef(0);
  const nebulaRef = useRef(0);
  const planetRef = useRef(0);
  const dustRef = useRef(0);
  const group = useRef<THREE.Group>(null);
  // Portrait screens: lift the planet above the headline instead of beside it.
  const portrait = useThree((s) => s.size.width / s.size.height < 1);

  useFrame(() => {
    starsRef.current = intro.stars;
    nebulaRef.current = intro.nebula;
    planetRef.current = intro.planet;
    dustRef.current = intro.dust;
  });

  const low = tier === 'low';
  return (
    <>
      <Rig intro={intro} reduced={reduced} />
      {/* Three depth layers produce parallax as the camera travels: distant sky, mid stars, near dust. */}
      <StarField count={low ? 2500 : 7000} radius={[260, 600]} size={[0.8, 3.2]} seed={11} opacityRef={starsRef} twinkle={!reduced} band={0.6} />
      <StarField count={low ? 900 : 2400} radius={[60, 260]} size={[0.5, 2.0]} seed={23} opacityRef={starsRef} twinkle={!reduced} />
      <StarField count={low ? 250 : 700} radius={[3, 45]} size={[0.15, 0.6]} seed={37} opacityRef={dustRef} twinkle={false} drift={reduced ? 0 : 0.004} />
      <Nebula position={[-140, 60, -380]} size={520} colorA="#6E44FF" colorB="#1b2b7a" seed={1.3} opacity={0.55} opacityRef={nebulaRef} animate={!reduced} />
      <Nebula position={[180, -40, -420]} size={460} colorA="#64E8FF" colorB="#3a1d8f" seed={4.1} opacity={0.32} opacityRef={nebulaRef} animate={!reduced} />
      {!low && <Nebula position={[40, 140, -500]} size={380} colorA="#FFC878" colorB="#6E44FF" seed={7.7} opacity={0.22} opacityRef={nebulaRef} animate={!reduced} />}
      <group ref={group} position={portrait ? [5, 27, -96] : [30, -9, -66]}>
        <PlanetMesh visual={HERO_VISUAL} radius={12} lightDir={LIGHT} spin={reduced ? 0 : 0.02} quality={low ? 'low' : 'high'} opacityRef={planetRef} animate={!reduced} />
      </group>
    </>
  );
}

export default function HeroScene({ intro, reduced, tier }: { intro: IntroState; reduced: boolean; tier: DeviceTier }) {
  return (
    <SceneCanvas
      className="absolute inset-0"
      label="Procedural 3D star field with a nebula and a slowly rotating Earth-like planet (artistic rendering)"
      camera={{ position: [0, 0, intro.camZ], fov: 55, near: 0.1, far: 2000 }}
    >
      <Scene intro={intro} reduced={reduced} tier={tier} />
    </SceneCanvas>
  );
}
