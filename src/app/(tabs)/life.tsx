import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Check, Lock, Plus, Share2 } from 'lucide-react-native';
import { clockOf, toISODate } from '../../engine/time';
import type { Anchor } from '../../engine/types';
import { usePlan, useNow, useToday } from '../../state/plan';
import { useStore } from '../../state/store';
import { ms, useTheme } from '../../theme/theme';
import { Field, TimeStepper } from '../../ui/Field';
import { dur, range, relDay } from '../../ui/format';
import { Button, Card, Dot, Empty, PageHeader, Pill, Section, Segmented } from '../../ui/kit';
import { Press } from '../../ui/Press';
import { Screen } from '../../ui/Screen';
import { Sheet, useToast } from '../../ui/Sheet';
import { Label, Txt } from '../../ui/Text';
import { currentBlock } from '../../ui/summary';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const COLORS = ['#7FB08A', '#D88FB4', '#E0A458', '#6FA8DC', '#E67C73', '#9C8CE6', '#C0903A', '#8A877E'];

function daysText(days: number[]) {
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return 'Weekdays';
  const n = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return DAY_ORDER.filter((d) => days.includes(d))
    .map((d) => n[d])
    .join(', ');
}

export default function Life() {
  const { c } = useTheme();
  const today = useToday();
  const now = useNow();
  const plan = usePlan(today, 7);
  const anchors = useStore((s) => s.anchors);
  const profile = useStore((s) => s.profile);
  const [edit, setEdit] = useState<Anchor | null>(null);

  const free = plan.blocks
    .map((b) => (b.start < now ? { ...b, start: Math.ceil(now / 900_000) * 900_000 } : b))
    .filter((b) => b.kind === 'free' && b.end - b.start >= 90 * 60_000)
    .sort((a, b) => (a.energy === b.energy ? b.end - b.start - (a.end - a.start) : a.energy === 'good' ? -1 : 1))
    .slice(0, 5);

  const cur = currentBlock(plan, now);
  const status = cur?.kind === 'sleep' || cur?.kind === 'nap' ? 'Asleep' : cur?.kind === 'work' ? 'At work' : cur?.kind === 'commute' ? 'On the way' : 'Free';
  const statusUntil = cur && cur.kind !== 'free' ? ` until ${clockOf(cur.end)}` : '';

  return (
    <Screen>
      <PageHeader title="Off the clock" sub="What has to happen, when you have time for it, and who needs to know." />

      <Section title="Free time this week" qualifier="best first">
        {free.length ? (
          free.map((b) => (
            <Press
              key={b.id}
              sink={0.98}
              onPress={() => router.navigate({ pathname: '/today', params: { date: toISODate(b.start) } })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: c.line }}
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: b.energy === 'good' ? c.good : c.lineStrong }} />
              <View style={{ flex: 1 }}>
                <Txt size={15} weight={500}>
                  {relDay(toISODate(b.start), today)}{' '}
                  <Txt num size={15} tone="ink2">
                    {range(b.start, b.end)}
                  </Txt>
                </Txt>
                <Txt size={12.5} tone="muted">
                  {b.energy === 'good' ? 'Good energy, for errands and appointments' : 'Low energy · keep it easy'}
                </Txt>
              </View>
              <Txt num size={13} tone="muted">
                {dur(b.end - b.start)}
              </Txt>
            </Press>
          ))
        ) : (
          <Empty text="Not much free time this week. Look after yourself." />
        )}
      </Section>

      <Section
        title="Fixed commitments"
        qualifier={anchors.length ? String(anchors.length) : undefined}
        action={
          <Press onPress={() => setEdit({ id: `a-${Date.now()}`, title: '', days: [1, 2, 3, 4, 5], start: '15:00', end: '15:30', priority: 'must', color: COLORS[anchors.length % COLORS.length] })} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Plus size={15} color={c.ink2} />
            <Txt size={13.5} tone="ink2">
              Add
            </Txt>
          </Press>
        }
      >
        <Txt size={13} tone="muted" style={{ marginBottom: 8 }}>
          School runs, pet walks, classes. Must-do ones are planned before sleep; flexible ones fit where they can.
        </Txt>
        {anchors.length ? (
          anchors.map((a) => (
            <Press key={a.id} onPress={() => setEdit(a)} sink={0.98} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: c.line }}>
              <Dot color={a.color} size={10} />
              <View style={{ flex: 1 }}>
                <Txt size={15} weight={500}>
                  {a.title}
                </Txt>
                <Txt num size={12.5} tone="muted">
                  {daysText(a.days)} · {a.start} to {a.end}
                </Txt>
              </View>
              {a.priority === 'must' ? <Lock size={14} color={c.muted} /> : <Txt size={12} tone="muted">If it fits</Txt>}
            </Press>
          ))
        ) : (
          <Empty text="Nothing fixed yet. Add the things your week has to work around." />
        )}
      </Section>

      <Section title="Share with home" qualifier="family link">
        <Card>
          <Label style={{ marginBottom: 10 }}>What they’ll see</Label>
          <View style={{ backgroundColor: c.sunken, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.line }}>
            <Txt size={13} tone="muted">
              {profile.name || 'You'} right now
            </Txt>
            <Txt size={22} weight={600} display style={{ marginTop: 2 }}>
              {status}
              <Txt size={22} weight={400} tone="ink2">
                {statusUntil}
              </Txt>
            </Txt>
            <Txt size={12.5} tone="muted" style={{ marginTop: 6 }}>
              No workplace, location or sleep details. Just the status and the next few days.
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <Button label="Create a link" icon={Share2} disabled />
            <Pill label="Needs sign-in · coming soon" tone="accent" />
          </View>
        </Card>
      </Section>

      <AnchorSheet anchor={edit} onClose={() => setEdit(null)} />
    </Screen>
  );
}

