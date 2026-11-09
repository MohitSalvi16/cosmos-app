export const NOT_AVAILABLE = 'Not available';

/** 1 parsec in light-years (IAU). */
export const PC_TO_LY = 3.261563777;

export function isMissing(v: unknown): v is null | undefined {
  return v === null || v === undefined || (typeof v === 'number' && !Number.isFinite(v)) || v === '';
}

/** Formats a number with locale grouping, or "Not available" when missing. */
export function formatNumber(v: number | null | undefined, digits = 2, unit?: string): string {
  if (isMissing(v)) return NOT_AVAILABLE;
  const abs = Math.abs(v);
  const maximumFractionDigits = abs >= 1000 ? 0 : abs >= 100 ? Math.min(digits, 1) : digits;
  const s = v.toLocaleString('en-US', { maximumFractionDigits });
  return unit ? `${s} ${unit}` : s;
}

export function formatText(v: string | null | undefined): string {
  return isMissing(v) ? NOT_AVAILABLE : v;
}

export function pcToLy(pc: number): number {
  return pc * PC_TO_LY;
}

export function formatDistancePc(pc: number | null | undefined): string {
  if (isMissing(pc)) return NOT_AVAILABLE;
  return `${formatNumber(pcToLy(pc), 1)} ly (${formatNumber(pc, 2)} pc)`;
}

export function formatKm(km: number): string {
  if (km >= 1e9) return `${(km / 1e9).toLocaleString('en-US', { maximumFractionDigits: 2 })} billion km`;
  if (km >= 1e6) return `${(km / 1e6).toLocaleString('en-US', { maximumFractionDigits: 1 })} million km`;
  return `${Math.round(km).toLocaleString('en-US')} km`;
}

/** Formats a period given in days into the most readable unit. */
export function formatPeriodDays(days: number | null | undefined): string {
  if (isMissing(days)) return NOT_AVAILABLE;
  if (days < 1) return `${formatNumber(days * 24, 2)} hours`;
  if (days > 730) return `${formatNumber(days / 365.25, 2)} years`;
  return `${formatNumber(days, 2)} days`;
}

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
  if (!iso) return NOT_AVAILABLE;
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return NOT_AVAILABLE;
  return d.toLocaleDateString('en-US', { timeZone: iso.length === 10 ? 'UTC' : undefined, ...opts });
}

export function relativeTime(iso: string, now: number = Date.now()): string {
  const diff = Math.round((now - new Date(iso).getTime()) / 1000);
  if (!Number.isFinite(diff)) return 'unknown';
  if (diff < 45) return 'just now';
  if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)} h ago`;
  return `${Math.round(diff / 86400)} d ago`;
}

/** Local calendar date as YYYY-MM-DD. */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-');
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
