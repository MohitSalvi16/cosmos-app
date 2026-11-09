import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ApproachChart } from './asteroids/ApproachChart';
import { EMPTY_FILTERS, ExoplanetFiltersBar, type FilterDraft } from './exoplanets/ExoplanetFiltersBar';
import { ScaleNotice } from './shared/ScaleNotice';
import { parseLeadingNumber, StarSizeChart } from './stars/StarSizeChart';
import { STARS } from '@/data/starCatalog';
import { parseNeo } from '@/services/nasa/neo';
import { NEO_RAW } from '@/test/fixtures';
import { toFilters } from '@/pages/ExoplanetsPage';
import { PC_TO_LY } from '@/utils/format';

describe('ExoplanetFiltersBar', () => {
  function Harness({ onChange }: { onChange: (d: FilterDraft) => void }) {
    const [v, setV] = useState<FilterDraft>(EMPTY_FILTERS);
    return (
      <ExoplanetFiltersBar
        value={v}
        onChange={(d) => {
          setV(d);
          onChange(d);
        }}
      />
    );
  }

  it('updates filters and resets them', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const reset = screen.getByRole('button', { name: /reset filters/i });
    expect(reset).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Discovery method'), { target: { value: 'Imaging' } });
    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'distance_asc' } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ method: 'Imaging', sort: 'distance_asc' }));
    expect(reset).toBeEnabled();
    fireEvent.click(reset);
    expect(onChange).toHaveBeenLastCalledWith(EMPTY_FILTERS);
  });

  it('offers every discovery method in the archive', () => {
    render(<Harness onChange={vi.fn()} />);
    expect(screen.getAllByRole('option', { name: /Transit|Radial Velocity|Microlensing|Imaging|Astrometry|Pulsar Timing|Disk Kinematics/ }).length).toBeGreaterThanOrEqual(7);
  });
});

describe('toFilters', () => {
  it('converts the light-year limit to parsecs and drops blanks', () => {
    const f = toFilters({ ...EMPTY_FILTERS, name: '  kepler ', yearMin: '2010', maxDistanceLy: '100' });
    expect(f.name).toBe('kepler');
    expect(f.yearMin).toBe(2010);
    expect(f.yearMax).toBeUndefined();
    expect(f.maxDistancePc).toBeCloseTo(100 / PC_TO_LY, 6);
    expect(toFilters(EMPTY_FILTERS)).toEqual({ name: undefined, method: undefined, yearMin: undefined, yearMax: undefined, maxDistancePc: undefined });
  });
});

describe('StarSizeChart', () => {
  it('parses leading numbers, using the lower bound of ranges', () => {
    expect(parseLeadingNumber('~1.71 R☉')).toBe(1.71);
    expect(parseLeadingNumber('~700–1,000 R☉')).toBe(700);
    expect(parseLeadingNumber('unknown')).toBeNull();
  });

  it('plots every catalog star, smallest first, with an explanatory caption', () => {
    render(<StarSizeChart stars={STARS} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(STARS.length);
    expect(items[0]).toHaveTextContent('Proxima Centauri');
    expect(items.at(-1)).toHaveTextContent('Betelgeuse');
    expect(screen.getByText(/logarithmic scale/)).toBeInTheDocument();
  });
});

describe('ApproachChart', () => {
  it('draws one bubble per approach plus the lunar-distance reference and selects on click', () => {
    const a = parseNeo(NEO_RAW)!;
    const b = { ...a, id: '2', name: '2026 AB', hazardous: true, epochMs: a.epochMs + 86_400_000, approachDate: '2026-10-27', missLunar: 3 };
    const onSelect = vi.fn();
    const { container } = render(<ApproachChart data={[a, b]} onSelect={onSelect} selectedId={null} />);
    expect(container.querySelectorAll('circle')).toHaveLength(2);
    expect(screen.getByText(/Moon’s distance/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /close approaches/i })).toBeInTheDocument();
    fireEvent.click(container.querySelectorAll('circle')[1]!);
    expect(onSelect).toHaveBeenCalledWith('2');
  });
});

describe('ScaleNotice', () => {
  it('states that the scene is not to scale and not photographic', () => {
    render(<ScaleNotice />);
    expect(screen.getByText('Not to scale.')).toBeInTheDocument();
    expect(screen.getByText(/procedural artistic renderings/)).toBeInTheDocument();
  });
});
