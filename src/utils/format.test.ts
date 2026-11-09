import { describe, expect, it } from 'vitest';
import {
  addDays,
  clamp,
  formatDate,
  formatDistancePc,
  formatKm,
  formatNumber,
  formatPeriodDays,
  formatText,
  isMissing,
  NOT_AVAILABLE,
  pcToLy,
  relativeTime,
  slugify,
  toIsoDate,
  truncate,
} from './format';

describe('format utilities', () => {
  it('treats null, undefined, NaN, Infinity and empty strings as missing', () => {
    expect(isMissing(null)).toBe(true);
    expect(isMissing(undefined)).toBe(true);
    expect(isMissing(NaN)).toBe(true);
    expect(isMissing(Infinity)).toBe(true);
    expect(isMissing('')).toBe(true);
    expect(isMissing(0)).toBe(false);
  });

  it('never invents values: missing numbers and strings render "Not available"', () => {
    expect(formatNumber(null)).toBe(NOT_AVAILABLE);
    expect(formatNumber(undefined, 2, 'K')).toBe(NOT_AVAILABLE);
    expect(formatText(null)).toBe(NOT_AVAILABLE);
    expect(formatDistancePc(null)).toBe(NOT_AVAILABLE);
    expect(formatPeriodDays(null)).toBe(NOT_AVAILABLE);
    expect(formatDate(null)).toBe(NOT_AVAILABLE);
    expect(formatDate('not-a-date')).toBe(NOT_AVAILABLE);
  });

  it('formats numbers with sensible precision and units', () => {
    expect(formatNumber(1.23456)).toBe('1.23');
    expect(formatNumber(123.456, 2)).toBe('123.5');
    expect(formatNumber(12345.6)).toBe('12,346');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(499.27, 0, 'K')).toBe('499 K');
  });

  it('converts parsecs to light-years (IAU)', () => {
    expect(pcToLy(1)).toBeCloseTo(3.2616, 4);
    expect(formatDistancePc(1.30119)).toBe('4.2 ly (1.3 pc)');
  });

  it('formats kilometres at readable magnitudes', () => {
    expect(formatKm(4879)).toBe('4,879 km');
    expect(formatKm(149.6e6)).toBe('149.6 million km');
    expect(formatKm(4.515e9)).toBe('4.52 billion km');
  });

  it('chooses hours, days or years for orbital periods', () => {
    expect(formatPeriodDays(0.5)).toBe('12 hours');
    expect(formatPeriodDays(44.3936)).toBe('44.39 days');
    expect(formatPeriodDays(4331)).toBe('11.86 years');
  });

  it('formats ISO calendar dates in UTC (no off-by-one from local time zones)', () => {
    expect(formatDate('2026-10-25')).toBe('Oct 25, 2026');
  });

  it('computes relative times', () => {
    const now = Date.parse('2026-10-25T12:00:00Z');
    expect(relativeTime('2026-10-25T11:59:50Z', now)).toBe('just now');
    expect(relativeTime('2026-10-25T11:50:00Z', now)).toBe('10 min ago');
    expect(relativeTime('2026-10-25T09:00:00Z', now)).toBe('3 h ago');
    expect(relativeTime('2026-10-23T12:00:00Z', now)).toBe('2 d ago');
    expect(relativeTime('garbage', now)).toBe('unknown');
  });

  it('handles local ISO dates and day arithmetic across month boundaries', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('clamps, slugifies and truncates', () => {
    expect(clamp(10, 1, 7)).toBe(7);
    expect(clamp(-3, 1, 7)).toBe(1);
    expect(slugify('Sagittarius A*')).toBe('sagittarius-a');
    expect(truncate('short', 10)).toBe('short');
    expect(truncate('the quick brown fox jumps', 15)).toBe('the quick brown…');
  });
});
