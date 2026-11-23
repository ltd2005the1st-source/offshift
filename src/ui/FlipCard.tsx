import { useState } from 'react';
import { View } from 'react-native';
import { ArrowRightLeft, Check } from 'lucide-react-native';
import { clockOf, toISODate } from '../engine/time';
import type { Transition } from '../engine/types';
import { useTheme } from '../theme/theme';
import { Card } from './kit';
import { relDay } from './format';
import { Press } from './Press';
import { Txt } from './Text';

/** A step-by-step plan for a change of shift type. Steps tick off as you go. */
export function FlipCard({ t, today }: { t: Transition; today: string }) {
  const { c } = useTheme();
  const [done, setDone] = useState<number[]>([]);
  return (
    <Card style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <ArrowRightLeft size={16} color={c.amber} />
        <Txt size={16} weight={600}>
          {t.title}
        </Txt>
        <Txt size={13} tone="muted" style={{ marginLeft: 'auto' }}>
          {relDay(t.date, today)}
        </Txt>
      </View>
      <Txt size={14} tone="ink2" style={{ marginBottom: 12 }}>
        {t.summary}
      </Txt>
      {t.steps.map((s, i) => {
        const on = done.includes(i);
        const dayChange = i > 0 && toISODate(t.steps[i - 1].at) !== toISODate(s.at);
        return (
          <View key={i}>
            {dayChange || i === 0 ? (
              <Txt size={11} weight={600} tone="muted" style={{ letterSpacing: 0.7, textTransform: 'uppercase', marginTop: i ? 8 : 0, marginBottom: 2 }}>
                {relDay(toISODate(s.at), today)}
              </Txt>
            ) : null}
            <Press
              onPress={() => setDone(on ? done.filter((x) => x !== i) : [...done, i])}
              haptic
              sink={0.98}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: on ? c.accent : c.lineStrong,
                  backgroundColor: on ? c.accent : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {on ? <Check size={13} color={c.surface} strokeWidth={3} /> : null}
              </View>
              <Txt num size={13.5} tone="muted" style={{ width: 42 }}>
                {clockOf(s.at)}
              </Txt>
              <Txt size={15} tone={on ? 'muted' : 'ink'} style={{ flex: 1, textDecorationLine: on ? 'line-through' : 'none' }}>
                {s.text}
              </Txt>
            </Press>
          </View>
        );
      })}
    </Card>
  );
}
