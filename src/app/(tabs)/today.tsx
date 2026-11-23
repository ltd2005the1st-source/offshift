import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRightLeft, Clock4, PhoneCall, Plus, XCircle } from 'lucide-react-native';
import { HOUR, addDays, at, clockOf, dayStart } from '../../engine/time';
import type { PlanBlock, PlanMarker } from '../../engine/types';
import { usePlan, useNow, useToday } from '../../state/plan';
import { useStore } from '../../state/store';
import { useTheme } from '../../theme/theme';
import { lookFor, shiftColor } from '../../ui/blockStyle';
import { dayNum, dayTitle, dur, greeting, longDate, range, relDay, weekdayShort } from '../../ui/format';
import { Bar, Card, Chip, Dot, LinkAction, Rise, Section } from '../../ui/kit';
import { BlockSheet, MarkerSheet } from '../../ui/PlanSheets';
import { Press } from '../../ui/Press';
import { Screen } from '../../ui/Screen';
import { currentBlock, daySentence, freeOn, nextBlocks, sleepLast24 } from '../../ui/summary';
import { Label, Txt } from '../../ui/Text';
import { Timeline } from '../../ui/Timeline';

export default function Today() {
  const { c } = useTheme();
  const now = useNow();
  const today = useToday();
  const params = useLocalSearchParams<{ date?: string }>();
  const [date, setDate] = useState(params.date ?? today);
  useEffect(() => setDate(today), [today]);
  useEffect(() => {
    if (params.date) setDate(params.date);
  }, [params.date]);
  const plan = usePlan(addDays(today, -1), 12);
  const profile = useStore((s) => s.profile);
  const presets = useStore((s) => s.presets);
  const shifts = useStore((s) => s.shifts);
  const [block, setBlock] = useState<PlanBlock | null>(null);
  const [marker, setMarker] = useState<PlanMarker | null>(null);
  const isToday = date === today;

  const cur = isToday ? currentBlock(plan, now) : undefined;
  const nexts = isToday ? nextBlocks(plan, now, 3).filter((b) => b.id !== cur?.id).slice(0, 2) : [];
  const transition = plan.transitions.find((t) => t.date === date) ?? (isToday ? plan.transitions.find((t) => t.date === addDays(today, 1)) : undefined);

  // The timeline opens on the current moment, not midnight.
  const [tStart, tEnd] = useMemo(() => {
    if (isToday) {
      const s = Math.floor((now - 1.5 * HOUR) / HOUR) * HOUR;
      return [s, s + 26 * HOUR];
    }
    return [at(date, '05:00'), at(date, '08:00', 1)];
  }, [isToday, now, date]);

  const nextSleep = plan.blocks.find((b) => b.kind === 'sleep' && b.start > now);
  const cutoff = plan.markers.find((m) => m.kind === 'caffeine-cutoff' && m.at > (isToday ? now - HOUR : dayStart(date)));
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 1));

  return (
    <Screen>
      {/* Day strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} style={{ marginHorizontal: -20, marginBottom: 22 }}>
        <View style={{ width: 14 }} />
        {days.map((d) => {
          const on = d === date;
          const s = shifts.find((x) => x.date === d);
          const p = presets.find((x) => x.id === s?.presetId);
          const flip = plan.transitions.some((t) => t.date === d);
          return (
            <Press
              key={d}
              onPress={() => setDate(d)}
              haptic
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={relDay(d, today)}
              style={{
                width: 48,
                paddingVertical: 8,
                borderRadius: 12,
                alignItems: 'center',
                gap: 3,
                backgroundColor: on ? c.surface : 'transparent',
                borderWidth: 1,
                borderColor: on ? c.hairline : 'transparent',
              }}
            >
              <Txt size={10.5} weight={600} tone={d === today ? 'pen' : 'muted'} lh={13} style={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {weekdayShort(d)}
              </Txt>
              <Txt num size={18} weight={on ? 600 : 500} tone={on ? 'ink' : 'ink2'} lh={22}>
                {dayNum(d)}
              </Txt>
              <View style={{ height: 6, flexDirection: 'row', gap: 3, alignItems: 'center' }}>
                {p ? <Dot color={p.color} size={6} /> : null}
                {flip ? <Dot color={c.amber} size={6} /> : null}
              </View>
            </Press>
          );
        })}
        <View style={{ width: 14 }} />
      </ScrollView>

      {/* Hero */}
      <Rise>
        <Txt size={34} weight={600} title>
          {isToday ? `${greeting(now)}${profile.name ? `, ${profile.name}` : ''}.` : dayTitle(date, today)}
        </Txt>
        <Txt size={15.5} tone="ink2" style={{ marginTop: 8 }}>
          {daySentence(plan, date, now)}
        </Txt>
      </Rise>

      {transition ? (
        <Rise delay={0.05}>
          <Press
            onPress={() => router.navigate('/week')}
            sink={0.98}
            accessibilityRole="button"
            style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.amberSoft, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}
          >
            <ArrowRightLeft size={17} color={c.amber} />
            <View style={{ flex: 1 }}>
              <Txt size={14.5} weight={600}>
                {transition.title}
                <Txt size={14.5} tone="muted">
                  {'  ·  '}
                  {relDay(transition.date, today)}
                </Txt>
              </Txt>
              <Txt size={13} tone="ink2">
                {transition.summary}
              </Txt>
            </View>
          </Press>
        </Rise>
      ) : null}

      {/* Now */}
      {cur ? (
        <Rise delay={0.08}>
          <NowCard b={cur} now={now} onPress={() => setBlock(cur)} workColor={cur.kind === 'work' ? shiftColor(cur, presets, shifts) : undefined} />
        </Rise>
      ) : null}

      {nexts.length ? (
        <Rise delay={0.12} style={{ marginTop: 22 }}>
          <Section title="Next up">
            {nexts.map((b) => {
              return (
                <Press key={b.id} onPress={() => setBlock(b)} sink={0.98} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'baseline', gap: 14, paddingVertical: 10 }}>
                  <View style={{ width: 62 }}>
                    <Txt num size={15} weight={600}>
                      {clockOf(b.start)}
                    </Txt>
                    <Txt num size={12} tone="muted">
                      in {dur(b.start - now)}
                    </Txt>
                  </View>
                  <Txt size={15} lh={21} tone="ink2" style={{ flex: 1 }}>
                    <Txt size={15} lh={21} weight={600}>
                      {b.title}.
                    </Txt>{' '}
                    {/[.!?]$/.test(b.action) ? b.action : `${b.action}.`}
                  </Txt>
                </Press>
              );
            })}
          </Section>
        </Rise>
      ) : null}

      {/* Quick actions */}
      {isToday ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, marginTop: nexts.length ? -6 : 20, marginBottom: 26 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
          <Chip label="I got called in" icon={PhoneCall} onPress={() => router.push('/called-in')} />
          <Chip label="Staying late" icon={Clock4} onPress={() => router.push({ pathname: '/called-in', params: { kind: 'late' } })} />
          <Chip label="Shift cancelled" icon={XCircle} onPress={() => router.push({ pathname: '/called-in', params: { kind: 'cancel' } })} />
          <Chip label="Add something" icon={Plus} onPress={() => router.navigate('/life')} />
        </ScrollView>
      ) : (
        <View style={{ height: 24 }} />
      )}

      {/* Day summary */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 28 }}>
        <Stat value={dur(sleepLast24(plan, isToday ? now : at(date, '23:59')))} label={isToday ? 'Sleep, last 24h' : 'Sleep that day'} />
        <Stat value={cutoff ? clockOf(cutoff.at) : 'None'} label="Last coffee" />
        <Stat value={dur(freeOn(plan, date, isToday ? now : undefined))} label={isToday ? 'Free, rest of today' : 'Free time'} />
      </View>

      <Section title={isToday ? 'Next 24 hours' : 'The day'} qualifier={nextSleep && isToday ? `sleep ${range(nextSleep.start, nextSleep.end)}` : undefined} action={<LinkAction label="Week" onPress={() => router.navigate('/week')} />}>
        <Timeline plan={plan} start={tStart} end={tEnd} now={now} onBlock={setBlock} onMarker={setMarker} />
      </Section>

      <Txt size={12} tone="muted" center style={{ marginTop: 4 }}>
        Planning guidance, not medical advice.
      </Txt>

      <BlockSheet block={block} onClose={() => setBlock(null)} />
      <MarkerSheet marker={marker} onClose={() => setMarker(null)} sleepAt={nextSleep?.start} />
    </Screen>
  );
}

