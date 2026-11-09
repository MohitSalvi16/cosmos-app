import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface MotionContextValue {
  /** True when the OS requests reduced motion OR the user enabled it in COSMOS. */
  reduced: boolean;
  systemReduced: boolean;
  userReduced: boolean;
  setUserReduced: (v: boolean) => void;
}

const STORAGE_KEY = 'cosmos.reducedMotion';
const MotionContext = createContext<MotionContextValue | null>(null);

function readStored(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'yes';
  } catch {
    return false;
  }
}

export function getSystemReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const [systemReduced, setSystemReduced] = useState(getSystemReducedMotion);
  const [userReduced, setUserReducedState] = useState(readStored);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setSystemReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const reduced = systemReduced || userReduced;

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = reduced ? 'true' : 'false';
  }, [reduced]);

  const value = useMemo<MotionContextValue>(
    () => ({
      reduced,
      systemReduced,
      userReduced,
      setUserReduced: (v: boolean) => {
        setUserReducedState(v);
        try {
          if (v) window.localStorage.setItem(STORAGE_KEY, 'yes');
          else window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
      },
    }),
    [reduced, systemReduced, userReduced],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotionPreference(): MotionContextValue {
  const ctx = useContext(MotionContext);
  if (!ctx) {
    const sys = getSystemReducedMotion();
    return { reduced: sys, systemReduced: sys, userReduced: false, setUserReduced: () => undefined };
  }
  return ctx;
}
