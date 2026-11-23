import { HOUR, MIN, addDays, clockOf, fromISODate, toISODate } from '../engine/time';
import type { ISODate } from '../engine/time';

const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WD3 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MO = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MO3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parts(date: ISODate) {
  const { y, mo, d } = fromISODate(date);
  const wd = new Date(y, mo, d, 12).getDay();
  return { y, mo, d, wd };
}

/** "Monday, 23 November" */
export function longDate(date: ISODate) {
  const p = parts(date);
  return `${WD[p.wd]}, ${p.d} ${MO[p.mo]}`;
}
/** "Mon 23 Nov" */
export function shortDate(date: ISODate) {
  const p = parts(date);
  return `${WD3[p.wd]} ${p.d} ${MO3[p.mo]}`;
}
export function weekdayShort(date: ISODate) {
  return WD3[parts(date).wd];
}
export function weekdayLetter(date: ISODate) {
  return WD3[parts(date).wd].slice(0, 1);
}
export function dayNum(date: ISODate) {
  return parts(date).d;
}
export function monthYear(date: ISODate) {
  const p = parts(date);
  return `${MO[p.mo]} ${p.y}`;
}

/** "Today", "Tomorrow", "Yesterday", else "Thu 26 Nov". */
export function relDay(date: ISODate, today: ISODate) {
  if (date === today) return 'Today';
  if (date === addDays(today, 1)) return 'Tomorrow';
  if (date === addDays(today, -1)) return 'Yesterday';
  return shortDate(date);
}

export const t = clockOf;
export const range = (a: number, b: number) => `${clockOf(a)}–${clockOf(b)}`;

/** "2h 10m", "45m", "7h" */
export function dur(msv: number) {
  const m = Math.max(0, Math.round(msv / MIN));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  if (r === 0) return `${h}h`;
  return `${h}h ${r}m`;
}

export function greeting(now: number) {
  const h = new Date(now).getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function dateOf(ms: number) {
  return toISODate(ms);
}

export const hours = (msv: number) => msv / HOUR;
