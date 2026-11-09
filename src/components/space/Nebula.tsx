import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { NEBULA_FRAGMENT, UV_VERTEX } from './shaders';

export interface NebulaProps {
  position: [number, number, number];
  size: number;
  colorA: string;
  colorB: string;
  seed?: number;
  opacity?: number;
  opacityRef?: { current: number };
  animate?: boolean;
}

/**
 * A procedural nebula: layered fractal noise on a camera-facing quad with additive blending,
 * which reads as volumetric light without the cost of ray-marching.
 */
export function Nebula({ position, size, colorA, colorB, seed = 0, opacity = 0.6, opacityRef, animate = true }: NebulaProps) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: UV_VERTEX,
        fragmentShader: NEBULA_FRAGMENT,
        uniforms: {
          uColorA: { value: new THREE.Color(colorA) },
          uColorB: { value: new THREE.Color(colorB) },
          uTime: { value: 0 },
          uSeed: { value: seed },
          uOpacity: { value: opacity },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [colorA, colorB, seed, opacity],
  );
  const geometry = useMemo(() => new THREE.PlaneGeometry(size, size), [size]);

  useEffect(
    () => () => {
      material.dispose();
      geometry.dispose();
    },
    [material, geometry],
  );

  useFrame((state) => {
    if (animate) material.uniforms.uTime!.value = state.clock.elapsedTime;
    if (opacityRef) material.uniforms.uOpacity!.value = opacity * opacityRef.current;
  });

  return (
    <Billboard position={position}>
      <mesh geometry={geometry} material={material} />
    </Billboard>
  );
}
