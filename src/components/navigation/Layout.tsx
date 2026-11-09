import { AnimatePresence, motion } from 'framer-motion';
import { Suspense, useEffect } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { CommandPalette } from '@/components/search/CommandPalette';
import { Cursor } from '@/components/shared/Cursor';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { LoadingState } from '@/components/shared/States';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { Footer } from './Footer';
import { NavBar } from './NavBar';

function RouteFallback() {
  return (
    <div className="container-cosmos flex min-h-[70vh] items-center justify-center">
      <LoadingState label="Charting a course" />
    </div>
  );
}

export function Layout() {
  const location = useLocation();
  const outlet = useOutlet();
  const { reduced } = useMotionPreference();

  // Scroll to top on navigation, or to the hash target when present.
  useEffect(() => {
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }), 350);
      return () => clearTimeout(t);
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.hash, reduced]);

  return (
    <div className="grain relative min-h-screen">
      <a href="#main" className="sr-only-focusable fixed left-4 top-4 z-[90] bg-stellar px-4 py-2 text-sm text-void">
        Skip to content
      </a>
      <NavBar />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          id="main"
          key={location.pathname}
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          tabIndex={-1}
          className="focus:outline-none"
        >
          <ErrorBoundary label="This page">
            <Suspense fallback={<RouteFallback />}>{outlet}</Suspense>
          </ErrorBoundary>
        </motion.main>
      </AnimatePresence>
      <Footer />
      <CommandPalette />
      <Cursor />
    </div>
  );
}
