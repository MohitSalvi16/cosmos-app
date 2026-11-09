import { Html, OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { SOLAR_SYSTEM } from '@/data/solarSystem';
import type { CelestialBody } from '@/types';
import type { DeviceTier } from '@/hooks/useDevice';
import { Nebula } from './Nebula';
import { PlanetMesh } from './PlanetMesh';
import { StarField } from './StarField';

export const HOME_CAMERA = new THREE.Vector3(0, 55, 118);
const HOME_TARGET = new THREE.Vector3(0, 0, 0);

/** Visual-only angular speed (rad/s): a compressed Kepler-like trend (slower when farther). */
export function angularSpeed(body: CelestialBody): number {
  const days = body.orbit.orbitalPeriodDays ?? 365;
  return body.kind === 'moon' ? 1.1 / Math.sqrt(days) : 0.22 * Math.sqrt(365 / days);
}

function initialPhase(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 1000;
  return (h / 1000) * Math.PI * 2;
}

function OrbitRing({ radius, highlighted }: { radius: number; highlighted: boolean }) {
  const line = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const m = new THREE.LineBasicMaterial({ color: '#9fb4ff', transparent: true, opacity: 0.16, depthWrite: false });
    return new THREE.Line(g, m);
  }, [radius]);
  useEffect(
    () => () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    },
    [line],
  );
  (line.material as THREE.LineBasicMaterial).opacity = highlighted ? 0.55 : 0.14;
  (line.material as THREE.LineBasicMaterial).color.set(highlighted ? '#64E8FF' : '#9fb4ff');
  return <primitive object={line} />;
}

export interface UniverseSceneProps {
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  paused: boolean;
  showLabels: boolean;
  resetToken: number;
  tier: DeviceTier;
  reduced: boolean;
}

