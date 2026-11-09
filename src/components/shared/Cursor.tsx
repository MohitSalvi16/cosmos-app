import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useFinePointer } from '@/hooks/useDevice';
import { useMotionPreference } from '@/hooks/useMotionPreference';

/**
 * A soft ring that trails the pointer on desktop. It is purely decorative: the native cursor is
 * kept (never hidden), and it is disabled for touch devices and reduced motion.
 */
export function Cursor() {
  const fine = useFinePointer();
  const { reduced } = useMotionPreference();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 380, damping: 32, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 380, damping: 32, mass: 0.6 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!fine || reduced) return;
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const target = e.target as Element | null;
      setActive(Boolean(target?.closest('a, button, [role="button"], input, select, [data-cursor="active"]')));
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [fine, reduced, x, y]);

  if (!fine || reduced) return null;
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[70] rounded-full border border-cyan-cosmic/60 mix-blend-screen"
      style={{ x: sx, y: sy, translateX: '-50%', translateY: '-50%' }}
      animate={{ width: active ? 44 : 22, height: active ? 44 : 22, opacity: active ? 0.9 : 0.5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
    />
  );
}
