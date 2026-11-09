// GLSL shared by the procedural space visuals. All surfaces are procedural artistic renderings.

/** 3D simplex noise — Ian McEwan / Ashima Arts (MIT). */
export const NOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p, int oct){
  float a=0.5; float s=0.0;
  for(int i=0;i<6;i++){ if(i>=oct) break; s+=a*snoise(p); p*=2.03; a*=0.5; }
  return s;
}
`;

export const PLANET_VERTEX = /* glsl */ `
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vViewDir;
void main(){
  vObj = normalize(position);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vViewDir = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

/** Surface style ids — keep in sync with STYLE_ID in PlanetMesh.tsx. */
export const PLANET_FRAGMENT = /* glsl */ `
uniform int uStyle;
uniform vec3 uA; uniform vec3 uB; uniform vec3 uC;
uniform vec3 uAtmo;
uniform vec3 uLightPos;
uniform float uTime;
uniform float uSeed;
uniform int uOctaves;
uniform float uOpacity;
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vViewDir;
${NOISE_GLSL}

vec3 surface(vec3 p, out float spec){
  spec = 0.0;
  vec3 q = p * 2.0 + uSeed;
  if(uStyle==1){ // rocky / cratered (Mercury)
    float n = fbm(q*1.6, uOctaves);
    float c = smoothstep(0.55,0.75,abs(snoise(q*5.0)));
    vec3 col = mix(uA,uB,smoothstep(-0.5,0.6,n));
    return mix(col, uC, c*0.35);
  }
  if(uStyle==2){ // Venus clouds
    float n = fbm(vec3(q.x*0.8, q.y*3.0, q.z*0.8) + vec3(uTime*0.01,0.0,0.0), uOctaves);
    return mix(uA, mix(uB,uC,0.5+0.5*n), smoothstep(-0.6,0.8,n+p.y*0.3));
  }
  if(uStyle==3){ // Earth
    float n = fbm(q*1.3, uOctaves);
    float land = smoothstep(0.02,0.08,n);
    vec3 ocean = mix(uA*0.7, uA*1.4, smoothstep(-0.6,0.0,n));
    vec3 ground = mix(uB, vec3(0.55,0.47,0.33), smoothstep(0.15,0.5,n));
    vec3 col = mix(ocean, ground, land);
    float ice = smoothstep(0.78,0.86,abs(p.y)+n*0.06);
    spec = (1.0-land)*(1.0-ice);
    return mix(col, uC, ice);
  }
  if(uStyle==4){ // Mars
    float n = fbm(q*1.5, uOctaves);
    vec3 col = mix(uA,uB,smoothstep(-0.4,0.3,n));
    col = mix(col,uC,smoothstep(0.35,0.7,n)*0.6);
    float cap = smoothstep(0.88,0.94,abs(p.y)+n*0.03);
    return mix(col, vec3(0.95,0.93,0.9), cap);
  }
  if(uStyle==5 || uStyle==6){ // gas / ice giant bands
    float warp = fbm(q*vec3(1.0,0.4,1.0) + vec3(uTime*0.015,0.0,0.0), uOctaves);
    float lat = p.y + warp*(uStyle==5 ? 0.06 : 0.03);
    float bands = sin(lat*(uStyle==5 ? 22.0 : 9.0)) * 0.5 + 0.5;
    float fine = sin(lat*61.0 + warp*3.0)*0.5+0.5;
    vec3 col = mix(uA, uB, bands);
    col = mix(col, uC, fine*(uStyle==5 ? 0.35 : 0.15));
    if(uStyle==5){ // storm spot
      vec3 spot = normalize(vec3(0.6,-0.35,0.72));
      float d = distance(p, spot);
      col = mix(col, uA*1.25, smoothstep(0.16,0.08,d)*0.8);
    }
    return col;
  }
  if(uStyle==7){ // grey moon
    float n = fbm(q*2.0, uOctaves);
    float maria = smoothstep(0.05,0.25,fbm(q*0.7+3.0, 3));
    vec3 col = mix(uB, uA, maria*0.7);
    return mix(col, uC, smoothstep(0.2,0.7,n)*0.5);
  }
  if(uStyle==8){ // icy moon (Enceladus)
    float n = fbm(q*2.5, uOctaves);
    float crack = 1.0 - smoothstep(0.0,0.05,abs(snoise(q*3.5)));
    return mix(mix(uA,uC,0.6+0.4*n), vec3(0.55,0.75,0.9), crack*smoothstep(0.2,-0.6,p.y)*0.8);
  }
  if(uStyle==9){ // Titan haze
    float n = fbm(vec3(q.x, q.y*2.0, q.z) + uTime*0.005, uOctaves);
    return mix(uA, uB, 0.55 + 0.25*n + 0.1*p.y);
  }
  if(uStyle==10){ // Europa — lineae
    float n = fbm(q*1.8, uOctaves);
    float l1 = 1.0 - smoothstep(0.0,0.035,abs(snoise(q*1.7)));
    float l2 = 1.0 - smoothstep(0.0,0.025,abs(snoise(q*3.1+7.0)));
    vec3 col = mix(uB, uC, 0.5+0.5*n);
    return mix(col, uA, max(l1,l2*0.7));
  }
  return uB;
}

void main(){
  vec3 N = normalize(vNormalW);
  // uLightPos holds the world-space direction from the body toward its light source.
  vec3 L = normalize(uLightPos);
  float spec;
  vec3 base = surface(vObj, spec);
  float ndl = dot(N, L);
  float diff = smoothstep(-0.15, 0.6, ndl);
  vec3 col = base * (0.035 + diff * 1.05);
  vec3 H = normalize(L + vViewDir);
  col += spec * pow(max(dot(N,H),0.0), 60.0) * 0.6 * diff;
  float fres = pow(1.0 - max(dot(N, vViewDir), 0.0), 3.0);
  col += uAtmo * fres * (0.25 + 0.75*diff) * 0.9;
  gl_FragColor = vec4(col, uOpacity);
  #include <colorspace_fragment>
}
`;

export const ATMOSPHERE_VERTEX = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vViewDir;
void main(){
  vec4 world = modelMatrix * vec4(position,1.0);
  vNormalW = normalize(mat3(modelMatrix)*normal);
  vViewDir = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const ATMOSPHERE_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uLightPos;
uniform float uIntensity;
uniform float uOpacity;
varying vec3 vNormalW;
varying vec3 vViewDir;
void main(){
  vec3 N = normalize(vNormalW);
  float rim = pow(1.0 - abs(dot(N, vViewDir)), 2.2);
  float lit = smoothstep(-0.35, 0.5, dot(N, normalize(uLightPos)));
  gl_FragColor = vec4(uColor * rim * uIntensity * (0.15 + lit), rim * uOpacity);
}
`;

export const CLOUD_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform vec3 uLightPos;
uniform float uOpacity;
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vViewDir;
${NOISE_GLSL}
void main(){
  vec3 p = vObj*2.4 + vec3(uTime*0.01, 0.0, 0.0);
  float n = fbm(p, 5);
  float a = smoothstep(0.05, 0.45, n) * 0.85;
  float lit = smoothstep(-0.2, 0.6, dot(normalize(vNormalW), normalize(uLightPos)));
  gl_FragColor = vec4(vec3(1.0) * (0.05 + lit), a * uOpacity);
}
`;

export const RING_VERTEX = /* glsl */ `
varying vec2 vPos;
void main(){
  vPos = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
`;

export const RING_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uInner;
uniform float uOuter;
uniform float uOpacity;
varying vec2 vPos;
float hash(float n){ return fract(sin(n)*43758.5453); }
void main(){
  float r = length(vPos);
  float t = (r - uInner) / (uOuter - uInner);
  if(t<0.0||t>1.0) discard;
  float bands = 0.55 + 0.45*sin(t*120.0 + sin(t*17.0)*4.0);
  bands *= 0.6 + 0.4*hash(floor(t*90.0));
  float gap = smoothstep(0.60,0.62,t)*(1.0-smoothstep(0.66,0.68,t)); // Cassini-like division
  float edge = smoothstep(0.0,0.04,t)*(1.0-smoothstep(0.96,1.0,t));
  float a = bands * edge * (1.0-gap*0.9) * uOpacity;
  gl_FragColor = vec4(uColor * (0.6+0.6*bands), a);
}
`;

export const SUN_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform vec3 uA; uniform vec3 uB; uniform vec3 uC;
uniform float uOpacity;
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vViewDir;
${NOISE_GLSL}
void main(){
  vec3 p = vObj*3.0;
  float n = fbm(p + vec3(0.0, uTime*0.04, uTime*0.02), 5);
  float g = fbm(p*4.0 - uTime*0.05, 3);
  vec3 col = mix(uA, uB, smoothstep(-0.5, 0.5, n));
  col = mix(col, uC, smoothstep(0.2, 0.8, g)*0.6);
  float limb = pow(max(dot(normalize(vNormalW), vViewDir), 0.0), 0.45);
  gl_FragColor = vec4(col * (0.55 + 0.75*limb) * 1.4, uOpacity);
  #include <colorspace_fragment>
}
`;

export const GLOW_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
void main(){
  float d = distance(vUv, vec2(0.5));
  float a = pow(max(0.0, 1.0 - d*2.0), 2.6);
  gl_FragColor = vec4(uColor * a, a * uOpacity);
}
`;

export const UV_VERTEX = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
`;

export const NEBULA_FRAGMENT = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uTime;
uniform float uSeed;
uniform float uOpacity;
varying vec2 vUv;
${NOISE_GLSL}
void main(){
  vec2 c = vUv - 0.5;
  float r = length(c);
  vec3 p = vec3(c*3.0, uSeed + uTime*0.008);
  float n = fbm(p + fbm(p*1.7 + 4.0, 3), 5);
  float n2 = fbm(p*2.3 - 2.0, 4);
  float falloff = smoothstep(0.5, 0.05, r);
  float density = smoothstep(-0.25, 0.75, n) * falloff;
  vec3 col = mix(uColorA, uColorB, smoothstep(-0.3, 0.6, n2));
  float dust = smoothstep(0.1, 0.6, n2) * 0.55;
  col *= (1.0 - dust*falloff);
  gl_FragColor = vec4(col * density, density * uOpacity);
}
`;

export const STAR_VERTEX = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;
uniform float uTime;
uniform float uPixelRatio;
uniform float uTwinkle;
varying vec3 vColor;
varying float vFlicker;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float tw = 1.0 - uTwinkle * 0.35 * (0.5 + 0.5*sin(uTime*1.7 + aPhase*6.2831));
  vFlicker = tw;
  vColor = aColor;
  gl_PointSize = aSize * uPixelRatio * (220.0 / -mv.z);
  gl_PointSize = clamp(gl_PointSize, 0.0, 14.0 * uPixelRatio);
  gl_Position = projectionMatrix * mv;
}
`;

export const STAR_FRAGMENT = /* glsl */ `
uniform float uOpacity;
varying vec3 vColor;
varying float vFlicker;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float core = smoothstep(0.5, 0.0, d);
  float a = pow(core, 2.2) * vFlicker * uOpacity;
  if(a < 0.003) discard;
  gl_FragColor = vec4(vColor * a, a);
}
`;
