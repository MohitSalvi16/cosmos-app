import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/nasa/http';
import { AnimatedNumber } from './AnimatedNumber';
import { DataBadge } from './DataBadge';
import { DataList } from './DataList';
import { ErrorBoundary } from './ErrorBoundary';
import { SourceList } from './SourceList';
import { EmptyState, ErrorState } from './States';
import { tabPanelProps, Tabs } from './Tabs';

describe('DataBadge', () => {
  it('labels curated data as curated, never live', () => {
    render(<DataBadge provenance="curated" source="NASA fact sheets" />);
    expect(screen.getByText(/Curated catalog/)).toBeInTheDocument();
    expect(screen.queryByText(/Live/)).not.toBeInTheDocument();
  });

  it('shows source and last-updated time for live data', () => {
    const fetchedAt = new Date(Date.now() - 5 * 60_000).toISOString();
    render(<DataBadge provenance="live" meta={{ fetchedAt, cache: 'HIT', source: 'NASA NeoWs' }} />);
    expect(screen.getByText(/Live · NASA NeoWs/)).toBeInTheDocument();
    expect(screen.getByText(/updated 5 min ago/)).toBeInTheDocument();
  });
});

describe('DataList', () => {
  it('renders an accessible definition list and flags estimates', () => {
    render(<DataList items={[{ label: 'Mass', value: '~20 M☉', estimate: true }, { label: 'Type', value: 'B8 Ia' }]} />);
    const terms = screen.getAllByRole('term');
    expect(terms).toHaveLength(2);
    expect(screen.getByTitle(/estimated value/i)).toHaveTextContent('EST.');
    expect(screen.getByText('B8 Ia').tagName).toBe('DD');
  });
});

describe('SourceList', () => {
  it('opens sources in a new tab safely, with an SR hint', () => {
    render(<SourceList sources={[{ label: 'NASA Mars Fact Sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html' }]} />);
    const link = screen.getByRole('link', { name: /NASA Mars Fact Sheet/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveTextContent('(opens in a new tab)');
  });

  it('renders nothing without sources', () => {
    const { container } = render(<SourceList sources={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('States', () => {
  it('ErrorState explains the failure and retries', async () => {
    const onRetry = vi.fn();
    render(<ErrorState error={new ApiError('x', 429)} onRetry={onRetry} context="APOD unavailable." />);
    expect(screen.getByRole('alert')).toHaveTextContent(/rate limit/i);
    expect(screen.getByRole('alert')).toHaveTextContent(/never substitutes invented data/i);
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('EmptyState shows title and hint', () => {
    render(<EmptyState title="No results" hint="Try again" />);
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });
});

describe('ErrorBoundary', () => {
  function Boom(): JSX.Element {
    throw new Error('WebGL context lost');
  }

  it('contains crashes and offers a reset', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary label="3D scene">
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('3D scene could not be displayed');
    expect(screen.getByRole('alert')).toHaveTextContent('WebGL context lost');
  });

  it('renders a custom fallback', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary fallback={<p>static starfield</p>}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('static starfield')).toBeInTheDocument();
  });
});

describe('Tabs', () => {
  function Harness() {
    const [active, setActive] = useState('a');
    return (
      <>
        <Tabs
          idBase="t"
          label="Sections"
          active={active}
          onChange={setActive}
          tabs={[
            { id: 'a', label: 'Overview' },
            { id: 'b', label: 'Orbit' },
            { id: 'c', label: 'Sources' },
          ]}
        />
        <div {...tabPanelProps('t', active)}>panel {active}</div>
      </>
    );
  }

  it('implements roving tabindex and arrow/Home/End keys', () => {
    render(<Harness />);
    const [a, b, c] = screen.getAllByRole('tab');
    expect(a).toHaveAttribute('aria-selected', 'true');
    expect(b).toHaveAttribute('tabindex', '-1');
    fireEvent.keyDown(a!, { key: 'ArrowRight' });
    expect(b).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(b!, { key: 'End' });
    expect(c).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(c!, { key: 'ArrowRight' });
    expect(a).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(a!, { key: 'ArrowLeft' });
    expect(c).toHaveAttribute('aria-selected', 'true');
  });

  it('links tabs and panels via aria attributes', () => {
    render(<Harness />);
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby', 't-tab-a');
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-controls', 't-panel-a');
    expect(panel).toHaveAttribute('id', 't-panel-a');
  });
});

describe('AnimatedNumber', () => {
  it('exposes the final value to screen readers immediately', () => {
    render(<AnimatedNumber value={6451} />);
    expect(screen.getByLabelText('6,451')).toBeInTheDocument();
  });

  it('shows the final value at once when reduced motion is requested', () => {
    const mm = window.matchMedia;
    window.matchMedia = ((q: string) => ({ ...mm(q), matches: q.includes('reduce') })) as typeof window.matchMedia;
    render(<AnimatedNumber value={4.6} decimals={1} />);
    expect(screen.getByText('4.6')).toBeInTheDocument();
    window.matchMedia = mm;
  });

  it('counts up when it enters the viewport', async () => {
    vi.useFakeTimers();
    render(<AnimatedNumber value={8} />);
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    vi.useRealTimers();
    expect(screen.getByLabelText('8')).toBeInTheDocument();
  });
});
