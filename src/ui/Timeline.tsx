import { memo, useMemo } from 'react';
import { View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { HOUR, MIN, clockOf, dayStart, toISODate, addDays } from '../engine/time';
import type { Plan, PlanBlock, PlanMarker } from '../engine/types';
import { useStore } from '../state/store';
import { useTheme } from '../theme/theme';
import { lookFor, markerColor, markerIcon, shiftColor } from './blockStyle';
import { shortDate } from './format';
import { Press } from './Press';
import { Txt } from './Text';

const GUTTER = 50;
const MARKS = 34;

interface Props {
  plan: Plan;
  start: number;
  end: number;
  now: number;
  hourH?: number;
  onBlock?: (b: PlanBlock) => void;
  onMarker?: (m: PlanMarker) => void;
}

/**
 * The 24-hour timeline. It runs straight through midnight, so a night shift
 * reads as one unbroken block, with the date change marked inline.
 */
export const Timeline = memo(function Timeline({ plan, start, end, now, hourH = 48, onBlock, onMarker }: Props) {
  const { c } = useTheme();
  const presets = useStore((s) => s.presets);
  const shifts = useStore((s) => s.shifts);
  const profile = useStore((s) => s.profile);
  const height = ((end - start) / HOUR) * hourH;
  const y = (ms: number) => ((ms - start) / HOUR) * hourH;

  const hours = useMemo(() => {
    const out: number[] = [];
    const first = Math.ceil(start / HOUR) * HOUR;
    for (let t = first; t <= end; t += HOUR) out.push(t);
    return out;
  }, [start, end]);

  const midnights = useMemo(() => {
    const out: number[] = [];
    for (let d = toISODate(start); dayStart(d) <= end; d = addDays(d, 1)) {
      const m = dayStart(d);
      if (m > start && m < end) out.push(m);
    }
    return out;
  }, [start, end]);

  // Dark hours outside (sunset → sunrise), as a quiet wash.
  const nights = useMemo(() => {
    const out: [number, number][] = [];
    for (let d = toISODate(start - 24 * HOUR); dayStart(d) <= end; d = addDays(d, 1)) {
      const [sh, sm] = profile.sunset.split(':').map(Number);
      const [rh, rm] = profile.sunrise.split(':').map(Number);
      const s = dayStart(d) + (sh * 60 + sm) * MIN;
      const e = dayStart(addDays(d, 1)) + (rh * 60 + rm) * MIN;
      if (e > start && s < end) out.push([Math.max(s, start), Math.min(e, end)]);
    }
    return out;
  }, [start, end, profile.sunrise, profile.sunset]);

  const blocks = plan.blocks.filter((b) => b.end > start && b.start < end);
  const solid = blocks.filter((b) => b.kind !== 'anchor');
  const anchors = blocks.filter((b) => b.kind === 'anchor');
  const markers = plan.markers.filter((m) => m.at >= start && m.at <= end);

  // Nudge markers that would sit on top of each other.
  const placedMarkers: { m: PlanMarker; top: number }[] = [];
  for (const m of markers) {
    let top = y(m.at) - 11;
    const prev = placedMarkers[placedMarkers.length - 1];
    if (prev && top < prev.top + 25) top = prev.top + 25;
    placedMarkers.push({ m, top });
  }

  const isNightHour = (t: number) => nights.some(([s, e]) => t >= s && t < e);

  return (
    <View style={{ height, position: 'relative' }} accessibilityLabel="Timeline">
      {/* hour rules and labels */}
      {hours.map((t) => (
        <View key={t} style={{ position: 'absolute', left: 0, right: 0, top: y(t) }} pointerEvents="none">
          <View style={{ position: 'absolute', left: GUTTER, right: MARKS, top: 0, height: 1, backgroundColor: c.line, opacity: 0.45 }} />
          <Txt num size={10.5} color={isNightHour(t) ? c.amber : c.muted} style={{ position: 'absolute', left: 0, width: GUTTER - 10, textAlign: 'right', top: -7, opacity: isNightHour(t) ? 0.8 : 1 }} lh={14}>
            {clockOf(t)}
          </Txt>
        </View>
      ))}

      {/* date change */}
      {midnights.map((m) => (
        <View key={`m${m}`} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: y(m) - 1, zIndex: 0 }}>
          <View style={{ height: 1.5, backgroundColor: c.lineStrong, marginLeft: GUTTER, marginRight: MARKS }} />
          <View style={{ position: 'absolute', right: MARKS + 6, top: -10, backgroundColor: c.bg, paddingHorizontal: 6, borderRadius: 4 }}>
            <Txt size={10.5} weight={600} tone="muted" num lh={18} style={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>
              {shortDate(toISODate(m))}
            </Txt>
          </View>
        </View>
      ))}

      {/* blocks */}
      {solid.map((b) => (
        <BlockView key={b.id} b={b} top={Math.max(0, y(b.start))} bottom={Math.min(height, y(b.end))} onPress={onBlock} workColor={b.kind === 'work' ? shiftColor(b, presets, shifts) : undefined} />
      ))}
      {anchors.map((b) => {
        const clash = solid.some((o) => o.kind !== 'free' && o.start < b.end && b.start < o.end);
        return <BlockView key={b.id} b={b} top={Math.max(0, y(b.start))} bottom={Math.min(height, y(b.end))} onPress={onBlock} half={clash} />;
      })}

      {/* markers */}
      {placedMarkers.map(({ m, top }) => {
        const Icon = markerIcon(m);
        const col = markerColor(m, c);
        return (
          <Press
            key={m.id}
            onPress={() => onMarker?.(m)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`${clockOf(m.at)} ${m.title}`}
            style={{
              position: 'absolute',
              right: 4,
              top,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: m.priority === 'high' ? c.pen : c.line,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
            }}
          >
            <Icon size={13} color={col} strokeWidth={2} />
          </Press>
        );
      })}

      {/* now */}
      {now >= start && now <= end ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: y(now) - 1, zIndex: 6 }}>
          <View style={{ position: 'absolute', left: GUTTER - 4, top: -3.5, width: 8, height: 8, borderRadius: 4, backgroundColor: c.pen }} />
          <View style={{ marginLeft: GUTTER, marginRight: MARKS - 4, height: 1.5, backgroundColor: c.pen }} />
          <View style={{ position: 'absolute', left: 0, width: GUTTER - 10, top: -8, alignItems: 'flex-end' }}>
            <View style={{ backgroundColor: c.bg, paddingLeft: 2 }}>
              <Txt num size={10.5} weight={700} tone="pen" lh={15}>
                {clockOf(now)}
              </Txt>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
});

