import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, FastForward } from 'lucide-react';
import { lazy, Suspense, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeviceTier } from '@/hooks/useDevice';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import type { IntroState } from './HeroScene';

gsap.registerPlugin(ScrollTrigger);

// The 3D scene is code-split so the initial bundle stays light; a CSS starfield shows meanwhile.
const HeroScene = lazy(() => import('./HeroScene'));

export const HEADLINE = 'WE ARE A SMALL PART OF SOMETHING INFINITE.';
const FINAL: IntroState = { stars: 1, nebula: 1, planet: 1, dust: 1, camZ: 8, scroll: 0 };

export function Hero({ dataAnchor }: { dataAnchor: string }) {
  const { reduced } = useMotionPreference();
  const tier = useDeviceTier();
  const navigate = useNavigate();
  const section = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [introDone, setIntroDone] = useState(reduced);

  // One mutable object shared with the render loop — animating it never triggers React renders.
  const intro = useMemo<IntroState>(() => (reduced ? { ...FINAL } : { stars: 0, nebula: 0, planet: 0, dust: 0, camZ: 46, scroll: 0 }), [reduced]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (reduced) {
        Object.assign(intro, FINAL);
        gsap.set('[data-hero-reveal]', { opacity: 1, y: 0, filter: 'none' });
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' }, onComplete: () => setIntroDone(true) });
      tl.to(intro, { stars: 1, duration: 2.6 }, 0.25)
        .to(intro, { dust: 1, duration: 2 }, 0.8)
        .to(intro, { nebula: 1, duration: 3.2, ease: 'sine.inOut' }, 1.1)
        .to(intro, { camZ: 8, duration: 6.5, ease: 'power3.inOut' }, 0.3)
        .to(intro, { planet: 1, duration: 2.8, ease: 'sine.out' }, 2.6)
        .fromTo(
          '[data-hero-word]',
          { opacity: 0, y: 36, filter: 'blur(10px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.3, stagger: 0.075, ease: 'expo.out' },
          3.3,
        )
        .fromTo('[data-hero-reveal]', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.12 }, 4.5);
      tlRef.current = tl;

      // Scroll: keep travelling forward and let the title drift away.
      ScrollTrigger.create({
        trigger: section.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
        onUpdate: (self) => {
          intro.scroll = self.progress;
        },
      });
      gsap.to(content.current, {
        yPercent: -18,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: section.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
      });
    }, section);
    return () => {
      ctx.revert();
      tlRef.current = null;
    };
  }, [reduced, intro]);

  const skip = () => {
    tlRef.current?.progress(1);
    setIntroDone(true);
  };

  const words = HEADLINE.split(' ');

  return (
    <section ref={section} className="relative min-h-[100svh] w-full overflow-hidden" aria-labelledby="hero-title">
      <div className="css-starfield absolute inset-0" aria-hidden />
      <Suspense fallback={null}>
        <HeroScene intro={intro} reduced={reduced} tier={tier} />
      </Suspense>
      {/* Vignette and horizon gradients keep text readable over the scene. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(3,4,10,0.85)_100%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-void via-void/60 to-transparent" aria-hidden />

      <div ref={content} className="container-cosmos relative z-10 flex min-h-[100svh] flex-col justify-end pb-16 pt-28 sm:pb-20">
        <p data-hero-reveal className="eyebrow mb-6 opacity-0">
          COSMOS — Explore the observable universe
        </p>
        <h1 id="hero-title" className="display max-w-5xl text-[clamp(2.4rem,min(7.4vw,11.5svh),6.8rem)]" aria-label={HEADLINE}>
          {words.map((w, i) => (
            <span key={i} aria-hidden className="inline-block overflow-hidden pr-[0.25em] align-bottom">
              <span data-hero-word className={`inline-block ${reduced ? '' : 'opacity-0'} ${w === 'INFINITE.' ? 'italic text-gold' : ''}`}>
                {w}
              </span>
            </span>
          ))}
        </h1>
        <p data-hero-reveal className="mt-6 max-w-xl text-base leading-relaxed text-stellar/75 opacity-0 sm:text-lg">
          Explore planets, distant galaxies, black holes, and worlds beyond our own — through the lens of real astronomical discovery.
        </p>
        <div data-hero-reveal className="mt-9 flex flex-wrap gap-3 opacity-0">
          <button type="button" className="btn-primary" onClick={() => navigate('/explore')}>
            Enter the universe
          </button>
          <a className="btn-ghost" href={`#${dataAnchor}`}>
            Explore NASA data <ArrowDown className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </div>

      {!introDone && (
        <button
          type="button"
          onClick={skip}
          className="absolute right-4 top-24 z-20 inline-flex items-center gap-2 border border-white/15 bg-void/40 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-muted backdrop-blur hover:text-stellar sm:right-8"
        >
          <FastForward className="h-3.5 w-3.5" aria-hidden /> Skip intro
        </button>
      )}
    </section>
  );
}
