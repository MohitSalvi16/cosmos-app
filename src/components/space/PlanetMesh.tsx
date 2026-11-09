import { Billboard } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { BodyVisual, SurfaceStyle } from '@/types';
import {
  ATMOSPHERE_FRAGMENT,
  ATMOSPHERE_VERTEX,
  CLOUD_FRAGMENT,
  GLOW_FRAGMENT,
  PLANET_FRAGMENT,
  PLANET_VERTEX,
  RING_FRAGMENT,
  RING_VERTEX,
  SUN_FRAGMENT,
  UV_VERTEX,
} from './shaders';

export const STYLE_ID: Record<SurfaceStyle, number> = {
  sun: 0,
  rocky: 1,
  venus: 2,
  earth: 3,
  mars: 4,
  gas: 5,
  'ice-giant': 6,
  moon: 7,
  'icy-moon': 8,
  titan: 9,
  europa: 10,
};

export interface PlanetMeshProps {
  visual: BodyVisual;
  radius: number;
  /** Fixed world-space direction toward the light. If omitted, light comes from the world origin (the Sun). */
  lightDir?: THREE.Vector3;
  /** Radians per second of axial spin (visual only). */
  spin?: number;
  quality?: 'low' | 'high';
  /** Mutable opacity source (0–1) — lets GSAP fade a body in without React re-renders. */
  opacityRef?: { current: number };
  segments?: number;
  animate?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
}

const tmp = new THREE.Vector3();

