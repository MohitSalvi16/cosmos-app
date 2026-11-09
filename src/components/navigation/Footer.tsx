import { Link } from 'react-router-dom';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { NAV_ITEMS } from './NavBar';

export function Footer() {
  const { reduced, systemReduced, userReduced, setUserReduced } = useMotionPreference();
  return (
    <footer className="mt-32 border-t border-white/[0.06]">
      <div className="container-cosmos grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-serif text-2xl tracking-[0.28em]">COSMOS</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            An independent educational project. It uses public data from NASA Open APIs, the NASA Exoplanet Archive (operated by Caltech/IPAC) and the
            NASA Image and Video Library. COSMOS is not affiliated with or endorsed by NASA. Image credits belong to their respective creators as
            listed with each image.
          </p>
          <p className="mt-3 max-w-md text-xs leading-relaxed text-muted/80">
            3D planets, nebulae, galaxies and the black-hole simulation are procedural artistic renderings — not photographs — and scenes are not to scale.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="data-label mb-4">Explore</p>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {NAV_ITEMS.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="text-stellar/80 hover:text-cyan-cosmic">
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/explore" className="text-stellar/80 hover:text-cyan-cosmic">
                3D Explorer
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <p className="data-label mb-4">Accessibility</p>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-stellar/85">
            <input
              type="checkbox"
              className="mt-1 accent-cyan-cosmic"
              checked={reduced}
              disabled={systemReduced}
              onChange={(e) => setUserReduced(e.target.checked)}
            />
            <span>
              Reduce motion
              <span className="block text-xs text-muted">
                {systemReduced ? 'Enabled by your system preference.' : userReduced ? 'Animations are minimised.' : 'Turn off cinematic camera motion and transitions.'}
              </span>
            </span>
          </label>
          <p className="mt-6 text-xs text-muted">
            Data:{' '}
            <a className="link-underline" href="https://api.nasa.gov/" target="_blank" rel="noopener noreferrer">
              api.nasa.gov
            </a>{' '}
            ·{' '}
            <a className="link-underline" href="https://exoplanetarchive.ipac.caltech.edu/" target="_blank" rel="noopener noreferrer">
              Exoplanet Archive
            </a>{' '}
            ·{' '}
            <a className="link-underline" href="https://images.nasa.gov/" target="_blank" rel="noopener noreferrer">
              images.nasa.gov
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
