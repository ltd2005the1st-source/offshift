import { HOUR, addDays, clockOf, dayStart, toISODate } from '../engine/time';
import type { Plan, PlanBlock } from '../engine/types';
import { dur } from './format';

export function currentBlock(plan: Plan, now: number): PlanBlock | undefined {
  const here = plan.blocks.filter((b) => b.start <= now && b.end > now);
  return here.find((b) => b.kind === 'work') ?? here.find((b) => b.kind !== 'free' && b.kind !== 'anchor') ?? here.find((b) => b.kind === 'anchor') ?? here[0];
}

export function nextBlocks(plan: Plan, now: number, n = 2): PlanBlock[] {
  return plan.blocks.filter((b) => b.start > now && b.kind !== 'free').slice(0, n);
}

/** One plain sentence about the day, Daybook-style. */
export function daySentence(plan: Plan, date: string, now: number): string {
  const ds = dayStart(date);
  const de = dayStart(addDays(date, 1));
  const isToday = toISODate(now) === date;
  const from = isToday ? now : ds;
  const work = plan.blocks.find((b) => b.kind === 'work' && b.end > from && b.start < de);
  const nap = plan.blocks.find((b) => b.kind === 'nap' && b.start >= from && b.start < de);
  const sleep = plan.blocks.find((b) => b.kind === 'sleep' && b.start >= from && b.start < de + 6 * HOUR);
  const trans = plan.transitions.find((t) => t.date === date);
  if (work) {
    const when = work.start <= from ? 'until' : new Date(work.start).getHours() >= 17 ? 'tonight,' : 'today,';
    const lead = work.start <= from ? `At work until ${clockOf(work.end)}.` : `${work.title} ${when} ${clockOf(work.start)}–${clockOf(work.end)}.`;
    if (nap && nap.start < work.start) return `${lead} Nap at ${clockOf(nap.start)} first.`;
    if (trans?.kind === 'off-nights') return `${lead} Then a short sleep and an early night.`;
    return lead;
  }
  if (trans?.kind === 'off-nights') return 'Coming off nights. A short sleep, daylight, then an early night.';
  if (sleep) return `A day off. ${isToday && sleep.start - now < 4 * HOUR ? 'Bed' : 'Sleep'} at ${clockOf(sleep.start)} tonight.`;
  return 'Nothing planned. Enjoy it.';
}

export function sleepLast24(plan: Plan, now: number): number {
  return plan.blocks
    .filter((b) => (b.kind === 'sleep' || b.kind === 'nap') && b.end > now - 24 * HOUR && b.start < now)
    .reduce((s, b) => s + (Math.min(b.end, now) - Math.max(b.start, now - 24 * HOUR)), 0);
}

export function freeOn(plan: Plan, date: string, from?: number): number {
  const ds = Math.max(dayStart(date), from ?? 0);
  const de = dayStart(addDays(date, 1));
  return plan.blocks.filter((b) => b.kind === 'free' && b.end > ds && b.start < de).reduce((s, b) => s + (Math.min(b.end, de) - Math.max(b.start, ds)), 0);
}

export function timeLeft(b: PlanBlock, now: number) {
  return `${dur(b.end - now)} left`;
}
