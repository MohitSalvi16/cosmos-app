import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { clearClientCache } from '@/services/nasa/http';

const isDom = typeof window !== 'undefined';

// jsdom lacks these browser APIs used by the UI.
if (isDom && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
if (isDom) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).IntersectionObserver ??= IO;
  Element.prototype.scrollIntoView ??= function scrollIntoView() {};
}

afterEach(() => {
  clearClientCache();
  if (!isDom) return;
  cleanup();
  window.localStorage.clear();
});