function BlockView({ b, top, bottom, onPress, workColor, half }: { b: PlanBlock; top: number; bottom: number; onPress?: (b: PlanBlock) => void; workColor?: string; half?: boolean }) {
  const { c } = useTheme();
  const look = lookFor(b, c, workColor);
  const h = Math.max(bottom - top - 2, 18);
  const Icon = look.icon;
  const compact = h < 38;
  const roomy = h >= 64;
  const thin = b.kind === 'commute' || b.kind === 'ready';
  return (
    <Press
      onPress={() => onPress?.(b)}
      sink={0.985}
      accessibilityRole="button"
      accessibilityLabel={`${b.title}, ${clockOf(b.start)} to ${clockOf(b.end)}`}
      style={{
        position: 'absolute',
        top: top + 1,
        height: h,
        left: half ? undefined : GUTTER + 2,
        right: MARKS + (half ? 2 : 2),
        width: half ? '42%' : undefined,
        zIndex: half ? 4 : b.kind === 'free' ? 1 : 2,
        borderRadius: 8,
        // Opaque base, so hour lines never run through the text.
        backgroundColor: c.bg,
        borderWidth: look.dashed ? 1 : 0,
        borderStyle: look.dashed ? 'dashed' : 'solid',
        borderColor: look.edge,
        overflow: 'hidden',
        flexDirection: 'row',
      }}
    >
      {look.fill !== 'transparent' ? <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: look.fill }} /> : null}
      {!look.dashed ? <View style={{ width: thin ? 2 : 3, backgroundColor: look.edge, opacity: thin ? 0.6 : 1 }} /> : null}
      <View style={{ flex: 1, paddingHorizontal: 9, paddingVertical: compact ? 0 : 6, justifyContent: compact ? 'center' : 'flex-start' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon size={thin ? 12 : 14} color={look.edge === c.lineStrong ? look.sub : look.edge} strokeWidth={2} />
          <Txt size={thin ? 12.5 : 14} weight={thin ? 400 : 500} color={look.ink} numberOfLines={1} style={{ flexShrink: 1 }}>
            {b.title}
          </Txt>
          {b.atRisk || b.confidence === 'best-effort' ? <AlertTriangle size={12} color={c.amber} /> : null}
          {compact ? (
            <Txt num size={11.5} color={look.sub} style={{ marginLeft: 'auto' }}>
              {clockOf(b.start)}
            </Txt>
          ) : null}
        </View>
        {!compact ? (
          <Txt num size={12} color={look.sub} numberOfLines={1} style={{ marginTop: 1 }}>
            {clockOf(b.start)} to {clockOf(b.end)}
            {b.kind === 'work' ? '' : `  ·  ${durShort(b.end - b.start)}`}
          </Txt>
        ) : null}
        {roomy && b.kind !== 'free' && b.kind !== 'work' ? (
          <Txt size={12.5} color={look.sub} numberOfLines={2} style={{ marginTop: 3 }}>
            {b.action}
          </Txt>
        ) : null}
        {roomy && b.kind === 'free' ? (
          <Txt size={12.5} color={look.sub} numberOfLines={2} style={{ marginTop: 3 }}>
            {b.action}
          </Txt>
        ) : null}
      </View>
    </Press>
  );
}

function durShort(ms: number) {
  const m = Math.round(ms / MIN);
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? (r ? `${h}h ${r}m` : `${h}h`) : `${r}m`;
}
