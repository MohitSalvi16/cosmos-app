import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Galaxy } from '@/types';
import { mulberry32 } from './StarField';

const VERT = /* glsl */ `
attribute vec3 aColor;
attribute float aSize;
varying vec3 vColor;
uniform float uPixelRatio;
void main(){
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  gl_PointSize = clamp(aSize * uPixelRatio * (60.0 / -mv.z), 0.0, 10.0);
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = /* glsl */ `
varying vec3 vColor;
void main(){
  float d = length(gl_PointCoord-0.5);
  float a = pow(smoothstep(0.5,0.0,d),1.8);
  gl_FragColor = vec4(vColor*a, a);
}`;

/** Procedural particle galaxy shaped by catalog type (artistic, not a map of real stars). */
export function GalaxyParticles({ galaxy, count = 30000 }: { galaxy: Galaxy; count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { geometry, material } = useMemo(() => {
    const rand = mulberry32(galaxy.id.length * 977 + galaxy.visual.arms * 13);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const core = new THREE.Color(galaxy.visual.core);
    const outer = new THREE.Color(galaxy.visual.outer);
    const c = new THREE.Color();
    const { type, arms } = galaxy.visual;
    const R = 10;
    for (let i = 0; i < count; i++) {
      let x = 0,
        y = 0,
        z = 0,
        t = 0;
      if (type === 'elliptical') {
        // de Vaucouleurs-ish concentration
        const r = Math.pow(rand(), 2.4) * R;
        const th = rand() * Math.PI * 2;
        const ph = Math.acos(2 * rand() - 1);
        x = r * Math.sin(ph) * Math.cos(th);
        y = r * Math.cos(ph) * 0.8;
        z = r * Math.sin(ph) * Math.sin(th);
        t = r / R;
      } else if (type === 'irregular') {
        const blob = Math.floor(rand() * 4);
        const cx = [0, 3, -2.5, 1.5][blob]!;
        const cz = [0, -2, 1.5, 3][blob]!;
        const r = Math.pow(rand(), 1.5) * (blob === 0 ? 6 : 3);
        const th = rand() * Math.PI * 2;
        x = cx + Math.cos(th) * r;
        z = cz + Math.sin(th) * r;
        y = (rand() - 0.5) * 1.2;
        t = Math.min(1, Math.hypot(x, z) / R);
      } else {
        const r = Math.pow(rand(), 1.3) * R;
        const armCount = Math.max(1, arms);
        const arm = Math.floor(rand() * armCount);
        const twist = type === 'lenticular' ? 0 : r * 0.55;
        const spread = (type === 'lenticular' ? 2.4 : 0.9) * (0.3 + r / R) * (rand() - 0.5) * 2;
        let th = (arm / armCount) * Math.PI * 2 + twist + spread;
        if (type === 'barred' && r < 3.2) th = (arm % 2) * Math.PI + (rand() - 0.5) * 0.3;
        x = Math.cos(th) * r;
        z = Math.sin(th) * r;
        const thick = type === 'lenticular' ? 0.25 : 0.35;
        y = (rand() - 0.5) * thick * (1.5 - r / R) * (r < 2 ? 3 : 1);
        t = r / R;
      }
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      c.copy(core).lerp(outer, Math.min(1, t * 1.3));
      if (rand() < 0.04 && type !== 'elliptical') c.set('#ff7ab8'); // H II regions
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
      size[i] = 0.6 + Math.pow(rand(), 6) * 3 + (t < 0.15 && rand() < 0.3 ? 0.8 : 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry: g, material: m };
  }, [galaxy, count]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += Math.min(delta, 0.1) * 0.04;
  });

  return <points ref={ref} geometry={geometry} material={material} rotation={[0.45, 0, 0.12]} />;
}
