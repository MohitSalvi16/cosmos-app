import { Link } from 'react-router-dom';
import { useSearch } from '@/components/search/SearchContext';

export default function NotFoundPage({ what = 'page' }: { what?: string }) {
  const { openSearch } = useSearch();
  return (
    <section className="container-cosmos flex min-h-[70vh] flex-col items-start justify-center pt-24">
      <p className="eyebrow">Signal lost</p>
      <h1 className="display mt-4 text-5xl sm:text-7xl">This {what} is beyond the observable universe.</h1>
      <p className="mt-6 max-w-lg text-muted">We couldn’t find what you were looking for. It may have been renamed, or the link is incomplete.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/" className="btn-primary">
          Return home
        </Link>
        <button type="button" onClick={() => openSearch()} className="btn-ghost">
          Search
        </button>
      </div>
    </section>
  );
}
