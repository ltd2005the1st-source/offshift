import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Check, Clock4, PhoneCall, PhoneIncoming, Plus, X, XCircle } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { buildPlan, shiftTimes } from '../engine/plan';
import { HOUR, MIN, addDays, clockOf, toISODate } from '../engine/time';
import type { Plan, PlanBlock, Shift } from '../engine/types';
import { useNow, useToday } from '../state/plan';
import { useStore } from '../state/store';
import { useTheme } from '../theme/theme';
import { inkOn, tint } from '../theme/tokens';
import { clockToMins, minsToClock, TimeStepper } from '../ui/Field';
import { relDay } from '../ui/format';
import { Button, Chip } from '../ui/kit';
import { Press } from '../ui/Press';
import { useToast } from '../ui/Sheet';
import { Label, Txt } from '../ui/Text';

type Kind = 'now' | 'extra' | 'late' | 'cancel' | 'oncall';

const KINDS: { v: Kind; t: string; b: string; icon: LucideIcon }[] = [
  { v: 'now', t: 'Called in now', b: 'They need you today', icon: PhoneIncoming },
  { v: 'extra', t: 'Extra shift later', b: 'Picked up a shift', icon: Plus },
  { v: 'late', t: 'Asked to stay late', b: 'Your shift is running over', icon: Clock4 },
  { v: 'cancel', t: 'Shift cancelled', b: 'Sent home or swapped', icon: XCircle },
  { v: 'oncall', t: 'On-call became work', b: 'You’re going in after all', icon: PhoneCall },
];

