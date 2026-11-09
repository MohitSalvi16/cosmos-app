import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { NOISE_GLSL } from './shaders';

// A simplified Schwarzschild ray-tracer. Each pixel's light ray is bent with the classic
// "photon acceleration" approximation a = -1.5 h² r̂ / r⁴ (units of the Schwarzschild radius).
// It reproduces the shadow, photon ring and the lensed image of the far side of the accretion disk.
// This is an ARTISTIC SIMULATION — not an observation and not a full GR renderer.
const FRAG = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform int uSteps;
varying vec2 vUv;
${NOISE_GLSL}

float hash(vec3 p){ p = fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }

vec3 stars(vec3 d){
  vec3 col = vec3(0.0);
  for(int i=0;i<2;i++){
    float s = i==0 ? 120.0 : 260.0;
    vec3 c = floor(d*s);
    float h = hash(c);
    float b = smoothstep(0.985, 1.0, h);
    vec3 f = fract(d*s)-0.5;
    col += b * smoothstep(0.35, 0.0, length(f)) * mix(vec3(0.7,0.8,1.0), vec3(1.0,0.85,0.7), hash(c+3.0));
  }
  float neb = fbm(d*2.5, 4);
  col += vec3(0.25,0.12,0.5) * smoothstep(0.1,0.9,neb) * 0.25;
  return col;
}

vec3 diskColor(float r, float ang, vec3 rayDir, vec3 hit){
  float t = clamp((r - 3.0) / 9.0, 0.0, 1.0);
  vec3 hot = vec3(1.0, 0.92, 0.75);
  vec3 warm = vec3(1.0, 0.55, 0.18);
  vec3 cool = vec3(0.55, 0.18, 0.05);
  vec3 c = mix(hot, warm, smoothstep(0.0, 0.35, t));
  c = mix(c, cool, smoothstep(0.35, 1.0, t));
  float swirl = fbm(vec3(r*1.4, ang*3.0 - uTime*0.35*(4.0/r), 0.0), 4);
  float rings = 0.6 + 0.4*sin(r*9.0 + swirl*3.0);
  // Relativistic beaming: the side moving toward the camera appears brighter.
  vec3 vel = normalize(vec3(-hit.z, 0.0, hit.x));
  float beam = 1.0 + 0.85 * dot(vel, -rayDir);
  float inten = (1.0 - t) * (1.0 - t) * 2.6 + 0.15;
  return c * inten * rings * (0.6 + 0.5*swirl) * beam * beam;
}

void main(){
  vec2 uv = (vUv - 0.5) * vec2(uRes.x/uRes.y, 1.0);
  float camR = 17.0;
  float elev = 0.11 + uMouse.y*0.18;
  float azim = uTime*0.02 + uMouse.x*0.6;
  vec3 ro = camR * vec3(cos(elev)*sin(azim), sin(elev), -cos(elev)*cos(azim));
  vec3 fw = normalize(-ro);
  vec3 rt = normalize(cross(fw, vec3(0.0,1.0,0.0)));
  vec3 up = cross(rt, fw);
  vec3 rd = normalize(fw + uv.x*rt*0.85 + uv.y*up*0.85);

  vec3 pos = ro;
  vec3 vel = rd;
  vec3 hvec = cross(pos, vel);
  float h2 = dot(hvec, hvec);
  vec3 col = vec3(0.0);
  float alpha = 0.0;
  bool captured = false;

  for(int i=0;i<160;i++){
    if(i >= uSteps) break;
    float r2 = dot(pos,pos);
    float r = sqrt(r2);
    float dt = clamp(0.09 * r, 0.04, 1.2);
    vec3 acc = -1.5 * h2 * pos / (r2*r2*r);
    vec3 prev = pos;
    vel += acc * dt;
    pos += vel * dt;
    if(dot(pos,pos) < 1.0){ captured = true; break; }
    if(prev.y * pos.y < 0.0){
      float k = prev.y / (prev.y - pos.y);
      vec3 hit = mix(prev, pos, k);
      float hr = length(hit.xz);
      if(hr > 3.0 && hr < 12.0){
        float ang = atan(hit.z, hit.x);
        float a = smoothstep(3.0, 3.4, hr) * smoothstep(12.0, 9.0, hr) * 0.92;
        col += (1.0 - alpha) * diskColor(hr, ang, normalize(vel), hit) * a;
        alpha += (1.0 - alpha) * a;
        if(alpha > 0.98) break;
      }
    }
    if(r2 > 900.0) break;
  }
  if(!captured) col += (1.0 - alpha) * stars(normalize(vel));
  // tone map
  col = 1.0 - exp(-col * 1.25);
  col = pow(col, vec3(0.92));
  gl_FragColor = vec4(col, 1.0);
}
`;

const VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export function BlackHoleScene({ steps = 110, animate = true }: { steps?: number; animate?: boolean }) {
  const size = useThree((s) => s.size);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uRes: { value: new THREE.Vector2(1, 1) },
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uSteps: { value: steps },
        },
        depthTest: false,
        depthWrite: false,
      }),
    [steps],
  );
  const geometry = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
  useEffect(
    () => () => {
      material.dispose();
      geometry.dispose();
    },
    [material, geometry],
  );

  const target = useMemo(() => new THREE.Vector2(), []);
  useFrame((state, delta) => {
    material.uniforms.uRes!.value.set(size.width, size.height);
    if (animate) material.uniforms.uTime!.value = state.clock.elapsedTime;
    target.set(state.pointer.x, state.pointer.y);
    (material.uniforms.uMouse!.value as THREE.Vector2).lerp(target, Math.min(1, delta * 2));
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}
