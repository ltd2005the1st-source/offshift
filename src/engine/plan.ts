// The Offshift planning engine.
//
// A deterministic rules engine: the same inputs always give the same plan,
// it runs offline, and every block carries the reason it exists. All the
// numbers below are configurable defaults that still need review by a sleep
// scientist or sleep medicine clinician before launch.

import {
  HOUR,
  MIN,
  addDays,
  at,
  clockOf,
  dayStart,
  hourOf,
  overlaps,
  round5,
  toISODate,
  weekday,
} from './time';
import type { ISODate } from './time';
import type {
  Anchor,
  FlipStep,
  Plan,
  PlanBlock,
  PlanInput,
  PlanMarker,
  Profile,
  Shift,
  ShiftType,
  Transition,
} from './types';

export const RULES = {
  settleAfterShiftMin: 30, // home → in bed after a shift
  settleQuickReturnMin: 20,
  wakeBeforeLeaveMin: 60, // time to get ready before leaving
  wakeBeforeLeaveQuickMin: 35,
  awakeBeforeNightShiftH: 2.5, // between nights: up this long before leaving
  recoverySleepH: 3.75, // coming off nights
  firstNightDelayMin: 90, // later bedtime the night before a first night
  napEndBeforeLeaveMin: 120,
  flipBackEarlierMin: 30,
  quickReturnH: 11,
  minSleepMin: 90,
  minFreeMin: 45,
  driveLowSleepH: 5,
  owlBedtime: '03:00',
  owlRunDays: 4, // keep a night rhythm on days off if the next night is this close
} as const;

const BEDTIME: Record<Profile['chronotype'], string> = {
  morning: '22:15',
  neutral: '23:00',
  evening: '00:00',
};

interface Work {
  shift: Shift;
  start: number;
  end: number;
  leave: number;
  home: number;
}

let seq = 0;
const nid = (p: string) => `${p}-${++seq}`;

export function shiftTimes(s: Shift): { start: number; end: number } {
  const start = at(s.date, s.start);
  let end = at(s.date, s.end);
  if (end <= start) end = at(s.date, s.end, 1);
  return { start, end };
}

export function shiftHours(s: Shift): number {
  const { start, end } = shiftTimes(s);
  return (end - start) / HOUR;
}

const fmt = (ms: number) => clockOf(ms);

function sleepWhy(variant: NonNullable<PlanBlock['variant']>): string {
  switch (variant) {
    case 'between-nights':
      return 'Going to bed soon after you get home protects the deepest part of your day sleep, and waking mid-afternoon leaves you a free evening before work.';
    case 'recovery':
      return 'A short sleep takes the edge off after your last night without pushing your body clock later. Staying up until a normal bedtime tonight helps you flip back to days.';
    case 'late':
      return 'Staying up a little later tonight and sleeping in tomorrow nudges your body clock toward nights before your first one.';
    case 'owl':
      return 'On short breaks between nights, keeping a late rhythm is often easier than flipping all the way back and forth.';
    case 'quick-return':
      return 'There isn’t much time between these shifts, so this plan protects as much sleep as fits and keeps getting ready short.';
    default:
      return 'Sleeping at about the same clock time on similar days keeps your rhythm steady, so falling asleep and waking up get easier.';
  }
}

function sleepTitle(variant: NonNullable<PlanBlock['variant']>): string {
  switch (variant) {
    case 'between-nights':
      return 'Day sleep';
    case 'recovery':
      return 'Recovery sleep';
    case 'late':
      return 'Sleep in';
    case 'owl':
      return 'Late sleep';
    case 'quick-return':
      return 'Short turnaround sleep';
    default:
      return 'Sleep';
  }
}

