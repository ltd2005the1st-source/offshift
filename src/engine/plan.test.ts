import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPlan } from './plan';
import { HOUR, at, clockOf, toISODate } from './time';
import type { Anchor, Plan, Profile, Shift } from './types';
import { DEFAULT_PROFILE } from '../data/sample';

const P: Profile = { ...DEFAULT_PROFILE };

const day = (date: string): Shift => ({ id: `d${date}`, date, start: '07:00', end: '19:00', type: 'day' });
const night = (date: string): Shift => ({ id: `n${date}`, date, start: '19:00', end: '07:00', type: 'night' });
const eve = (date: string): Shift => ({ id: `e${date}`, date, start: '15:00', end: '23:00', type: 'evening' });

function plan(shifts: Shift[], from = '2026-11-23', days = 10, profile: Profile = P, anchors: Anchor[] = []): Plan {
  return buildPlan({ shifts, profile, anchors, from, days });
}

const sleeps = (p: Plan) => p.blocks.filter((b) => b.kind === 'sleep');
const fmt = (b: { start: number; end: number }) => `${toISODate(b.start)} ${clockOf(b.start)} to ${clockOf(b.end)}`;

function noOverlaps(p: Plan) {
  const hard = p.blocks.filter((b) => ['work', 'commute', 'sleep', 'nap'].includes(b.kind));
  for (let i = 0; i < hard.length; i++)
    for (let j = i + 1; j < hard.length; j++) {
      const a = hard[i];
      const b = hard[j];
      if (a.start < b.end && b.start < a.end) assert.fail(`overlap: ${a.kind} ${fmt(a)} and ${b.kind} ${fmt(b)}`);
    }
}

test('day shift: wake early enough to get ready and commute', () => {
  const p = plan([day('2026-11-24')]);
  noOverlaps(p);
  const before = sleeps(p).find((s) => s.end <= at('2026-11-24', '07:00') && s.end > at('2026-11-24', '00:00'))!;
  assert.equal(clockOf(before.end), '05:30');
  assert.equal(clockOf(before.start), '22:00');
});

test('between two nights: sleep soon after getting home, free evening', () => {
  const p = plan([night('2026-11-24'), night('2026-11-25')]);
  noOverlaps(p);
  const s = sleeps(p).find((b) => toISODate(b.start) === '2026-11-25')!;
  assert.equal(s.variant, 'between-nights');
  assert.equal(clockOf(s.start), '08:00');
  assert.ok(s.end <= at('2026-11-25', '16:00'), `ends ${clockOf(s.end)}`);
});

test('into nights: later bedtime the night before and an afternoon nap', () => {
  const p = plan([day('2026-11-23'), night('2026-11-26'), night('2026-11-27')]);
  noOverlaps(p);
  const late = sleeps(p).find((b) => b.variant === 'late')!;
  assert.ok(late, 'has a late sleep');
  assert.equal(clockOf(late.start), '00:30');
  const nap = p.blocks.find((b) => b.kind === 'nap' && toISODate(b.start) === '2026-11-26')!;
  assert.equal(clockOf(nap.start), '15:00');
  assert.equal(clockOf(nap.end), '16:30');
  const t = p.transitions.find((x) => x.kind === 'into-nights')!;
  assert.equal(t.date, '2026-11-26');
  assert.ok(t.steps.length >= 3);
});

test('coming off nights: short recovery sleep, then an early night', () => {
  const p = plan([night('2026-11-24'), night('2026-11-25'), day('2026-11-28')]);
  noOverlaps(p);
  const rec = sleeps(p).find((b) => b.variant === 'recovery')!;
  assert.equal(toISODate(rec.start), '2026-11-26');
  assert.ok((rec.end - rec.start) / HOUR <= 4);
  const next = sleeps(p).find((b) => b.start > rec.end)!;
  assert.equal(clockOf(next.start), '22:30');
  assert.ok(p.transitions.some((t) => t.kind === 'off-nights' && t.date === '2026-11-26'));
});

