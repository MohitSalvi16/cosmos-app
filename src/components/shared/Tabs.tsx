import { motion } from 'framer-motion';
import { useRef, type KeyboardEvent } from 'react';

export interface TabDef {
  id: string;
  label: string;
}

/** WAI-ARIA tablist with arrow-key navigation and an animated indicator. */
export function Tabs({
  tabs,
  active,
  onChange,
  label,
  idBase,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
  label: string;
  /** Shared with tabPanelProps() so tabs and panels reference each other. */
  idBase: string;
}) {
  const group = idBase;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent, idx: number) => {
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    const t = tabs[next];
    if (t) {
      onChange(t.id);
      refs.current[next]?.focus();
    }
  };

  return (
    <div role="tablist" aria-label={label} className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-white/10">
      {tabs.map((t, i) => {
        const selected = t.id === active;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`${group}-tab-${t.id}`}
            aria-selected={selected}
            aria-controls={`${group}-panel-${t.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`relative shrink-0 px-4 py-3 text-[12px] uppercase tracking-[0.18em] transition-colors ${selected ? 'text-stellar' : 'text-muted hover:text-stellar'}`}
          >
            {t.label}
            {selected && <motion.span layoutId={`${group}-indicator`} className="absolute inset-x-2 -bottom-px h-px bg-cyan-cosmic" />}
          </button>
        );
      })}
    </div>
  );
}

export function tabPanelProps(idBase: string, id: string) {
  return { role: 'tabpanel' as const, id: `${idBase}-panel-${id}`, 'aria-labelledby': `${idBase}-tab-${id}`, tabIndex: 0 };
}
