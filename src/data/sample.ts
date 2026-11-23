import { addDays, weekday } from '../engine/time';
import type { ISODate } from '../engine/time';
import type { Anchor, Profile, Shift, ShiftPreset } from '../engine/types';

export const NURSE_PRESETS: ShiftPreset[] = [
  { id: 'd12', label: 'Day 12', code: 'D', start: '07:00', end: '19:00', type: 'day', color: '#6FA8DC' },
  { id: 'n12', label: 'Night 12', code: 'N', start: '19:00', end: '07:00', type: 'night', color: '#E5A35B' },
  { id: 'e8', label: 'Evening 8', code: 'E', start: '15:00', end: '23:00', type: 'evening', color: '#D987A6' },
  { id: 'n8', label: 'Night 8', code: 'N8', start: '23:00', end: '07:00', type: 'night', color: '#C98F4E' },
];

export const DEFAULT_PROFILE: Profile = {
  name: '',
  role: 'rn',
  sleepNeedH: 7.5,
  chronotype: 'neutral',
  commuteMin: 30,
  commuteMode: 'drive',
  napMin: 90,
  daysOffStyle: 'flip',
  caffeineCutoffH: 6,
  windDownMin: 45,
  sunrise: '06:45',
  sunset: '17:00',
};

/**
 * A realistic rotating med-surg fortnight, laid out so that "today" always
 * shows something interesting: two days, a day off, three nights, two off,
 * then days again.
 */
const PATTERN: (string | null)[] = ['d12', 'd12', null, 'n12', 'n12', 'n12', null, null, 'd12', 'd12', null, 'd12', null, null];

export function sampleShifts(today: ISODate): Shift[] {
  // Start the pattern on the Monday on or before today, minus a week, so the
  // past week has context and the next fortnight is filled.
  const wd = weekday(today);
  const monday = addDays(today, -((wd + 6) % 7));
  const out: Shift[] = [];
  for (let i = -7; i < 35; i++) {
    const pid = PATTERN[(i + PATTERN.length) % PATTERN.length];
    if (!pid) continue;
    const p = NURSE_PRESETS.find((x) => x.id === pid)!;
    const date = addDays(monday, i);
    out.push({ id: `s-${date}`, date, start: p.start, end: p.end, type: p.type, presetId: p.id, source: 'manual' });
  }
  return out;
}

export const SAMPLE_ANCHORS: Anchor[] = [
  { id: 'a-dog', title: 'Walk Biscuit', days: [0, 1, 2, 3, 4, 5, 6], start: '17:30', end: '18:00', priority: 'prefer', color: '#7FB08A' },
  { id: 'a-yoga', title: 'Yoga class', days: [3], start: '10:00', end: '11:00', priority: 'prefer', color: '#D88FB4' },
];
