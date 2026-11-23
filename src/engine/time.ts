// Local-time helpers. All absolute times are epoch milliseconds in the
// device's time zone; date arithmetic goes through Date so daylight saving
// changes are handled by the platform.

export const MIN = 60_000;
export const HOUR = 60 * MIN;

/** "YYYY-MM-DD" for a local date. */
export type ISODate = string;
/** "HH:MM", 24-hour. */
export type Clock = string;

export function parseClock(c: Clock): { h: number; m: number } {
  const [h, m] = c.split(':').map(Number);
  return { h: h || 0, m: m || 0 };
}

export function clockMinutes(c: Clock): number {
  const { h, m } = parseClock(c);
  return h * 60 + m;
}

export function toISODate(ms: number): ISODate {
  const d = new Date(ms);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

export function fromISODate(date: ISODate): { y: number; mo: number; d: number } {
  const [y, mo, d] = date.split('-').map(Number);
  return { y, mo: mo - 1, d };
}

/** Local midnight of a date. */
export function dayStart(date: ISODate): number {
  const { y, mo, d } = fromISODate(date);
  return new Date(y, mo, d).getTime();
}

/** Absolute time of a clock reading on a date (minutes may overflow into the next day). */
export function at(date: ISODate, clock: Clock, plusDays = 0): number {
  const { y, mo, d } = fromISODate(date);
  const { h, m } = parseClock(clock);
  return new Date(y, mo, d + plusDays, h, m).getTime();
}

export function addDays(date: ISODate, n: number): ISODate {
  const { y, mo, d } = fromISODate(date);
  return toISODate(new Date(y, mo, d + n, 12).getTime());
}

export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((dayStart(b) - dayStart(a)) / (24 * HOUR));
}

export function weekday(date: ISODate): number {
  const { y, mo, d } = fromISODate(date);
  return new Date(y, mo, d, 12).getDay();
}

export function hourOf(ms: number): number {
  const d = new Date(ms);
  return d.getHours() + d.getMinutes() / 60;
}

export function clockOf(ms: number): Clock {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Round to the nearest 5 minutes, so plans read like a person wrote them. */
export function round5(ms: number): number {
  const step = 5 * MIN;
  return Math.round(ms / step) * step;
}

export function overlaps(a0: number, a1: number, b0: number, b1: number): boolean {
  return a0 < b1 && b0 < a1;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
