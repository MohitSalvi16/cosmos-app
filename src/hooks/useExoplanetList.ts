import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchExoplanetCount, fetchExoplanetPage } from '@/services/nasa/exoplanets';
import { isAbortError } from '@/services/nasa/http';
import type { ExoplanetCursor, ExoplanetFilters, ExoplanetRow, ExoplanetSort, FetchMeta } from '@/types';

export interface ExoplanetListState {
  rows: ExoplanetRow[];
  total: number | null;
  loading: boolean;
  loadingMore: boolean;
  error: unknown;
  hasMore: boolean;
  meta?: FetchMeta;
  loadMore: () => void;
  retry: () => void;
}

/** Progressive (keyset-paginated) loading of live exoplanet rows for the given filters and sort. */
export function useExoplanetList(filters: ExoplanetFilters, sort: ExoplanetSort): ExoplanetListState {
  const [rows, setRows] = useState<ExoplanetRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [cursor, setCursor] = useState<ExoplanetCursor | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [meta, setMeta] = useState<FetchMeta>();
  const [nonce, setNonce] = useState(0);
  const moreController = useRef<AbortController | null>(null);
  const key = JSON.stringify([filters, sort]);

  useEffect(() => {
    const controller = new AbortController();
    moreController.current?.abort();
    setLoading(true);
    setError(null);
    setRows([]);
    setTotal(null);
    setCursor(undefined);
    fetchExoplanetPage(filters, sort, undefined, controller.signal)
      .then((res) => {
        setRows(res.data.rows);
        setCursor(res.data.nextCursor);
        setMeta(res.meta);
      })
      .catch((err: unknown) => {
        if (!isAbortError(err)) setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    fetchExoplanetCount(filters, sort, controller.signal)
      .then(setTotal)
      .catch(() => undefined); // the count is a nicety; the list carries the error state
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);

  useEffect(() => () => moreController.current?.abort(), []);

  const loadMore = useCallback(() => {
    if (!cursor || loadingMore) return;
    const controller = new AbortController();
    moreController.current = controller;
    setLoadingMore(true);
    fetchExoplanetPage(filters, sort, cursor, controller.signal)
      .then((res) => {
        setRows((prev) => {
          const seen = new Set(prev.map((r) => r.pl_name));
          return [...prev, ...res.data.rows.filter((r) => !seen.has(r.pl_name))];
        });
        setCursor(res.data.nextCursor);
        setMeta(res.meta);
      })
      .catch((err: unknown) => {
        if (!isAbortError(err)) setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingMore(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, loadingMore, key]);

  const retry = useCallback(() => setNonce((n) => n + 1), []);

  return { rows, total, loading, loadingMore, error, hasMore: Boolean(cursor), meta, loadMore, retry };
}
