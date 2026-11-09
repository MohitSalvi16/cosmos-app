import { useEffect, useState, type RefObject } from 'react';

let webglCache: boolean | null = null;

/** Detects WebGL support once (creating a throwaway context), cached for the session. */
export function detectWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    webglCache = Boolean(gl);
    (gl as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webglCache = false;
  }
  return webglCache;
}

export function useWebGLSupport(): boolean {
  const [ok] = useState(() => (typeof document === 'undefined' ? false : detectWebGL()));
  return ok;
}

export type DeviceTier = 'low' | 'high';

export function getDeviceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'low';
  const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  const small = window.innerWidth < 768;
  const cores = navigator.hardwareConcurrency ?? 4;
  return coarse || small || cores <= 4 ? 'low' : 'high';
}

export function useDeviceTier(): DeviceTier {
  const [tier] = useState(getDeviceTier);
  return tier;
}

export function useFinePointer(): boolean {
  const [fine, setFine] = useState(() => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(pointer: fine)');
    const on = () => setFine(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return fine;
}

/** True while the element is (nearly) on screen — used to pause 3D rendering when hidden. */
export function useOnScreen(ref: RefObject<Element>, rootMargin = '100px'): boolean {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return visible;
}

/** True while the document tab is visible. */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden');
  useEffect(() => {
    const on = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  return visible;
}