export function buildPlan(input: PlanInput): Plan {
  seq = 0;
  const { profile: p, anchors } = input;
  const need = p.sleepNeedH * HOUR;
  const commute = p.commuteMin * MIN;
  const rangeStart = dayStart(addDays(input.from, -2));
  const rangeEnd = dayStart(addDays(input.from, input.days + 2));
  const outStart = dayStart(input.from);
  const outEnd = dayStart(addDays(input.from, input.days));

  // 1. Work, sorted, within a padded window so edges get context.
  const works: Work[] = input.shifts
    .map((shift) => {
      const { start, end } = shiftTimes(shift);
      return { shift, start, end, leave: start - commute, home: end + commute };
    })
    .filter((w) => w.end > rangeStart - 3 * 24 * HOUR && w.start < rangeEnd + 3 * 24 * HOUR)
    .sort((a, b) => a.start - b.start);

  const blocks: PlanBlock[] = [];
  const markers: PlanMarker[] = [];

  for (const w of works) {
    const s = w.shift;
    const hours = (w.end - w.start) / HOUR;
    blocks.push({
      id: nid('work'),
      kind: 'work',
      start: w.start,
      end: w.end,
      title: s.onCall ? 'On call' : s.type === 'night' ? 'Night shift' : s.type === 'evening' ? 'Evening shift' : 'Day shift',
      action: `${fmt(w.start)} to ${fmt(w.end)} · ${hours % 1 === 0 ? hours : hours.toFixed(1)} hours`,
      why: 'Your shift is fixed, so everything else is planned around it.',
      rule: 'work',
      confidence: 'planned',
      movable: false,
      shiftId: s.id,
      color: undefined,
    });
    const joinedBefore = works.some((o) => o !== w && o.end > w.start - commute && o.end <= w.start);
    const joinedAfter = works.some((o) => o !== w && o.start < w.end + commute && o.start >= w.end);
    if (commute > 0 && !joinedBefore) {
      blocks.push({
        id: nid('commute'),
        kind: 'commute',
        start: w.leave,
        end: w.start,
        title: 'Head to work',
        action: `Leave by ${fmt(w.leave)}`,
        why: 'Leaving on time means you start the shift calm rather than rushed.',
        rule: 'commute',
        confidence: 'planned',
        movable: false,
        shiftId: s.id,
      });
    }
    if (commute > 0 && !joinedAfter) {
      blocks.push({
        id: nid('commute'),
        kind: 'commute',
        start: w.end,
        end: w.home,
        title: 'Head home',
        action: s.type === 'night' ? 'Sunglasses on for the drive' : `Home around ${fmt(w.home)}`,
        why:
          s.type === 'night'
            ? 'Bright morning light tells your body it’s daytime. Dimming it on the way home makes it easier to fall asleep.'
            : 'Travel time is part of the working day, so it isn’t counted as free time.',
        rule: 'commute',
        confidence: 'planned',
        movable: false,
        shiftId: s.id,
      });
    }
  }

  // 2. Sleep, gap by gap.
  const sleeps: PlanBlock[] = [];
  const naps: PlanBlock[] = [];

  const gaps: { prev?: Work; next?: Work; start: number; end: number }[] = [];
  const inRange = works.filter((w) => w.end > rangeStart && w.start < rangeEnd);
  const firstIdx = works.indexOf(inRange[0]);
  if (inRange.length === 0) {
    gaps.push({ start: rangeStart, end: rangeEnd });
  } else {
    const before = firstIdx > 0 ? works[firstIdx - 1] : undefined;
    gaps.push({ prev: before, next: inRange[0], start: before ? before.home : rangeStart, end: inRange[0].leave });
    for (let i = 0; i < inRange.length - 1; i++) {
      gaps.push({ prev: inRange[i], next: inRange[i + 1], start: inRange[i].home, end: inRange[i + 1].leave });
    }
    const last = inRange[inRange.length - 1];
    const after = works[works.indexOf(last) + 1];
    gaps.push({ prev: last, next: after, start: last.home, end: after ? after.leave : rangeEnd });
  }

  for (const g of gaps) {
    if (g.end - g.start < RULES.minSleepMin * MIN) continue; // back-to-back: nothing fits
    const prevType: ShiftType | undefined = g.prev?.shift.type;
    const nextType: ShiftType | undefined = g.next?.shift.type;
    const quick = !!(g.prev && g.next && (g.next.start - g.prev.end) / HOUR < RULES.quickReturnH);
    const settle = (quick ? RULES.settleQuickReturnMin : RULES.settleAfterShiftMin) * MIN;
    const wakeBuf = (quick ? RULES.wakeBeforeLeaveQuickMin : RULES.wakeBeforeLeaveMin) * MIN;
    const nextNightSoon = nextType === 'night' && g.next!.start - g.start < RULES.owlRunDays * 24 * HOUR;
    let cursor = g.prev ? g.start + settle : g.start;
    const limit = g.end;
    let flipBack = false;
    let owl = false;

    if (prevType === 'night') {
      const s = round5(cursor);
      if (nextType === 'night' && limit - g.start < 26 * HOUR) {
        const latest = limit - RULES.awakeBeforeNightShiftH * HOUR;
        const e = round5(Math.min(s + need, latest));
        if (e - s >= RULES.minSleepMin * MIN) {
          sleeps.push(sleepBlock(s, e, quick ? 'quick-return' : 'between-nights', need));
          cursor = e;
        }
        if (e - s < need - 60 * MIN) {
          // Short day sleep: a power nap before leaving.
          const ns = round5(limit - 90 * MIN);
          naps.push(napBlock(ns, ns + 25 * MIN, 'power-nap'));
        }
        continue;
      }
      if (p.daysOffStyle === 'owl' && nextNightSoon) {
        const e = round5(Math.min(s + need, limit - wakeBuf));
        sleeps.push(sleepBlock(s, e, 'between-nights', need));
        cursor = e + 4 * HOUR;
        owl = true;
      } else {
        const e = round5(Math.min(s + RULES.recoverySleepH * HOUR, limit - wakeBuf));
        if (e - s >= RULES.minSleepMin * MIN) {
          sleeps.push(sleepBlock(s, e, quick ? 'quick-return' : 'recovery', need));
          cursor = e + 6 * HOUR;
          flipBack = true;
        }
      }
    }

    // Nightly sleeps for every evening inside the gap.
    const windows: { s: number; e: number }[] = [];
    let d = toISODate(cursor - 24 * HOUR);
    for (let guard = 0; guard < 60; guard++, d = addDays(d, 1)) {
      const bed = BEDTIME[p.chronotype];
      const s = bed < '12:00' ? at(d, bed, 1) : at(d, bed);
      if (s - 6 * HOUR > limit) break;
      const e = s + need;
      if (e <= cursor + 2 * HOUR) continue;
      if (s >= limit - 60 * MIN) break;
      windows.push({ s, e });
    }

    windows.forEach((win, i) => {
      const isLast = i === windows.length - 1 && !!g.next;
      const isFirst = i === 0;
      let s = win.s;
      let e = win.e;
      let variant: NonNullable<PlanBlock['variant']> = 'main';

      if (owl || (p.daysOffStyle === 'owl' && nextNightSoon && prevType === 'night')) {
        s = at(toISODate(win.s - 6 * HOUR), RULES.owlBedtime, 1);
        e = s + need;
        variant = 'owl';
      } else if (flipBack && isFirst) {
        s -= RULES.flipBackEarlierMin * MIN;
        e -= RULES.flipBackEarlierMin * MIN;
      }

      if (isLast && nextType === 'night' && variant !== 'owl') {
        s += RULES.firstNightDelayMin * MIN;
        e += RULES.firstNightDelayMin * MIN;
        variant = 'late';
      } else if (isLast) {
        if (e > limit - wakeBuf) {
          e = limit - wakeBuf;
          s = Math.max(e - need, s - 2.5 * HOUR);
        }
      }

      // Never before getting home and settling.
      if (s < cursor) {
        const lost = cursor - s;
        s = cursor;
        if (!isLast) e = Math.min(e + lost, s + need);
      }
      e = Math.min(e, limit - (isLast ? wakeBuf : 60 * MIN));
      if (quick) variant = 'quick-return';
      s = round5(s);
      e = round5(e);
      if (e - s >= RULES.minSleepMin * MIN) sleeps.push(sleepBlock(s, e, variant, need));
    });

    // Anchor nap before the first night of a run.
    if (nextType === 'night' && prevType !== 'night' && g.next) {
      const ne = round5(g.next.leave - RULES.napEndBeforeLeaveMin * MIN);
      const ns = ne - p.napMin * MIN;
      const lastSleep = sleeps.filter((x) => x.end <= ns).sort((a, b) => b.end - a.end)[0];
      if (ns > g.start && (!lastSleep || ns - lastSleep.end >= 3 * HOUR)) {
        naps.push(napBlock(ns, ne, 'anchor-nap'));
      }
    }
  }

  // 3. Anchors (fixed commitments) for every date in range.
  const anchorBlocks: PlanBlock[] = [];
  for (let d = toISODate(rangeStart); dayStart(d) < rangeEnd; d = addDays(d, 1)) {
    const wd = weekday(d);
    for (const a of anchors) {
      if (!a.days.includes(wd)) continue;
      const s = at(d, a.start);
      let e = at(d, a.end);
      if (e <= s) e = at(d, a.end, 1);
      const clashWork = blocks.some((b) => (b.kind === 'work' || b.kind === 'commute') && overlaps(s, e, b.start, b.end));
      anchorBlocks.push({
        id: nid('anchor'),
        kind: 'anchor',
        start: s,
        end: e,
        title: a.title,
        action: a.priority === 'must' ? 'Fixed' : 'If it fits',
        why:
          a.priority === 'must'
            ? 'You marked this as something that has to happen, so sleep is planned around it.'
            : 'You marked this as flexible, so it only stays when it fits around sleep and work.',
        rule: 'anchor',
        confidence: 'planned',
        movable: false,
        color: a.color,
        atRisk: clashWork,
      });
    }
  }

  // Must anchors split sleep; prefer anchors give way to it.
  const placedSleeps: PlanBlock[] = [];
  for (const sl of [...sleeps, ...naps]) {
    let pieces: PlanBlock[] = [sl];
    for (const a of anchorBlocks) {
      const must = a.action === 'Fixed';
      const next: PlanBlock[] = [];
      for (const pc of pieces) {
        if (!overlaps(pc.start, pc.end, a.start, a.end)) {
          next.push(pc);
          continue;
        }
        if (!must) {
          a.atRisk = true;
          next.push(pc);
          continue;
        }
        const buf = 15 * MIN;
        const before = { ...pc, id: nid('sleep'), end: round5(a.start - buf) };
        const after = { ...pc, id: nid('sleep'), start: round5(a.end + buf) };
        for (const part of [before, after]) {
          if (part.end - part.start >= 45 * MIN) {
            next.push({
              ...part,
              confidence: 'best-effort',
              why: `${pc.why} It’s split around ${a.title.toLowerCase()} today, so try to fall straight back asleep after.`,
            });
          }
        }
      }
      pieces = next;
    }
    placedSleeps.push(...pieces);
  }
  const mustIds = new Set(anchorBlocks.filter((a) => a.action === 'Fixed').map((a) => a.id));
  const skipped = anchorBlocks.filter((a) => !mustIds.has(a.id) && a.atRisk);
  const visibleAnchors = anchorBlocks.filter((a) => !skipped.includes(a));
  for (const a of visibleAnchors) {
    if (!mustIds.has(a.id) && placedSleeps.some((sl) => overlaps(sl.start, sl.end, a.start, a.end))) a.atRisk = true;
  }

  blocks.push(...placedSleeps, ...visibleAnchors);

  // 4. Wind-down before main sleeps.
  const busy = () => blocks.filter((b) => b.kind !== 'free');
  for (const sl of placedSleeps.filter((s) => s.kind === 'sleep' && s.end - s.start >= 4 * HOUR)) {
    let s = sl.start - p.windDownMin * MIN;
    const clash = busy().filter((b) => b !== sl && b.kind !== 'winddown' && overlaps(s, sl.start, b.start, b.end));
    for (const c of clash) s = Math.max(s, c.end);
    if (sl.start - s >= 15 * MIN) {
      blocks.push({
        id: nid('wind'),
        kind: 'winddown',
        start: s,
        end: sl.start,
        title: 'Wind down',
        action: 'Dim the lights, screens down',
        why: 'Dim light and a calm routine signal to your body that sleep is coming, so you fall asleep faster.',
        rule: 'wind-down',
        confidence: 'planned',
        movable: true,
      });
    }
  }

  // Getting ready: the time between waking and leaving for work.
  for (const w of works) {
    const sl = placedSleeps.filter((x) => x.end <= w.leave && x.end > w.leave - 10 * HOUR).sort((a, b) => b.end - a.end)[0];
    if (!sl) continue;
    let rs = Math.max(sl.end, w.leave - RULES.wakeBeforeLeaveMin * MIN);
    for (const a of visibleAnchors) if (overlaps(rs, w.leave, a.start, a.end)) rs = Math.max(rs, a.end);
    if (w.leave - rs >= 15 * MIN) {
      blocks.push({
        id: nid('ready'),
        kind: 'ready',
        start: rs,
        end: w.leave,
        title: 'Get ready',
        action: `Leave by ${fmt(w.leave)}`,
        why: 'An unhurried hour between waking and leaving lets the grogginess wear off before you drive.',
        rule: 'ready',
        confidence: 'planned',
        movable: false,
      });
    }
  }

  // 5. Markers.
  const mainSleeps = placedSleeps.filter((s) => s.kind === 'sleep' && s.end - s.start >= 3 * HOUR).sort((a, b) => a.start - b.start);
  for (const sl of mainSleeps) {
    const cut = round5(sl.start - p.caffeineCutoffH * HOUR);
    const inSleep = placedSleeps.some((x) => cut >= x.start && cut < x.end);
    if (!inSleep) {
      markers.push({
        id: nid('caf'),
        kind: 'caffeine-cutoff',
        at: cut,
        title: `Last coffee by ${fmt(cut)}`,
        why: `Caffeine keeps working for hours. Stopping about ${p.caffeineCutoffH} hours before sleep at ${fmt(sl.start)} makes it easier to drift off.`,
      });
    }
    const wakeH = hourOf(sl.end);
    const sunUp = wakeH >= hourOf(at(toISODate(sl.end), p.sunrise)) && wakeH < hourOf(at(toISODate(sl.end), p.sunset));
    markers.push({
      id: nid('light'),
      kind: 'seek-light',
      at: sl.end + 10 * MIN,
      title: sunUp ? 'Get some daylight' : 'Bright lights on',
      why: 'Bright light soon after waking tells your body clock the day has started, which helps keep your sleep at the planned time.',
    });
    markers.push({
      id: nid('meal'),
      kind: 'meal',
      at: round5(sl.end + 45 * MIN),
      title: 'First meal',
      why: 'Eating at regular times after you wake helps your body settle into the new rhythm.',
    });
  }

  works.forEach((w, i) => {
    const s = w.shift;
    if (s.type === 'night') {
      markers.push({
        id: nid('meal'),
        kind: 'meal',
        at: round5(w.start + 6 * HOUR),
        title: 'Light snack, not a big meal',
        why: 'Your gut slows down overnight. Small, light snacks sit better than a large meal in the early hours.',
      });
      markers.push({
        id: nid('light'),
        kind: 'avoid-light',
        at: w.end,
        title: 'Sunglasses on',
        why: 'Bright morning light tells your body it’s daytime. Dimming it on the way home makes it easier to fall asleep.',
      });
    } else if ((w.end - w.start) / HOUR >= 8) {
      markers.push({
        id: nid('meal'),
        kind: 'meal',
        at: round5(w.start + 5.5 * HOUR),
        title: 'Proper meal break',
        why: 'A real meal partway through a long shift keeps your energy steadier than snacking.',
      });
    }

    // Drive check after nights, long shifts, the third shift in a row, or little sleep.
    const hours = (w.end - w.start) / HOUR;
    let streak = 1;
    for (let j = i - 1; j >= 0; j--) {
      const gapDays = Math.round((dayStart(works[j + 1].shift.date) - dayStart(works[j].shift.date)) / (24 * HOUR));
      if (gapDays === 1) streak++;
      else break;
    }
    const slept = placedSleeps
      .filter((x) => x.end > w.end - 24 * HOUR && x.start < w.end)
      .reduce((sum, x) => sum + (Math.min(x.end, w.end) - Math.max(x.start, w.end - 24 * HOUR)), 0);
    const lowSleep = slept < RULES.driveLowSleepH * HOUR;
    const reasons: string[] = [];
    if (s.type === 'night') reasons.push('after a night shift');
    if (hours >= 12) reasons.push(`after ${hours % 1 === 0 ? hours : hours.toFixed(1)} hours at work`);
    if (streak >= 3) reasons.push(`on your ${ordinal(streak)} shift in a row`);
    if (lowSleep) reasons.push('with less sleep than usual');
    if (reasons.length && (s.type === 'night' || hours >= 12 || streak >= 3 || lowSleep)) {
      const h = hourOf(w.end);
      const high = (h >= 4 && h < 6) || h < 2 || (h >= 14 && h < 16);
      markers.push({
        id: nid('drive'),
        kind: 'drive-check',
        at: w.end,
        title: 'Check in before you drive',
        why: `Tiredness builds ${reasons.slice(0, 2).join(' and ')}. A quick honest check-in before you get behind the wheel helps you choose how to get home.`,
        priority: high ? 'high' : 'normal',
      });
    }
  });

  // 6. Free time: whatever is left, labelled by time since waking.
  const occupied = blocks
    .filter((b) => b.kind !== 'free')
    .map((b) => [b.start, b.end] as const)
    .sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of occupied) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  const allSleeps = placedSleeps.slice().sort((a, b) => a.end - b.end);
  let t = rangeStart;
  for (const [s, e] of [...merged, [rangeEnd, rangeEnd] as [number, number]]) {
    if (s - t >= RULES.minFreeMin * MIN) {
      const mid = (t + s) / 2;
      const woke = allSleeps.filter((x) => x.end <= mid && x.end - x.start >= 60 * MIN).pop();
      const nextSleep = allSleeps.find((x) => x.start >= mid && x.kind === 'sleep');
      const awakeH = woke ? (mid - woke.end) / HOUR : 6;
      const toBedH = nextSleep ? (nextSleep.start - mid) / HOUR : 6;
      const energy: 'good' | 'low' = awakeH >= 0.75 && awakeH <= 10 && toBedH >= 1.25 ? 'good' : 'low';
      blocks.push({
        id: nid('free'),
        kind: 'free',
        start: t,
        end: s,
        title: energy === 'good' ? 'Free · good energy' : 'Free · low energy',
        action: energy === 'good' ? 'Good for errands or exercise' : 'Keep it easy. A walk or a few chores',
        why:
          energy === 'good'
            ? 'You’ll have been awake a little while but not too long, which is usually when people feel sharpest.'
            : 'This is close to waking or close to bed, when energy usually dips.',
        rule: 'free',
        confidence: 'planned',
        movable: true,
        energy,
      });
    }
    t = Math.max(t, e);
  }

  // 7. Transitions and flip plans.
  const transitions = findTransitions(works, blocks, markers, input.from, input.days);

  const inOut = (s: number, e: number) => e > outStart - 12 * HOUR && s < outEnd + 12 * HOUR;
  return {
    from: input.from,
    days: input.days,
    blocks: blocks.filter((b) => inOut(b.start, b.end)).sort((a, b) => a.start - b.start || order(a) - order(b)),
    markers: markers.filter((m) => inOut(m.at, m.at)).sort((a, b) => a.at - b.at),
    transitions,
    skipped: skipped.filter((b) => inOut(b.start, b.end)),
  };

  function sleepBlock(s: number, e: number, variant: NonNullable<PlanBlock['variant']>, needMs: number): PlanBlock {
    const short = e - s < needMs - 75 * MIN && variant !== 'recovery';
    return {
      id: nid('sleep'),
      kind: 'sleep',
      start: s,
      end: e,
      title: sleepTitle(variant),
      action: `In bed by ${fmt(s)}, up at ${fmt(e)}`,
      why: sleepWhy(variant) + (short ? ' It’s shorter than your usual sleep, so this plan adds rest where it can.' : ''),
      rule: `sleep:${variant}`,
      confidence: short ? 'best-effort' : 'planned',
      movable: false,
      variant,
    };
  }

  function napBlock(s: number, e: number, variant: 'anchor-nap' | 'power-nap'): PlanBlock {
    return {
      id: nid('nap'),
      kind: 'nap',
      start: s,
      end: e,
      title: variant === 'anchor-nap' ? 'Nap before tonight' : 'Power nap',
      action: variant === 'anchor-nap' ? `Lie down ${fmt(s)} to ${fmt(e)}, alarm set` : `${Math.round((e - s) / MIN)} minutes, alarm set`,
      why:
        variant === 'anchor-nap'
          ? 'A nap in the afternoon before your first night means you start the shift with less time awake behind you.'
          : 'Your day sleep is shorter than usual, so a short nap before you leave tops you up without leaving you groggy.',
      rule: `nap:${variant}`,
      confidence: 'planned',
      movable: true,
      variant,
    };
  }
}

