import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IMAGES_RAW, jsonResponse } from '@/test/fixtures';
import { CommandPalette } from './CommandPalette';
import { SearchProvider, useSearch } from './SearchContext';

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function Opener() {
  const { openSearch } = useSearch();
  return (
    <button type="button" onClick={() => openSearch()}>
      open search
    </button>
  );
}

function setup() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <SearchProvider>
        <Opener />
        <CommandPalette />
        <Routes>
          <Route path="*" element={<Where />} />
        </Routes>
      </SearchProvider>
    </MemoryRouter>,
  );
}

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockImplementation((url: string) => {
    if (url.startsWith('/api/exoplanets')) {
      return Promise.resolve(jsonResponse([{ pl_name: 'Kepler-452 b', hostname: 'Kepler-452', sy_dist: 551.727, discoverymethod: 'Transit', disc_year: 2015 }]));
    }
    return Promise.resolve(jsonResponse(IMAGES_RAW));
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('CommandPalette', () => {
  it('opens with Ctrl+K and closes with Escape', async () => {
    setup();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(await screen.findByRole('dialog', { name: /search the universe/i })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('opens with "/" when not typing in a field', async () => {
    setup();
    fireEvent.keyDown(window, { key: '/' });
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('shows categorized local results instantly and navigates with Enter', async () => {
    setup();
    await userEvent.click(screen.getByText('open search'));
    const input = await screen.findByRole('combobox');
    await userEvent.type(input, 'Saturn');
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveTextContent('Saturn');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Solar System')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/planets/saturn'));
  });

  it('moves the active option with arrow keys', async () => {
    setup();
    await userEvent.click(screen.getByText('open search'));
    const input = await screen.findByRole('combobox');
    await userEvent.type(input, 'Jupiter moons');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const selected = screen.getAllByRole('option').findIndex((o) => o.getAttribute('aria-selected') === 'true');
    expect(selected).toBe(1);
    expect(input).toHaveAttribute('aria-activedescendant', 'search-opt-1');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input).toHaveAttribute('aria-activedescendant', 'search-opt-0');
  });

  it('debounces remote searches and labels them as live', async () => {
    setup();
    await userEvent.click(screen.getByText('open search'));
    const input = await screen.findByRole('combobox');
    await userEvent.type(input, 'Kepler-452');
    expect(await screen.findByText('Kepler-452 b', {}, { timeout: 3000 })).toBeInTheDocument();
    // one exoplanet + one image request for the final debounced term only
    const exoCalls = fetchMock.mock.calls.filter(([u]) => String(u).startsWith('/api/exoplanets'));
    expect(exoCalls).toHaveLength(1);
    expect(screen.getAllByText('· live').length).toBeGreaterThan(0);
    expect(screen.getByText('Pulsar Candidate in Andromeda')).toBeInTheDocument();
  });

  it('shows an honest empty state and never fabricates matches', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ collection: { items: [] } })));
    setup();
    await userEvent.click(screen.getByText('open search'));
    await userEvent.type(await screen.findByRole('combobox'), 'zzqxw');
    expect(await screen.findByText(/No matches in the curated catalog or live datasets/, {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('reports remote failures without hiding local results', async () => {
    fetchMock.mockImplementation((url: string) =>
      url.startsWith('/api/exoplanets') ? Promise.resolve(jsonResponse({ error: 'Archive down' }, 502)) : Promise.resolve(jsonResponse({ collection: { items: [] } })),
    );
    setup();
    await userEvent.click(screen.getByText('open search'));
    await userEvent.type(await screen.findByRole('combobox'), 'Saturn');
    expect(await screen.findByText(/Some live sources could not be searched/, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('Saturn');
  });

  it('only remembers recent searches after the user opts in', async () => {
    setup();
    await userEvent.click(screen.getByText('open search'));
    const input = await screen.findByRole('combobox');
    await userEvent.type(input, 'Saturn{Enter}');
    expect(window.localStorage.getItem('cosmos.recentSearches')).toBeNull();

    await userEvent.click(screen.getByText('open search'));
    await userEvent.click(await screen.findByLabelText(/Remember recent searches/));
    await userEvent.type(screen.getByRole('combobox'), 'Andromeda{Enter}');
    expect(JSON.parse(window.localStorage.getItem('cosmos.recentSearches') ?? '[]')).toEqual(['Andromeda']);
  });
});
