import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { HOUR, addDays, dayStart, toISODate } from '../../engine/time';
import { usePlan, useNow, useToday } from '../../state/plan';
import { useStore } from '../../state/store';
import { useTheme } from '../../theme/theme';
import { FlipCard } from '../../ui/FlipCard';
import { dur, range, relDay, shortDate } from '../../ui/format';
import { Empty, IconButton, PageHeader, Rise, Section } from '../../ui/kit';
import { Press } from '../../ui/Press';
import { Screen } from '../../ui/Screen';
import { Txt } from '../../ui/Text';
import { Legend, WeekStrips } from '../../ui/WeekStrips';

export default function Week() {
  const { c } = useTheme();
  const today = useToday();
  const now = useNow();
  const [offset, setOffset] = useState(0);
  const from = addDays(today, offset * 7);
  const plan = usePlan(from, 7);
  const need = useStore((s) => s.profile.sleepNeedH);
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));

  const load = days.map((d) => {
    const s = dayStart(d);
    const e = dayStart(addDays(d, 1));
    const sum = (k: string) => plan.blocks.filter((b) => b.kind === k && b.end > s && b.start < e).reduce((t, b) => t + Math.min(b.end, e) - Math.max(b.start, s), 0);
    const work = sum('work') / HOUR;
    const sleep = (sum('sleep') + sum('nap')) / HOUR;
    const debt = Math.max(0, need - sleep);
    return { d, work, debt, v: Math.min(1, (work + debt * 2) / 16) };
  });

  const free = plan.blocks
    .filter((b) => b.kind === 'free' && b.energy === 'good' && b.end - b.start >= 2 * HOUR && b.end > now && b.start < dayStart(addDays(from, 7)))
    .slice(0, 6);
  const transitions = plan.transitions.filter((t) => days.includes(t.date));

  return (
    <Screen>
      <PageHeader
        eyebrow={offset === 0 ? 'Next seven days' : `Week of ${shortDate(from)}`}
        title="Your week"
        right={
          <View style={{ flexDirection: 'row' }}>
            <IconButton icon={ChevronLeft} label="Previous week" onPress={() => setOffset(offset - 1)} />
            <IconButton icon={ChevronRight} label="Next week" onPress={() => setOffset(offset + 1)} />
          </View>
        }
      />

      <Rise>
        <WeekStrips plan={plan} from={from} today={today} now={now} highlight={transitions.map((t) => t.date)} onDay={(d) => router.navigate({ pathname: '/today', params: { date: d } })} />
        {/* load meter: hours of work plus sleep debt, never a score */}
        <View style={{ flexDirection: 'row', marginLeft: 24, marginTop: 8 }}>
          {load.map((l) => (
            <View key={l.d} style={{ flex: 1, marginHorizontal: 2 + 4, height: 4, borderRadius: 2, backgroundColor: c.hover, overflow: 'hidden' }} accessibilityLabel={`${relDay(l.d, today)}: ${Math.round(l.work)} hours of work`}>
              <View style={{ width: `${l.v * 100}%`, height: 4, borderRadius: 2, backgroundColor: l.debt > 1 ? c.amber : c.ink2 }} />
            </View>
          ))}
        </View>
        <Legend />
      </Rise>

      <Section title="Changes coming up" qualifier={transitions.length ? String(transitions.length) : undefined} style={{ marginTop: 28 }}>
        {transitions.length ? transitions.map((t) => <FlipCard key={t.date + t.kind} t={t} today={today} />) : <Empty text="No flips this week. Same rhythm all the way through." />}
      </Section>

      <Section title="Good-energy free time" qualifier="2 hours or more">
        {free.length ? (
          free.map((b) => (
            <Press key={b.id} onPress={() => router.navigate({ pathname: '/today', params: { date: toISODate(b.start) } })} sink={0.98} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line, gap: 12 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: c.good }} />
              <Txt size={15} weight={500} style={{ width: 92 }}>
                {relDay(toISODate(b.start), today)}
              </Txt>
              <Txt num size={14.5} tone="ink2" style={{ flex: 1 }}>
                {range(b.start, b.end)}
              </Txt>
              <Txt num size={13} tone="muted">
                {dur(b.end - b.start)}
              </Txt>
            </Press>
          ))
        ) : (
          <Empty text="No long free stretches this week. Short ones are on Today." />
        )}
      </Section>
    </Screen>
  );
}
