import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useSearch } from '@/components/search/SearchContext';
import { useMotionPreference } from '@/hooks/useMotionPreference';

export const NAV_ITEMS = [
  { to: '/', label: 'Discover', end: true },
  { to: '/planets', label: 'Planets' },
  { to: '/exoplanets', label: 'Exoplanets' },
  { to: '/galaxies', label: 'Galaxies' },
  { to: '/stars', label: 'Stars' },
  { to: '/black-holes', label: 'Black Holes' },
  { to: '/asteroids', label: 'Asteroids' },
  { to: '/gallery', label: 'NASA Gallery' },
];

export function NavBar() {
  const { openSearch } = useSearch();
  const { reduced } = useMotionPreference();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled || mobileOpen ? 'border-b border-white/[0.06] bg-void/70 backdrop-blur-xl' : 'bg-transparent'}`}>
      <nav aria-label="Primary" className="container-cosmos flex h-16 items-center gap-4 2xl:gap-6">
        <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="COSMOS home">
          <span className="relative block h-5 w-5" aria-hidden>
            <span className="absolute inset-[5px] rounded-full bg-gold shadow-[0_0_14px_rgba(255,200,120,0.8)]" />
            <span className="absolute inset-0 -rotate-[20deg] rounded-[50%] border border-cyan-cosmic/70 [transform:rotate(-20deg)_scaleY(0.35)]" />
          </span>
          <span className="font-serif text-xl tracking-[0.28em] text-stellar">COSMOS</span>
        </Link>

        <ul className="ml-auto hidden min-w-0 items-center xl:flex 2xl:gap-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to} className="shrink-0">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative whitespace-nowrap px-2 py-2 text-[11px] uppercase tracking-[0.12em] transition-colors 2xl:px-3 2xl:tracking-[0.2em] ${isActive ? 'text-stellar' : 'text-muted hover:text-stellar'}`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && <motion.span layoutId="nav-active" className="absolute inset-x-2 -bottom-0.5 h-px bg-cyan-cosmic 2xl:inset-x-3" transition={{ duration: reduced ? 0 : 0.4 }} />}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => openSearch()}
          className="ml-auto inline-flex shrink-0 items-center gap-2 whitespace-nowrap border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-muted transition hover:border-cyan-cosmic/50 hover:text-stellar xl:ml-2"
          aria-label="Search (Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden border border-white/10 px-1.5 font-mono text-[10px] text-muted sm:inline">⌘K</kbd>
        </button>

        <button
          type="button"
          className="p-2 text-stellar xl:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden xl:hidden"
          >
            <ul className="container-cosmos grid grid-cols-2 gap-px pb-6 pt-2 sm:grid-cols-4">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `block px-3 py-3 text-xs uppercase tracking-[0.2em] ${isActive ? 'text-cyan-cosmic' : 'text-stellar/80'}`}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <NavLink to="/explore" className="block px-3 py-3 text-xs uppercase tracking-[0.2em] text-gold">
                  3D Explorer
                </NavLink>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