function AnchorSheet({ anchor, onClose }: { anchor: Anchor | null; onClose: () => void }) {
  const { c } = useTheme();
  const upsert = useStore((s) => s.upsertAnchor);
  const remove = useStore((s) => s.removeAnchor);
  const exists = useStore((s) => s.anchors.some((a) => a.id === anchor?.id));
  const toast = useToast();
  const [a, setA] = useState<Anchor | null>(anchor);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    setA(anchor);
    setConfirm(false);
  }, [anchor]);
  useEffect(() => {
    if (!confirm) return;
    const id = setTimeout(() => setConfirm(false), ms(3500 * 1.5));
    return () => clearTimeout(id);
  }, [confirm]);
  if (!a) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;
  const set = (p: Partial<Anchor>) => setA({ ...a, ...p });
  return (
    <Sheet
      open={!!anchor}
      onClose={onClose}
      title={exists ? 'Edit commitment' : 'New commitment'}
      footer={
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {exists ? (
            <Button
              kind={confirm ? 'primary' : 'ghost'}
              danger={!confirm}
              label={confirm ? 'Tap again to delete' : 'Delete'}
              style={confirm ? { backgroundColor: c.pen } : undefined}
              onPress={() => {
                if (!confirm) return setConfirm(true);
                remove(a.id);
                toast.show(`Removed ${a.title}. Plan updated.`);
                onClose();
              }}
            />
          ) : (
            <View />
          )}
          <Button
            label="Save"
            icon={Check}
            disabled={!a.title.trim() || !a.days.length}
            onPress={() => {
              upsert({ ...a, title: a.title.trim() });
              toast.show(`${a.title.trim()} saved. Plan updated.`);
              onClose();
            }}
          />
        </View>
      }
    >
      <Field label="What" placeholder="School pickup, walk the dog…" value={a.title} onChangeText={(title) => set({ title })} autoFocus={!exists} />
      <Label style={{ marginBottom: 6 }}>Which days</Label>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
        {DAY_ORDER.map((d) => {
          const on = a.days.includes(d);
          return (
            <Press
              key={d}
              haptic
              onPress={() => set({ days: on ? a.days.filter((x) => x !== d) : [...a.days, d] })}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={{ flex: 1, height: 40, borderRadius: 20, borderWidth: 1, borderColor: on ? c.ink : c.line, backgroundColor: on ? c.ink : 'transparent', alignItems: 'center', justifyContent: 'center' }}
            >
              <Txt size={14} weight={600} color={on ? c.onInk : c.ink2}>
                {DAYS[d]}
              </Txt>
            </Press>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        <TimeStepper label="From" value={a.start} onChange={(start) => set({ start })} />
        <TimeStepper label="To" value={a.end} onChange={(end) => set({ end })} />
      </View>
      <Label style={{ marginBottom: 6 }}>How fixed is it?</Label>
      <Segmented
        full
        value={a.priority}
        onChange={(priority) => set({ priority })}
        options={[
          { value: 'must', label: 'Has to happen' },
          { value: 'prefer', label: 'If it fits' },
        ]}
      />
      <Txt size={12.5} tone="muted" style={{ marginTop: 6, marginBottom: 16 }}>
        {a.priority === 'must' ? 'Sleep is planned around it, even if that means splitting it.' : 'Kept when it fits around sleep and work, skipped quietly when it doesn’t.'}
      </Txt>
      <Label style={{ marginBottom: 8 }}>Colour</Label>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {COLORS.map((col) => (
          <Press key={col} onPress={() => set({ color: col })} accessibilityLabel={`Colour ${col}`} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: col, borderWidth: 2, borderColor: a.color === col ? c.ink : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            {a.color === col ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
          </Press>
        ))}
      </View>
    </Sheet>
  );
}

