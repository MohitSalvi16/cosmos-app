import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EXO_ROWS, jsonResponse } from '@/test/fixtures';
import { useAsync } from './useAsync';
import { useDebounce } from './useDebounce';
import { useExoplanetList } from './useExoplanetList';
import { MotionProvider, useMotionPreference } from './useMotionPreference';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useDebounce', () => {
  it('only emits the latest value after the delay', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), { initialProps: { v: 'a' } });
    rerender({ v: 'ab' });
    rerender({ v: 'abc' });
    expect(result.current).toBe('a');
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('a');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('abc');
  });
});

describe('useAsync', () => {
  it('resolves data and clears loading', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve(42), []));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe(42);
    expect(result.current.error).toBeNull();
  });

  it('captures errors and can reload', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce('ok');
    const { result } = renderHook(() => useAsync(fn, []));
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.data).toBe('ok'));
    expect(result.current.error).toBeNull();
  });

  it('aborts the in-flight request when deps change or on unmount', async () => {
    const signals: AbortSignal[] = [];
    const fn = (s: AbortSignal) => {
      signals.push(s);
      return new Promise<string>(() => undefined);
    };
    const { rerender, unmount } = renderHook(({ d }) => useAsync(fn, [d]), { initialProps: { d: 1 } });
    rerender({ d: 2 });
    expect(signals[0]!.aborted).toBe(true);
    unmount();
    expect(signals[1]!.aborted).toBe(true);
  });

  it('does not run when disabled', () => {
    const fn = vi.fn().mockResolvedValue(1);
    const { result } = renderHook(() => useAsync(fn, [], false));
    expect(fn).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });
});

describe('useExoplanetList', () => {
  it('loads the first page and total, then appends unique rows on loadMore', async () => {
    const page1 = Array.from({ length: 30 }, (_, i) => ({ ...EXO_ROWS[0]!, pl_name: `P${String(i).padStart(2, '0')}`, disc_year: 2020 }));
    const page2 = [page1[29]!, { ...EXO_ROWS[0]!, pl_name: 'Q01', disc_year: 2019 }];
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      const q = new URL(url, 'http://x').searchParams.get('query') ?? '';
      if (q.startsWith('select count')) return Promise.resolve(jsonResponse([{ n: 31 }]));
      if (q.includes('disc_year < 2020')) return Promise.resolve(jsonResponse(page2));
      return Promise.resolve(jsonResponse(page1));
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useExoplanetList({}, 'disc_year_desc'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rows).toHaveLength(30);
    expect(result.current.hasMore).toBe(true);
    await waitFor(() => expect(result.current.total).toBe(31));

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.rows).toHaveLength(31)); // duplicate P29 dropped
    expect(result.current.rows.at(-1)?.pl_name).toBe('Q01');
    expect(result.current.hasMore).toBe(false);
  });

  it('surfaces errors for retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'Archive down' }, 502)));
    const { result } = renderHook(() => useExoplanetList({ name: 'x' }, 'name_asc'));
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.rows).toEqual([]);
  });
});

describe('MotionProvider', () => {
  function Probe() {
    const { reduced, setUserReduced } = useMotionPreference();
    return (
      <button type="button" onClick={() => setUserReduced(!reduced)}>
        {reduced ? 'reduced' : 'full'}
      </button>
    );
  }

  it('lets the user opt into reduced motion and persists it', async () => {
    render(
      <MotionProvider>
        <Probe />
      </MotionProvider>,
    );
    expect(screen.getByRole('button')).toHaveTextContent('full');
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('reduced');
    expect(window.localStorage.getItem('cosmos.reducedMotion')).toBe('yes');
    expect(document.documentElement.dataset.reducedMotion).toBe('true');
  });
});
