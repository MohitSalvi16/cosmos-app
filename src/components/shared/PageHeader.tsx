import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

export function PageHeader({ eyebrow, title, intro, children }: { eyebrow: string; title: ReactNode; intro?: ReactNode; children?: ReactNode }) {
  return (
    <header className="container-cosmos pb-10 pt-32 sm:pt-40">
      <Reveal>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display mt-4 max-w-4xl text-5xl sm:text-6xl lg:text-7xl">{title}</h1>
        {intro && <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{intro}</p>}
        {children && <div className="mt-6 flex flex-wrap items-center gap-3">{children}</div>}
      </Reveal>
    </header>
  );
}