function order(b: PlanBlock): number {
  return ['work', 'commute', 'anchor', 'sleep', 'nap', 'winddown', 'ready', 'free'].indexOf(b.kind);
}

function ordinal(n: number): string {
  return ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'][n] ?? `${n}th`;
}

function findTransitions(works: Work[], blocks: PlanBlock[], markers: PlanMarker[], from: ISODate, days: number): Transition[] {
  const out: Transition[] = [];
  const start = dayStart(addDays(from, -1));
  const end = dayStart(addDays(from, days));
  const sleeps = blocks.filter((b) => b.kind === 'sleep').sort((a, b) => a.start - b.start);
  const naps = blocks.filter((b) => b.kind === 'nap');

  works.forEach((w, i) => {
    const prev = works[i - 1];
    const next = works[i + 1];
    const isNight = w.shift.type === 'night';
    if (isNight) {
      const firstOfRun = !prev || prev.shift.type !== 'night' || w.start - prev.end > 36 * HOUR;
      const lastOfRun = !next || next.shift.type !== 'night' || next.start - w.end > 36 * HOUR;
      if (firstOfRun && w.start >= start && w.start < end) {
        const steps: FlipStep[] = [];
        const late = sleeps.filter((s) => s.end <= w.leave && s.end > w.leave - 30 * HOUR).pop();
        if (late) steps.push({ at: late.start, text: `Stay up a little later, bed around ${clockOf(late.start)}` });
        if (late) steps.push({ at: late.end, text: `Sleep in until about ${clockOf(late.end)}` });
        const nap = naps.find((n) => n.end <= w.leave && n.start > w.leave - 12 * HOUR);
        if (nap) steps.push({ at: nap.start, text: `Nap ${clockOf(nap.start)} to ${clockOf(nap.end)} before you leave` });
        steps.push({ at: w.start, text: `Coffee early in the shift is fine. Stop by about ${clockOf(w.start + 6 * HOUR)}` });
        const kind = lastOfRun ? 'single-night' : 'into-nights';
        out.push({
          date: w.shift.date,
          kind,
          title: kind === 'single-night' ? 'One night between days' : 'Into nights',
          summary:
            kind === 'single-night'
              ? 'Treat this night as a one-off. Nap before it, sleep a little after, and keep your usual bedtime.'
              : 'Go to bed later the day before, so the first night feels less like an all-nighter.',
          steps,
        });
      }
      if (lastOfRun && !firstOfRun && w.end >= start && w.end < end) {
        const steps: FlipStep[] = [];
        const rec = sleeps.find((s) => s.start >= w.end && s.start < w.end + 4 * HOUR);
        if (rec) steps.push({ at: rec.start, text: `Short recovery sleep ${clockOf(rec.start)} to ${clockOf(rec.end)}` });
        if (rec) steps.push({ at: rec.end + 15 * MIN, text: 'Get outside in daylight once you’re up' });
        const cut = markers.find((m) => m.kind === 'caffeine-cutoff' && m.at > w.end && m.at < w.end + 20 * HOUR);
        if (cut) steps.push({ at: cut.at, text: `Last coffee by ${clockOf(cut.at)}` });
        const bed = sleeps.find((s) => s.start > (rec ? rec.end : w.end) + 3 * HOUR);
        if (bed) steps.push({ at: bed.start, text: `Early night, in bed by ${clockOf(bed.start)}` });
        out.push({
          date: toISODate(w.end),
          kind: 'off-nights',
          title: 'Coming off nights',
          summary: 'Sleep a few hours this morning, spend the day in daylight and go to bed early. That gets you back to days fastest.',
          steps,
        });
      }
    }
    if (prev && w.start - prev.end < RULES.quickReturnH * HOUR && w.start - prev.end > 0 && w.start >= start && w.start < end) {
      const gapH = (w.start - prev.end) / HOUR;
      out.push({
        date: w.shift.date,
        kind: 'quick-return',
        title: 'Quick turnaround',
        summary: `Only ${gapH % 1 === 0 ? gapH : gapH.toFixed(1)} hours between shifts. Sleep comes first; everything else can wait.`,
        steps: sleeps
          .filter((s) => s.start >= prev.end && s.end <= w.start)
          .map((s) => ({ at: s.start, text: `Straight to bed, ${clockOf(s.start)} to ${clockOf(s.end)}` })),
      });
    }
  });
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}
