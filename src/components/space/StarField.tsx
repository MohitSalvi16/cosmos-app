import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { STAR_FRAGMENT, STAR_VERTEX } from './shaders';

/** Deterministic PRNG so the sky is identical between renders/visits. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Rough stellar colour distribution (most stars are cool and reddish; a few hot blue ones).
const STAR_COLORS = ['#9bb0ff', '#aabfff', '#cad7ff', '#f8f7ff', '#fff4ea', '#ffd2a1', '#ffcc6f'];
const STAR_WEIGHTS = [0.04, 0.07, 0.12, 0.22, 0.25, 0.18, 0.12];

function pickColor(r: number): string {
  let acc = 0;
  for (let i = 0; i < STAR_WEIGHTS.length; i++) {
    acc += STAR_WEIGHTS[i]!;
    if (r <= acc) return STAR_COLORS[i]!;
  }
  return STAR_COLORS[STAR_COLORS.length - 1]!;
}

export interface StarFieldProps {
  count: number;
  radius: [number, number];
  size?: [number, number];
  seed?: number;
  /** Mutable opacity source, animated by GSAP during the intro. */
  opacityRef?: { current: number };
  twinkle?: boolean;
  /** Flatten the distribution into a band (Milky-Way-like) by this factor (0 = sphere). */
  band?: number;
  /** Slow rotation in radians per second. */
  drift?: number;
}

/**
 * Thousands of stars in a single draw call (one THREE.Points with per-vertex size/colour/phase).
 */
export function StarField({ count, radius, size = [0.6, 2.2], seed = 1, opacityRef, twinkle = true, band = 0, drift = 0 }: StarFieldProps) {
  const dpr = useThree((s) => s.viewport.dpr);

  const geometry = useMemo(() => {
    const rand = mulberry32(seed);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phase = new Float32Array(count);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const u = rand() * 2 - 1;
      const th = rand() * Math.PI * 2;
      let y = u;
      if (band > 0 && rand() < 0.55) y *= 1 - band; // concentrate some stars in a band
      const s = Math.sqrt(1 - y * y);
      const r = radius[0] + (radius[1] - radius[0]) * Math.pow(rand(), 0.7);
      pos[i * 3] = Math.cos(th) * s * r;
      pos[i * 3 + 1] = y * r;
      pos[i * 3 + 2] = Math.sin(th) * s * r;
      c.set(pickColor(rand()));
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
      // Power-law sizes: many faint stars, few bright ones.
      sizes[i] = size[0] + (size[1] - size[0]) * Math.pow(rand(), 4);
      phase[i] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    return g;
  }, [count, radius, size, seed, band]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: STAR_VERTEX,
        fragmentShader: STAR_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uTwinkle: { value: twinkle ? 1 : 0 },
          uOpacity: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [twinkle],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  const points = useMemo(() => new THREE.Points(geometry, material), [geometry, material]);
  points.frustumCulled = false;

  useFrame((state, delta) => {
    material.uniforms.uTime!.value = state.clock.elapsedTime;
    material.uniforms.uPixelRatio!.value = dpr;
    if (opacityRef) material.uniforms.uOpacity!.value = opacityRef.current;
    if (drift) points.rotation.y += drift * Math.min(delta, 0.1);
  });

  return <primitive object={points} />;
}