export default function CalledIn() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ kind?: string }>();
  const now = useNow();
  const today = useToday();
  const toast = useToast();
  const shifts = useStore((s) => s.shifts);
  const presets = useStore((s) => s.presets);
  const profile = useStore((s) => s.profile);
  const anchors = useStore((s) => s.anchors);

  const initialKind: Kind | null = params.kind === 'late' ? 'late' : params.kind === 'cancel' ? 'cancel' : null;
  const [kind, setKind] = useState<Kind | null>(initialKind);
  const [stage, setStage] = useState<'what' | 'details' | 'preview'>(initialKind ? 'details' : 'what');

  // Details state
  const roundUp = (ms: number) => Math.ceil(ms / (15 * MIN)) * 15 * MIN;
  const defaultStart = clockOf(roundUp(now + profile.commuteMin * MIN));
  const [date, setDate] = useState(() => [1, 2, 3, 0].map((n) => addDays(today, n)).find((d) => !shifts.some((x) => x.date === d)) ?? addDays(today, 1));
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(minsToClock(clockToMins(defaultStart) + 12 * 60));
  const upcoming = shifts.filter((s) => shiftTimes(s).end > now).slice(0, 4);
  const current = shifts.find((s) => {
    const t = shiftTimes(s);
    return t.end > now - 2 * HOUR;
  });
  const [lateBy, setLateBy] = useState(60);
  const [cancelId, setCancelId] = useState<string | null>(upcoming[0]?.id ?? null);

  const newShifts: Shift[] = useMemo(() => {
    if (!kind) return shifts;
    if (kind === 'cancel') return shifts.filter((s) => s.id !== cancelId);
    if (kind === 'late' && current) {
      return shifts.map((s) => (s.id === current.id ? { ...s, end: minsToClock(clockToMins(s.end) + lateBy), overtime: true } : s));
    }
    const d = kind === 'extra' ? date : today;
    const sMin = clockToMins(start);
    const type: Shift['type'] = sMin >= 17 * 60 || sMin < 4 * 60 ? 'night' : sMin >= 13 * 60 ? 'evening' : 'day';
    const add: Shift = { id: `ci-${d}-${start}`, date: d, start, end, type, source: 'called-in', overtime: true };
    const t = shiftTimes(add);
    const keep = shifts.filter((x) => {
      const o = shiftTimes(x);
      return !(o.start < t.end && t.start < o.end);
    });
    return [...keep, add];
  }, [kind, shifts, cancelId, current, lateBy, date, today, start, end]);

  const replaced = kind && kind !== 'cancel' && kind !== 'late' ? shifts.find((x) => !newShifts.includes(x)) : undefined;
  const from = toISODate(now);
  const before = useMemo(() => buildPlan({ shifts, profile, anchors, from: addDays(from, -1), days: 4 }), [shifts, profile, anchors, from]);
  const after = useMemo(() => buildPlan({ shifts: newShifts, profile, anchors, from: addDays(from, -1), days: 4 }), [newShifts, profile, anchors, from]);
  const changes = useMemo(() => diff(before, after, now), [before, after, now]);

  const confirm = () => {
    useStore.setState({ shifts: newShifts.sort((a, b) => (a.date < b.date ? -1 : 1)) });
    toast.show('Plan updated. Reminders moved to match.');
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 52 }}>
        <Label>{stage === 'preview' ? 'Before you confirm' : 'Something changed'}</Label>
        <Press onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close" style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.hover, alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} color={c.ink2} />
        </Press>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        {stage === 'what' ? (
          <View>
            <Txt size={30} weight={600} title style={{ marginBottom: 20 }}>
              What changed?
            </Txt>
            {KINDS.map((k) => (
              <Press
                key={k.v}
                haptic
                sink={0.98}
                onPress={() => {
                  setKind(k.v);
                  setStage('details');
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: c.line }}
              >
                <Txt size={16} lh={22} tone="muted" style={{ flex: 1 }}>
                  <Txt size={16} lh={22} weight={600}>
                    {k.t}.
                  </Txt>{' '}
                  {k.b}.
                </Txt>
                <ArrowRight size={17} color={c.muted} />
              </Press>
            ))}
          </View>
        ) : null}

        {stage === 'details' && kind ? (
          <View>
            <Txt size={30} weight={600} title style={{ marginBottom: 20 }}>
              {KINDS.find((k) => k.v === kind)!.t}
            </Txt>
            {kind === 'extra' ? (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
                {[0, 1, 2, 3].map((n) => {
                  const d = addDays(today, n);
                  return <Chip key={d} label={relDay(d, today)} on={date === d} onPress={() => setDate(d)} />;
                })}
              </View>
            ) : null}
            {kind === 'now' || kind === 'extra' || kind === 'oncall' ? (
              <View>
                <Label style={{ marginBottom: 8 }}>Use a usual shift</Label>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                  {presets.map((p) => (
                    <Chip
                      key={p.id}
                      color={p.color}
                      label={`${p.label}`}
                      on={start === p.start && end === p.end}
                      onPress={() => {
                        setStart(p.start);
                        setEnd(p.end);
                      }}
                    />
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TimeStepper label="Starts" value={start} onChange={setStart} />
                  <TimeStepper label="Ends" value={end} onChange={setEnd} />
                </View>
                {replaced ? (
                  <Txt size={13} tone="amber" style={{ marginTop: 10 }}>
                    This replaces your {replaced.start} to {replaced.end} shift on {relDay(replaced.date, today)}.
                  </Txt>
                ) : null}
                <Txt size={12.5} tone="muted" style={{ marginTop: 8 }}>
                  {kind === 'now' ? `Start time allows for your ${profile.commuteMin}-minute trip in.` : 'Ends the next morning if the end is earlier than the start.'}
                </Txt>
              </View>
            ) : null}
            {kind === 'late' ? (
              current ? (
                <View>
                  <Txt size={15} tone="ink2" style={{ marginBottom: 12 }}>
                    {relDay(current.date, today)}’s shift was {current.start} to {current.end}. How much longer?
                  </Txt>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {[30, 60, 120, 240].map((m) => (
                      <Chip key={m} label={m < 60 ? `${m} min` : `${m / 60} hour${m > 60 ? 's' : ''}`} on={lateBy === m} onPress={() => setLateBy(m)} />
                    ))}
                  </View>
                </View>
              ) : (
                <Txt size={15} tone="muted">
                  There’s no shift on right now to extend.
                </Txt>
              )
            ) : null}
            {kind === 'cancel' ? (
              <View>
                <Txt size={15} tone="ink2" style={{ marginBottom: 12 }}>
                  Which shift is off?
                </Txt>
                {upcoming.map((s) => {
                  const p = presets.find((x) => x.id === s.presetId);
                  const on = cancelId === s.id;
                  return (
                    <Press key={s.id} onPress={() => setCancelId(s.id)} haptic sink={0.98} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accentSoft : 'transparent', marginBottom: 8 }}>
                      <View style={{ width: 30, height: 24, borderRadius: 4, backgroundColor: p?.color ?? c.ink2, alignItems: 'center', justifyContent: 'center' }}>
                        <Txt size={11.5} weight={700} color={inkOn(p?.color ?? '#888888')}>
                          {p?.code ?? '?'}
                        </Txt>
                      </View>
                      <Txt size={15.5} weight={500} style={{ flex: 1 }}>
                        {relDay(s.date, today)}
                      </Txt>
                      <Txt num size={14.5} tone="ink2">
                        {s.start} to {s.end}
                      </Txt>
                    </Press>
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : null}

        {stage === 'preview' ? (
          <View>
            <Txt size={30} weight={600} title style={{ marginBottom: 6 }}>
              Here’s the new plan.
            </Txt>
            <Txt size={15} tone="ink2" style={{ marginBottom: 18 }}>
              The next 48 hours, before and after.
            </Txt>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <MiniColumn title="Before" plan={before} now={now} dim />
              <MiniColumn title="After" plan={after} now={now} />
            </View>
            <Label style={{ marginBottom: 8 }}>What changes</Label>
            {changes.length ? (
              changes.map((t, k) => (
                <View key={k} style={{ flexDirection: 'row', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: c.line }}>
                  <Txt size={15} color={t.warn ? c.amber : undefined} style={{ flex: 1 }}>
                    {t.text}
                  </Txt>
                </View>
              ))
            ) : (
              <Txt size={15} tone="muted">
                Nothing else needs to move.
              </Txt>
            )}
          </View>
        ) : null}
      </ScrollView>

      {stage !== 'what' ? (
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 14, borderTopWidth: 1, borderTopColor: c.line }}>
          <Button big kind="line" label="Back" onPress={() => setStage(stage === 'preview' ? 'details' : 'what')} />
          {stage === 'details' ? (
            <Button big label="See the new plan" style={{ flex: 1 }} full disabled={(kind === 'late' && !current) || (kind === 'cancel' && !cancelId)} onPress={() => setStage('preview')} />
          ) : (
            <Button big label="Confirm" icon={Check} style={{ flex: 1 }} full onPress={confirm} />
          )}
        </View>
      ) : null}
    </View>
  );
}

function MiniColumn({ title, plan, now, dim }: { title: string; plan: Plan; now: number; dim?: boolean }) {
  const { c } = useTheme();
  const start = Math.floor(now / HOUR) * HOUR;
  const end = start + 48 * HOUR;
  const h = 8;
  const items = plan.blocks.filter((b) => b.end > start && b.start < end && ['work', 'sleep', 'nap', 'anchor', 'commute'].includes(b.kind));
  return (
    <View style={{ flex: 1 }}>
      <Txt size={13} weight={600} tone={dim ? 'muted' : 'ink'} style={{ marginBottom: 6 }}>
        {title}
      </Txt>
      <View style={{ height: 48 * h, borderRadius: 10, backgroundColor: c.sunken, borderWidth: 1, borderColor: c.line, opacity: dim ? 0.6 : 1, overflow: 'hidden' }}>
        {[...Array(9)].map((_, k) => (
          <View key={k} style={{ position: 'absolute', left: 0, right: 0, top: k * 6 * h, height: 1, backgroundColor: c.line }} />
        ))}
        {items.map((b) => {
          const top = ((Math.max(b.start, start) - start) / HOUR) * h;
          const bot = ((Math.min(b.end, end) - start) / HOUR) * h;
          const col = b.kind === 'work' ? '#E5A35B' : b.kind === 'sleep' ? c.sleep : b.kind === 'nap' ? c.nap : b.kind === 'anchor' ? (b.color ?? c.good) : c.lineStrong;
          return (
            <View key={b.id} style={{ position: 'absolute', top, height: Math.max(2, bot - top - 1), left: b.kind === 'anchor' ? '60%' : 4, right: 4, borderRadius: 4, backgroundColor: b.kind === 'sleep' ? c.sleepFill : b.kind === 'work' || b.kind === 'anchor' ? col : tint(col.startsWith('#') ? col : '#888888', 0.4), paddingLeft: 5, justifyContent: 'center' }}>
              {bot - top > 26 && b.kind !== 'commute' ? (
                <Txt num size={10.5} weight={b.kind === 'work' ? 600 : 400} color={b.kind === 'sleep' ? c.sleepInk : b.kind === 'work' || b.kind === 'anchor' ? inkOn(col) : c.ink} numberOfLines={1}>
                  {clockOf(b.start)} {b.kind === 'work' ? 'Work' : b.kind === 'sleep' ? 'Sleep' : b.kind === 'nap' ? 'Nap' : b.title}
                </Txt>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function diff(a: Plan, b: Plan, now: number) {
  const win = (x: PlanBlock) => x.end > now && x.start < now + 48 * HOUR;
  const out: { text: string; warn?: boolean }[] = [];
  const key = (x: PlanBlock) => `${x.kind}|${x.start}|${x.end}`;
  const aSleeps = a.blocks.filter((x) => (x.kind === 'sleep' || x.kind === 'nap') && win(x));
  const bSleeps = b.blocks.filter((x) => (x.kind === 'sleep' || x.kind === 'nap') && win(x));
  const aKeys = new Set(aSleeps.map(key));
  const bKeys = new Set(bSleeps.map(key));
  for (const s of bSleeps) {
    if (aKeys.has(key(s))) continue;
    const was = aSleeps.find((o) => o.kind === s.kind && o.start < s.end && s.start < o.end && !bKeys.has(key(o)));
    const day = relDayLoose(s.start, now);
    if (was) out.push({ text: `${s.kind === 'nap' ? 'Nap' : 'Sleep'} moves to ${day} ${clockOf(s.start)} to ${clockOf(s.end)} (was ${clockOf(was.start)} to ${clockOf(was.end)})` });
    else out.push({ text: `${s.kind === 'nap' ? 'New nap' : 'New sleep'} ${day} ${clockOf(s.start)} to ${clockOf(s.end)}` });
  }
  for (const s of aSleeps) {
    if (bKeys.has(key(s))) continue;
    if (!bSleeps.some((o) => o.kind === s.kind && o.start < s.end && s.start < o.end)) out.push({ text: `${s.kind === 'nap' ? 'Nap' : 'Sleep'} at ${clockOf(s.start)} no longer fits`, warn: true });
  }
  const aDrive = new Set(a.markers.filter((m) => m.kind === 'drive-check').map((m) => m.at));
  for (const m of b.markers.filter((x) => x.kind === 'drive-check' && x.at > now && x.at < now + 48 * HOUR && !aDrive.has(x.at))) out.push({ text: `Drive check-in added at ${clockOf(m.at)}` });
  const aSkip = new Set(a.skipped.map((x) => `${x.title}${x.start}`));
  for (const s of b.skipped.filter((x) => win(x) && !aSkip.has(`${x.title}${x.start}`))) out.push({ text: `${s.title} at ${clockOf(s.start)} won’t fit. Worth telling someone?`, warn: true });
  for (const s of b.blocks.filter((x) => x.kind === 'anchor' && x.atRisk && win(x))) {
    const was = a.blocks.find((x) => x.kind === 'anchor' && x.title === s.title && x.start === s.start);
    if (!was?.atRisk) out.push({ text: `${s.title} at ${clockOf(s.start)} now clashes with sleep`, warn: true });
  }
  return out;
}

function relDayLoose(ms: number, now: number) {
  const d = toISODate(ms);
  const t = toISODate(now);
  if (d === t) return 'today';
  if (d === addDays(t, 1)) return 'tomorrow';
  return relDay(d, t);
}

