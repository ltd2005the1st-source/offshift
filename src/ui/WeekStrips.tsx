import { View } from 'react-native';
import { ArrowRightLeft } from 'lucide-react-native';
import { HOUR, addDays, dayStart } from '../engine/time';
import type { Plan, PlanBlock } from '../engine/types';
import { useStore } from '../state/store';
import { useTheme } from '../theme/theme';
import { tint } from '../theme/tokens';
import { shiftColor } from './blockStyle';
import { dayNum, weekdayShort } from './format';
import { Press } from './Press';
import { Txt } from './Text';

const GUTTER = 24;

/**
 * Seven vertical day strips, same colours as Today. A night shift runs off the
 * bottom of one strip and carries on at the top of the next, with flat edges
 * where it continues so it still reads as one block.
 */
export function WeekStrips({
  plan,
  from,
  today,
  now,
  hourH = 16,
  onDay,
  highlight,
}: {
  plan: Plan;
  from: string;
  today: string;
  now: number;
  hourH?: number;
  onDay?: (date: string) => void;
  highlight?: string[];
}) {
  const { c } = useTheme();
  const presets = useStore((s) => s.presets);
  const shifts = useStore((s) => s.shifts);
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
  const H = 24 * hourH;

  const shown = (b: PlanBlock) => ['work', 'sleep', 'nap', 'anchor', 'free', 'commute'].includes(b.kind) && !(b.kind === 'free' && b.energy !== 'good');

  return (
    <View>
      {/* headers */}
      <View style={{ flexDirection: 'row', marginLeft: GUTTER, marginBottom: 8 }}>
        {days.map((d) => {
          const t = plan.transitions.find((x) => x.date === d);
          const isToday = d === today;
          return (
            <Press key={d} onPress={() => onDay?.(d)} style={{ flex: 1, alignItems: 'center', gap: 2 }} accessibilityRole="button" accessibilityLabel={d}>
              <Txt size={10.5} weight={600} tone={isToday ? 'pen' : 'muted'} lh={13} style={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {weekdayShort(d).slice(0, 2)}
              </Txt>
              <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: isToday ? c.pen : 'transparent' }}>
                <Txt num size={15} weight={isToday ? 700 : 500} color={isToday ? '#fff' : c.ink}>
                  {dayNum(d)}
                </Txt>
              </View>
              <View style={{ height: 14, justifyContent: 'center' }}>{t ? <ArrowRightLeft size={12} color={c.amber} /> : null}</View>
            </Press>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', height: H }}>
        {/* gutter */}
        <View style={{ width: GUTTER, position: 'relative' }}>
          {[0, 6, 12, 18, 24].map((h) => (
            <Txt key={h} num size={10} tone="muted" lh={12} style={{ position: 'absolute', top: h * hourH - 6, right: 6 }}>
              {String(h % 24).padStart(2, '0')}
            </Txt>
          ))}
        </View>
        {days.map((d, i) => {
          const s = dayStart(d);
          const e = dayStart(addDays(d, 1));
          const blocks = plan.blocks.filter((b) => b.end > s && b.start < e && shown(b));
          const isHi = highlight?.includes(d);
          return (
            <Press
              key={d}
              onPress={() => onDay?.(d)}
              sink={0.98}
              style={{
                flex: 1,
                position: 'relative',
                marginHorizontal: 2,
                borderRadius: 8,
                backgroundColor: isHi ? c.amberSoft : c.sunken,
                borderWidth: 1,
                borderColor: isHi ? tint('#F2B866', 0.45) : d === today ? c.lineStrong : c.line,
              }}
            >
              {[6, 12, 18].map((h) => (
                <View key={h} style={{ position: 'absolute', left: 0, right: 0, top: h * hourH, height: 1, backgroundColor: c.line, opacity: 0.7 }} />
              ))}
              {blocks.map((b) => {
                const top = (Math.max(b.start, s) - s) / HOUR;
                const bot = (Math.min(b.end, e) - s) / HOUR;
                const contTop = b.start < s;
                const contBot = b.end > e;
                const col =
                  b.kind === 'work'
                    ? shiftColor(b, presets, shifts)
                    : b.kind === 'sleep'
                      ? c.sleep
                      : b.kind === 'nap'
                        ? c.nap
                        : b.kind === 'anchor'
                          ? (b.color ?? c.good)
                          : b.kind === 'commute'
                            ? c.lineStrong
                            : c.freeGood;
                const free = b.kind === 'free';
                const anchor = b.kind === 'anchor';
                return (
                  <View
                    key={b.id + i}
                    style={{
                      position: 'absolute',
                      top: top * hourH + (contTop ? 0 : 1),
                      height: Math.max(2, (bot - top) * hourH - (contTop ? 0 : 1) - (contBot ? 0 : 1)),
                      left: anchor ? '55%' : 3,
                      right: 3,
                      borderTopLeftRadius: contTop ? 0 : 4,
                      borderTopRightRadius: contTop ? 0 : 4,
                      borderBottomLeftRadius: contBot ? 0 : 4,
                      borderBottomRightRadius: contBot ? 0 : 4,
                      backgroundColor: free ? tint('#6CC597', 0.08) : b.kind === 'sleep' ? c.sleepFill : b.kind === 'commute' ? c.hover : tint(col.startsWith('#') ? col : '#888888', b.kind === 'work' ? 0.55 : 0.4),
                      borderLeftWidth: free ? 0 : 2,
                      borderLeftColor: col,
                      borderWidth: free ? 1 : 0,
                      borderStyle: free ? 'dashed' : 'solid',
                      borderColor: free ? tint('#6CC597', 0.4) : undefined,
                      zIndex: anchor ? 2 : 1,
                    }}
                  />
                );
              })}
              {now >= s && now < e ? <View style={{ position: 'absolute', left: -2, right: -2, top: ((now - s) / HOUR) * hourH, height: 2, backgroundColor: c.pen, zIndex: 3 }} /> : null}
            </Press>
          );
        })}
      </View>
    </View>
  );
}

export function Legend() {
  const { c } = useTheme();
  const item = (color: string, label: string, dashed?: boolean) => (
    <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: dashed ? 'transparent' : color, borderWidth: dashed ? 1 : 0, borderStyle: 'dashed', borderColor: color }} />
      <Txt size={12} tone="muted">
        {label}
      </Txt>
    </View>
  );
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 12, marginLeft: GUTTER }}>
      {item('#6FA8DC', 'Day shift')}
      {item('#E5A35B', 'Night shift')}
      {item(c.sleep, 'Sleep')}
      {item(c.nap, 'Nap')}
      {item(c.freeGood, 'Good-energy free time', true)}
    </View>
  );
}
