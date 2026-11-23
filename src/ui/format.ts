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
/** "Tomorrow, 2 December" near today, else "Wednesday, 2 December". */
export function dayTitle(date: ISODate, today: ISODate) {
  const p = parts(date);
  const near = date === addDays(today, 1) ? 'Tomorrow' : date === addDays(today, -1) ? 'Yesterday' : WD[p.wd];
  return `${near}, ${p.d} ${MO[p.mo]}`;
}

export function relDay(date: ISODate, today: ISODate) {
  if (date === today) return 'Today';
  if (date === addDays(today, 1)) return 'Tomorrow';
  if (date === addDays(today, -1)) return 'Yesterday';
  return shortDate(date);
}

export const t = clockOf;
export const range = (a: number, b: number) => `${clockOf(a)} to ${clockOf(b)}`;

/** "2h 10m", "45m", "7h" */
export function dur(msv: number) {
  const m = Math.max(0, Math.round(msv / MIN));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  if (r === 0) return `${h}h`;
  return `${h}h ${r}m`;
}

// Three greetings for each part of the day. One is picked at random each
// time the app opens, then kept for the session so it doesn't flicker.
const GREETINGS: Record<'late' | 'morning' | 'afternoon' | 'evening', ((n: string) => string)[]> = {
  late: [(n) => `Still up${n}?`, (n) => `Long night${n}?`, (n) => `Quiet hours${n}.`],
  morning: [(n) => `Good morning${n}.`, (n) => `Morning${n}.`, (n) => `Up and about${n}?`],
  afternoon: [(n) => `Good afternoon${n}.`, (n) => `Afternoon${n}.`, (n) => `How’s the day going${n}?`],
  evening: [(n) => `Good evening${n}.`, (n) => `Evening${n}.`, (n) => `How’s your evening${n}?`],
};
const pick = Math.floor(Math.random() * 3);

export function greeting(now: number, name?: string) {
  const h = new Date(now).getHours();
  const part = h < 5 ? 'late' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  return GREETINGS[part][pick](name ? `, ${name}` : '');
}

export function dateOf(ms: number) {
  return toISODate(ms);
}

export const hours = (msv: number) => msv / HOUR;