export const PlanetMesh = forwardRef<THREE.Group, PlanetMeshProps>(function PlanetMesh(
  { visual, radius, lightDir, spin = 0.08, quality = 'high', opacityRef, segments, animate = true, onClick, onPointerOver, onPointerOut },
  ref,
) {
  const group = useRef<THREE.Group>(null!);
  const spinner = useRef<THREE.Group>(null!);
  const clouds = useRef<THREE.Mesh>(null);
  useImperativeHandle(ref, () => group.current);

  const isSun = visual.style === 'sun';
  const seg = segments ?? (quality === 'high' ? 96 : 48);
  const transparent = Boolean(opacityRef);

  const materials = useMemo(() => {
    const [a, b, c] = visual.palette.map((h) => new THREE.Color(h));
    const light = new THREE.Vector3(1, 0.3, 0.6).normalize();
    const surface = new THREE.ShaderMaterial({
      vertexShader: PLANET_VERTEX,
      fragmentShader: isSun ? SUN_FRAGMENT : PLANET_FRAGMENT,
      uniforms: {
        uStyle: { value: STYLE_ID[visual.style] },
        uA: { value: a },
        uB: { value: b },
        uC: { value: c },
        uAtmo: { value: new THREE.Color(visual.atmosphere ?? '#000000') },
        uLightPos: { value: light.clone() },
        uTime: { value: 0 },
        uSeed: { value: (visual.palette.join('').length * 7.13) % 10 },
        uOctaves: { value: quality === 'high' ? 6 : 4 },
        uOpacity: { value: 1 },
      },
      transparent,
    });
    const atmosphere = visual.atmosphere
      ? new THREE.ShaderMaterial({
          vertexShader: ATMOSPHERE_VERTEX,
          fragmentShader: ATMOSPHERE_FRAGMENT,
          uniforms: {
            uColor: { value: new THREE.Color(visual.atmosphere) },
            uLightPos: { value: light.clone() },
            uIntensity: { value: 1.4 },
            uOpacity: { value: 1 },
          },
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      : null;
    const cloud = visual.clouds
      ? new THREE.ShaderMaterial({
          vertexShader: PLANET_VERTEX,
          fragmentShader: CLOUD_FRAGMENT,
          uniforms: { uTime: { value: 0 }, uLightPos: { value: light.clone() }, uOpacity: { value: 1 } },
          transparent: true,
          depthWrite: false,
        })
      : null;
    const ring = visual.rings
      ? new THREE.ShaderMaterial({
          vertexShader: RING_VERTEX,
          fragmentShader: RING_FRAGMENT,
          uniforms: {
            uColor: { value: new THREE.Color(visual.rings.color) },
            uInner: { value: visual.rings.inner * radius },
            uOuter: { value: visual.rings.outer * radius },
            uOpacity: { value: visual.rings.opacity },
          },
          side: THREE.DoubleSide,
          transparent: true,
          depthWrite: false,
        })
      : null;
    const glow = isSun
      ? new THREE.ShaderMaterial({
          vertexShader: UV_VERTEX,
          fragmentShader: GLOW_FRAGMENT,
          uniforms: { uColor: { value: new THREE.Color('#ffb45e') }, uOpacity: { value: 0.9 } },
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      : null;
    return { surface, atmosphere, cloud, ring, glow };
  }, [visual, radius, isSun, quality, transparent]);

  const geometries = useMemo(
    () => ({
      sphere: new THREE.SphereGeometry(radius, seg, Math.round(seg * 0.66)),
      atmo: new THREE.SphereGeometry(radius * 1.06, Math.max(32, seg / 2), Math.max(24, seg / 3)),
      cloud: new THREE.SphereGeometry(radius * 1.012, seg, Math.round(seg * 0.66)),
      ring: visual.rings ? new THREE.RingGeometry(visual.rings.inner * radius, visual.rings.outer * radius, 160, 1) : null,
      glow: new THREE.PlaneGeometry(radius * 7, radius * 7),
    }),
    [radius, seg, visual.rings],
  );

  // Explicit disposal: these GPU resources are created imperatively, so R3F won't free them for us.
  useEffect(
    () => () => {
      Object.values(materials).forEach((m) => m?.dispose());
      Object.values(geometries).forEach((g) => g?.dispose());
    },
    [materials, geometries],
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const { surface, atmosphere, cloud } = materials;
    if (animate) {
      surface.uniforms.uTime!.value = t;
      if (cloud) cloud.uniforms.uTime!.value = t;
      spinner.current.rotation.y += spin * Math.min(delta, 0.1);
      if (clouds.current) clouds.current.rotation.y += spin * 0.25 * Math.min(delta, 0.1);
    }
    if (!isSun) {
      if (lightDir) tmp.copy(lightDir).normalize();
      else {
        group.current.getWorldPosition(tmp);
        tmp.negate().normalize();
      }
      surface.uniforms.uLightPos!.value.copy(tmp);
      atmosphere?.uniforms.uLightPos!.value.copy(tmp);
      cloud?.uniforms.uLightPos!.value.copy(tmp);
    }
    if (opacityRef) {
      const o = opacityRef.current;
      surface.uniforms.uOpacity!.value = o;
      if (atmosphere) atmosphere.uniforms.uOpacity!.value = o;
      if (cloud) cloud.uniforms.uOpacity!.value = o;
      if (materials.ring && visual.rings) materials.ring.uniforms.uOpacity!.value = visual.rings.opacity * o;
      group.current.visible = o > 0.001;
    }
  });

  const tilt = THREE.MathUtils.degToRad(visual.tiltDeg);

  return (
    <group ref={group}>
      <group rotation={[0, 0, tilt]}>
        <group ref={spinner}>
          <mesh geometry={geometries.sphere} material={materials.surface} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut} />
        </group>
        {materials.cloud && <mesh ref={clouds} geometry={geometries.cloud} material={materials.cloud} />}
        {materials.atmosphere && <mesh geometry={geometries.atmo} material={materials.atmosphere} />}
        {materials.ring && geometries.ring && <mesh geometry={geometries.ring} material={materials.ring} rotation={[-Math.PI / 2, 0, 0]} />}
      </group>
      {materials.glow && (
        <Billboard>
          <mesh geometry={geometries.glow} material={materials.glow} />
        </Billboard>
      )}
    </group>
  );
});