test('single night between days is flagged as a one-off', () => {
  const p = plan([day('2026-11-23'), night('2026-11-24'), day('2026-11-26')]);
  noOverlaps(p);
  assert.ok(p.transitions.some((t) => t.kind === 'single-night' && t.date === '2026-11-24'));
});

test('quick return: evening then early day gets a maximised sleep and a flag', () => {
  const p = plan([eve('2026-11-24'), day('2026-11-25')]);
  noOverlaps(p);
  const s = sleeps(p).find((b) => toISODate(b.start) === '2026-11-24' || toISODate(b.start) === '2026-11-25')!;
  assert.equal(s.variant, 'quick-return');
  assert.ok(p.transitions.some((t) => t.kind === 'quick-return'));
});

test('back-to-back double still produces a plan', () => {
  const p = plan([day('2026-11-24'), night('2026-11-24')]);
  noOverlaps(p);
  assert.ok(p.markers.some((m) => m.kind === 'drive-check' && m.at === at('2026-11-25', '07:00')));
});

test('drive check after nights, long shifts and the third shift in a row', () => {
  const p = plan([night('2026-11-24')]);
  const d = p.markers.find((m) => m.kind === 'drive-check')!;
  assert.equal(d.priority, 'normal'); // 07:00 is outside the 4 to 6 a.m. window
  const p2 = plan([{ id: 'x', date: '2026-11-24', start: '19:00', end: '05:00', type: 'night' }]);
  assert.equal(p2.markers.find((m) => m.kind === 'drive-check')!.priority, 'high');
});

test('caffeine cutoff sits before main sleep', () => {
  const p = plan([day('2026-11-24')]);
  const s = sleeps(p).find((b) => clockOf(b.start) === '22:00')!;
  const c = p.markers.find((m) => m.kind === 'caffeine-cutoff' && m.at < s.start && m.at > s.start - 7 * HOUR)!;
  assert.equal(clockOf(c.at), '16:00');
});

test('days off with "stay a night owl" keeps a late rhythm', () => {
  const owl: Profile = { ...P, daysOffStyle: 'owl' };
  const p = plan([night('2026-11-23'), night('2026-11-24'), night('2026-11-27')], '2026-11-23', 7, owl);
  noOverlaps(p);
  assert.ok(sleeps(p).some((s) => s.variant === 'owl' && clockOf(s.start) === '03:00'));
});

test('a must anchor splits sleep instead of being dropped', () => {
  const pickup: Anchor = { id: 'a', title: 'School pickup', days: [0, 1, 2, 3, 4, 5, 6], start: '14:45', end: '15:30', priority: 'must', color: '#fff' };
  const p = plan([night('2026-11-24'), night('2026-11-25')], '2026-11-23', 5, P, [pickup]);
  noOverlaps(p);
  const s = sleeps(p).filter((b) => toISODate(b.start) === '2026-11-25');
  assert.ok(s.length >= 1);
  for (const x of s) assert.ok(!(x.start < at('2026-11-25', '15:30') && at('2026-11-25', '14:45') < x.end));
});

test('no schedule at all still gives a plan with sleep every night', () => {
  const p = plan([], '2026-11-23', 7);
  assert.ok(sleeps(p).length >= 7);
  assert.ok(p.blocks.some((b) => b.kind === 'free'));
});

test('deterministic: same input, same output', () => {
  const s = [day('2026-11-23'), night('2026-11-26'), night('2026-11-27')];
  const a = plan(s);
  const b = plan(s);
  assert.deepEqual(a, b);
});

test('daylight saving change inside a night shift', () => {
  // US clocks go back on 1 Nov 2026. Only meaningful when TZ is a US zone.
  const p = plan([night('2026-10-31'), night('2026-11-01')], '2026-10-31', 4);
  noOverlaps(p);
  assert.ok(sleeps(p).length > 0);
});
