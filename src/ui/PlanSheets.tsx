import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AlertTriangle, CalendarClock, Car, PhoneCall } from 'lucide-react-native';
import { clockOf } from '../engine/time';
import type { PlanBlock, PlanMarker } from '../engine/types';
import { useTheme } from '../theme/theme';
import { Button, Pill } from './kit';
import { dur, range } from './format';
import { Press } from './Press';
import { Sheet, useToast } from './Sheet';
import { Label, Txt } from './Text';

export function BlockSheet({ block, onClose }: { block: PlanBlock | null; onClose: () => void }) {
  const { c } = useTheme();
  const b = block;
  return (
    <Sheet
      open={!!b}
      onClose={onClose}
      title={b?.title}
      footer={
        b?.kind === 'work' ? (
          <View style={{ gap: 8 }}>
            <Button
              big
              full
              label="I got called in or it changed"
              icon={PhoneCall}
              onPress={() => {
                onClose();
                router.push('/called-in');
              }}
            />
            <Button
              big
              full
              kind="line"
              label="Edit in Schedule"
              icon={CalendarClock}
              onPress={() => {
                onClose();
                router.navigate('/schedule');
              }}
            />
          </View>
        ) : undefined
      }
    >
      {b ? (
        <View style={{ paddingTop: 2 }}>
          <Txt num size={15} tone="ink2">
            {range(b.start, b.end)} · {dur(b.end - b.start)}
          </Txt>
          <Txt size={17} weight={500} style={{ marginTop: 14 }}>
            {b.action}
          </Txt>
          {b.confidence === 'best-effort' || b.atRisk ? (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, backgroundColor: c.amberSoft, borderRadius: 10, padding: 12 }}>
              <AlertTriangle size={16} color={c.amber} style={{ marginTop: 2 }} />
              <Txt size={13.5} tone="ink2" style={{ flex: 1 }}>
                {b.kind === 'anchor' ? 'This doesn’t fit neatly around sleep today. Keep it if it matters, and the plan works around it as best it can.' : 'Not every rule fits today, so this plan does what it can with the time you have.'}
              </Txt>
            </View>
          ) : null}
          <Label style={{ marginTop: 22, marginBottom: 6 }}>Why</Label>
          <Txt size={15} tone="ink2" lh={22}>
            {b.why}
          </Txt>
          <Txt size={12} tone="muted" style={{ marginTop: 22 }}>
            General planning guidance, not medical advice. Your own sense of how you feel comes first.
          </Txt>
        </View>
      ) : null}
    </Sheet>
  );
}

const SCALE = [
  { label: 'Wide awake', tone: 'good' as const },
  { label: 'Fine', tone: 'good' as const },
  { label: 'A bit tired', tone: 'amber' as const },
  { label: 'Very tired', tone: 'pen' as const },
  { label: 'Fighting to stay awake', tone: 'pen' as const },
];

export function MarkerSheet({ marker, onClose, sleepAt }: { marker: PlanMarker | null; onClose: () => void; sleepAt?: number }) {
  const { c } = useTheme();
  const toast = useToast();
  const [answer, setAnswer] = useState<number | null>(null);
  const m = marker;
  const close = () => {
    setAnswer(null);
    onClose();
  };
  const isDrive = m?.kind === 'drive-check';
  return (
    <Sheet open={!!m} onClose={close} title={isDrive ? 'How alert do you feel?' : m?.title}>
      {m && !isDrive ? (
        <View>
          <Txt num size={15} tone="ink2">
            {clockOf(m.at)}
          </Txt>
          <Label style={{ marginTop: 18, marginBottom: 6 }}>Why</Label>
          <Txt size={15} tone="ink2" lh={22}>
            {m.why}
          </Txt>
        </View>
      ) : null}
      {m && isDrive ? (
        <View>
          <Txt size={14.5} tone="ink2" style={{ marginBottom: 14 }}>
            A quick honest check before you drive. Nothing here is scored or shared.
          </Txt>
          <View style={{ gap: 8 }}>
            {SCALE.map((s, i) => {
              const on = answer === i;
              return (
                <Press
                  key={s.label}
                  onPress={() => setAnswer(i)}
                  haptic
                  sink={0.98}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  style={{
                    minHeight: 52,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: on ? c.ink2 : c.line,
                    backgroundColor: on ? c.hover : 'transparent',
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', gap: 3 }}>
                    {[0, 1, 2, 3, 4].map((k) => (
                      <View key={k} style={{ width: 5, height: 14, borderRadius: 2, backgroundColor: k <= 4 - i ? c[s.tone] : c.hover }} />
                    ))}
                  </View>
                  <Txt size={16} weight={on ? 600 : 400}>
                    {s.label}
                  </Txt>
                </Press>
              );
            })}
          </View>
          {answer !== null ? (
            <View style={{ marginTop: 18, padding: 14, borderRadius: 12, backgroundColor: answer <= 1 ? c.goodSoft : answer === 2 ? c.amberSoft : c.penSoft }}>
              <Txt size={15.5} weight={500}>
                {answer <= 1
                  ? `Sunglasses on${sleepAt ? `, sleep by ${clockOf(sleepAt)}` : ''}. Drive safe.`
                  : answer === 2
                    ? 'Try a 15 to 20 minute nap before you leave. Coffee first, then the nap, works well if the drive is long.'
                    : 'Think about another way home today, like a lift or a taxi. Sleeping at work first is fine too, if that’s allowed.'}
              </Txt>
              <View style={{ marginTop: 12, flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {answer <= 1 ? (
                  <Button
                    label="I’m home safe"
                    icon={Car}
                    onPress={() => {
                      toast.show('Home safe. Sleep well.');
                      close();
                    }}
                  />
                ) : answer === 2 ? (
                  <Button
                    label="Start a 20 minute nap"
                    onPress={() => {
                      toast.show('Nap timer set for 20 minutes');
                      close();
                    }}
                  />
                ) : (
                  <Button label="Show my ride options" onPress={() => toast.show('Ride shortcuts arrive with the next build')} />
                )}
              </View>
            </View>
          ) : null}
          <View style={{ marginTop: 16 }}>
            <Pill label="Only your answer is kept, on this phone" tone="accent" />
          </View>
        </View>
      ) : null}
    </Sheet>
  );
}