function NowCard({ b, now, onPress, workColor }: { b: PlanBlock; now: number; onPress: () => void; workColor?: string }) {
  const { c } = useTheme();
  const look = lookFor(b, c, workColor);
  const Icon = look.icon;
  const p = (now - b.start) / (b.end - b.start);
  const asleep = b.kind === 'sleep';
  return (
    <Card style={{ marginTop: 20, overflow: 'hidden' }} pad={0} onPress={onPress} accessibilityLabel={`Now: ${b.title}`}>
      <View style={{ height: 3, backgroundColor: look.edge === c.lineStrong ? c.ink2 : look.edge }} />
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ backgroundColor: c.pen, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1 }}>
              <Txt size={10.5} weight={700} color="#fff" lh={16} style={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>
                Now
              </Txt>
            </View>
            <Txt num size={13} tone="muted">
              {dur(b.end - now)} left
            </Txt>
          </View>
          <Icon size={18} color={look.edge === c.lineStrong ? c.ink2 : look.edge} />
        </View>
        <Txt size={24} weight={600} display style={{ marginTop: 10 }}>
          {b.title}
        </Txt>
        <Txt size={15.5} tone="ink2" style={{ marginTop: 4 }}>
          {asleep ? `You’re in your sleep window. Phone down, up at ${clockOf(b.end)}.` : b.action}
        </Txt>
        <View style={{ marginTop: 14 }}>
          <Bar value={p} color={look.edge === c.lineStrong ? c.ink2 : look.edge} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Txt num size={11.5} tone="muted">
            {clockOf(b.start)}
          </Txt>
          <Txt size={12.5} tone="muted">
            Why this? →
          </Txt>
          <Txt num size={11.5} tone="muted">
            {clockOf(b.end)}
          </Txt>
        </View>
      </View>
    </Card>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.hover, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center' }}>
      <Txt num size={17} weight={600}>
        {value}
      </Txt>
      <Txt size={11.5} tone="muted" center style={{ marginTop: 2 }}>
        {label}
      </Txt>
    </View>
  );
}
