import { motion, type HTMLMotionProps } from 'framer-motion';
import { useMotionPreference } from '@/hooks/useMotionPreference';

/** Fades/slides content in once it scrolls into view. Static when reduced motion is on. */
export function Reveal({ delay = 0, y = 24, children, ...rest }: HTMLMotionProps<'div'> & { delay?: number; y?: number }) {
  const { reduced } = useMotionPreference();
  if (reduced) return <motion.div {...rest}>{children}</motion.div>;
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