export function UniverseScene({ selectedId, hoveredId, onSelect, onHover, paused, showLabels, resetToken, tier, reduced }: UniverseSceneProps) {
  const groups = useRef(new Map<string, THREE.Group>());
  const simTime = useRef(0);
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const flight = useRef<{ active: boolean; t: number }>({ active: false, t: 0 });
  const lastTarget = useRef(new THREE.Vector3());
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const desired = useMemo(() => new THREE.Vector3(), []);

  const planets = useMemo(() => SOLAR_SYSTEM.filter((b) => b.kind !== 'moon'), []);
  const moons = useMemo(() => SOLAR_SYSTEM.filter((b) => b.kind === 'moon'), []);
  const low = tier === 'low';

  // Start a camera flight whenever the selection changes or reset is requested.
  useEffect(() => {
    flight.current = { active: true, t: 0 };
  }, [selectedId, resetToken]);

  useEffect(() => {
    document.body.style.cursor = hoveredId ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hoveredId]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    if (!paused) simTime.current += delta;
    const t = simTime.current;

    // Advance orbits.
    for (const b of SOLAR_SYSTEM) {
      const g = groups.current.get(b.id);
      if (!g || b.kind === 'star') continue;
      const a = initialPhase(b.id) + t * angularSpeed(b);
      g.position.set(Math.cos(a) * b.visual.sceneOrbit, 0, Math.sin(a) * b.visual.sceneOrbit);
    }

    const ctl = controls.current;
    if (!ctl) return;
    const target = selectedId ? groups.current.get(selectedId) : undefined;
    const body = selectedId ? SOLAR_SYSTEM.find((b) => b.id === selectedId) : undefined;

    if (target && body) {
      target.getWorldPosition(tmp);
      const dist = Math.max(body.visual.sceneRadius * (body.visual.rings ? 7 : 5.5), 2.2);
      if (flight.current.active) {
        flight.current.t += delta;
        desired.set(0.55, 0.32, 1).normalize().multiplyScalar(dist).add(tmp);
        const k = reduced ? 1 : 1 - Math.pow(0.02, delta);
        camera.position.lerp(desired, k);
        ctl.target.lerp(tmp, k);
        if (camera.position.distanceTo(desired) < 0.05 || flight.current.t > 4) flight.current.active = false;
      } else {
        // Follow the moving body while letting the user orbit around it.
        camera.position.add(desired.copy(tmp).sub(lastTarget.current));
        ctl.target.copy(tmp);
      }
      lastTarget.current.copy(tmp);
    } else if (flight.current.active) {
      flight.current.t += delta;
      const k = reduced ? 1 : 1 - Math.pow(0.04, delta);
      camera.position.lerp(HOME_CAMERA, k);
      ctl.target.lerp(HOME_TARGET, k);
      if (camera.position.distanceTo(HOME_CAMERA) < 0.1 || flight.current.t > 4) flight.current.active = false;
    }
    ctl.update();
  });

  const register = (id: string) => (g: THREE.Group | null) => {
    if (g) groups.current.set(id, g);
    else groups.current.delete(id);
  };

  const hovered = hoveredId ? SOLAR_SYSTEM.find((b) => b.id === hoveredId) : undefined;

  const bodyEvents = (id: string) => ({
    onClick: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onSelect(id);
    },
    onPointerOver: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onHover(id);
    },
    onPointerOut: () => onHover(null),
  });

  const renderLabel = (b: CelestialBody) =>
    showLabels && (b.kind !== 'moon' || selectedId === b.parent || selectedId === b.id) ? (
      <Html position={[0, b.visual.sceneRadius + (b.kind === 'moon' ? 0.35 : 0.9), 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <span
          className={`whitespace-nowrap text-[10px] uppercase tracking-[0.22em] ${selectedId === b.id ? 'text-cyan-cosmic' : 'text-stellar/70'}`}
          style={{ textShadow: '0 0 8px #000' }}
        >
          {b.name}
        </span>
      </Html>
    ) : null;

  return (
    <>
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={1.2}
        maxDistance={420}
        enablePan
        onStart={() => {
          flight.current.active = false;
        }}
      />
      <StarField count={low ? 3000 : 9000} radius={[500, 1200]} size={[1.2, 5]} seed={3} twinkle={!reduced} band={0.5} />
      <Nebula position={[-700, 180, -800]} size={900} colorA="#6E44FF" colorB="#1d2f8a" seed={2.2} opacity={0.5} animate={!reduced} />
      <Nebula position={[900, -120, -300]} size={760} colorA="#64E8FF" colorB="#2a1670" seed={5.4} opacity={0.32} animate={!reduced} />
      <Nebula position={[200, 420, 900]} size={820} colorA="#FFC878" colorB="#7a2a6e" seed={8.9} opacity={0.26} animate={!reduced} />
      {!low && <Nebula position={[-600, -300, 700]} size={700} colorA="#ff6b9a" colorB="#3b1fa3" seed={11.3} opacity={0.22} animate={!reduced} />}

      {planets.map((b) => (
        <group key={b.id}>
          {b.kind === 'planet' && <OrbitRing radius={b.visual.sceneOrbit} highlighted={selectedId === b.id || hoveredId === b.id} />}
          <group ref={register(b.id)}>
            <PlanetMesh visual={b.visual} radius={b.visual.sceneRadius} quality={low ? 'low' : 'high'} animate={!reduced} spin={b.kind === 'star' ? 0.02 : 0.25} {...bodyEvents(b.id)} />
            {renderLabel(b)}
            {moons
              .filter((m) => m.parent === b.id)
              .map((m) => (
                <group key={m.id}>
                  <OrbitRing radius={m.visual.sceneOrbit} highlighted={selectedId === m.id} />
                  <group ref={register(m.id)}>
                    <PlanetMesh visual={m.visual} radius={m.visual.sceneRadius} quality="low" segments={32} animate={!reduced} {...bodyEvents(m.id)} />
                    {renderLabel(m)}
                  </group>
                </group>
              ))}
          </group>
        </group>
      ))}

      {hovered && hovered.id !== selectedId && (
        <HoverCard body={hovered} anchor={groups.current.get(hovered.id)} />
      )}
    </>
  );
}

function HoverCard({ body, anchor }: { body: CelestialBody; anchor?: THREE.Group }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (anchor && ref.current) anchor.getWorldPosition(ref.current.position);
  });
  return (
    <group ref={ref}>
      <Html position={[0, -body.visual.sceneRadius - 0.6, 0]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
        <div className="glass w-56 p-3 text-left">
          <p className="font-serif text-lg leading-none text-stellar">{body.name}</p>
          <p className="mt-1.5 text-[11px] leading-snug text-muted">{body.tagline}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-cyan-cosmic">Click to focus</p>
        </div>
      </Html>
    </group>
  );
}
