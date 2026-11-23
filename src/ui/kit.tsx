import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Animated, Platform, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { EASE, sec, useTheme } from '../theme/theme';
import { inkOn, lift, radius } from '../theme/tokens';
import { Press } from './Press';
import { Label, Txt } from './Text';

const native = Platform.OS !== 'web';

// ── Buttons ────────────────────────────────────────────────────────────────
type BtnKind = 'primary' | 'line' | 'ghost' | 'quiet';

export function Button({
  label,
  onPress,
  kind = 'primary',
  icon: Icon,
  big,
  full,
  danger,
  disabled,
  style,
  accessibilityLabel,
}: {
  label: string;
  onPress?: () => void;
  kind?: BtnKind;
  icon?: LucideIcon;
  big?: boolean;
  full?: boolean;
  danger?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const { c, name } = useTheme();
  // coss variants: default (primary), outline (line), ghost, secondary (quiet), destructive
  const solid = kind === 'primary';
  const bg = solid ? (danger ? c.pen : c.accent) : kind === 'line' ? c.raised : kind === 'quiet' ? c.hover : 'transparent';
  const fg = solid ? (danger ? '#FFFFFF' : c.onInk) : danger ? c.pen : c.ink;
  const box: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: big ? 48 : 40,
    paddingHorizontal: big ? 18 : 14,
    borderRadius: big ? radius.big : radius.button,
    backgroundColor: bg,
    borderWidth: 1,
    borderColor: solid ? bg : kind === 'line' ? c.lineStrong : 'transparent',
    alignSelf: full ? 'stretch' : 'flex-start',
    opacity: disabled ? 0.64 : 1,
    ...(solid || kind === 'line' ? lift(name) : {}),
  };
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={onPress}
      haptic
      style={[box, style]}
    >
      {Icon ? <Icon size={big ? 18 : 16} color={fg} strokeWidth={2} style={{ opacity: 0.8 }} /> : null}
      <Txt size={big ? 16 : 14.5} weight={500} color={fg}>
        {label}
      </Txt>
    </Press>
  );
}

export function IconButton({ icon: Icon, onPress, label, filled }: { icon: LucideIcon; onPress?: () => void; label: string; filled?: boolean }) {
  const { c } = useTheme();
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={{ width: 38, height: 38, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center', backgroundColor: filled ? c.hover : 'transparent', borderWidth: 1, borderColor: filled ? 'transparent' : c.lineStrong }}
    >
      <Icon size={18} color={c.ink} strokeWidth={1.9} />
    </Press>
  );
}

/** A quiet "Action →" link. */
export function LinkAction({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Press onPress={onPress} hitSlop={10} sink={0.98} accessibilityRole="link">
      <Txt size={13.5} weight={500} tone="ink" style={{ textDecorationLine: 'underline', textDecorationColor: '#8888' } as never}>
        {label}
      </Txt>
    </Press>
  );
}

// ── Surfaces ───────────────────────────────────────────────────────────────
export function Card({ children, style, pad = 16, onPress, accessibilityLabel }: { children: ReactNode; style?: StyleProp<ViewStyle>; pad?: number; onPress?: () => void; accessibilityLabel?: string }) {
  const { c, name } = useTheme();
  // coss Card: rounded-2xl, hairline border, card fill, faint lift.
  const box: ViewStyle = {
    backgroundColor: c.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: c.line,
    padding: pad,
    ...lift(name),
  };
  if (onPress)
    return (
      <Press onPress={onPress} sink={0.98} style={[box, style]} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
        {children}
      </Press>
    );
  return <View style={[box, style]}>{children}</View>;
}

/**
 * coss CardFrame: a soft muted frame with a header (title, optional count or
 * description, optional action) around a card panel that holds the content.
 * `bare` drops the inner panel for content that brings its own cards.
 */
export function Section({
  title,
  qualifier,
  count,
  action,
  children,
  style,
  bare,
  flush,
}: {
  title: string;
  qualifier?: string;
  count?: number | string;
  action?: ReactNode;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  bare?: boolean;
  /** No side padding inside the panel (for edge-to-edge content). */
  flush?: boolean;
}) {
  const { c, name } = useTheme();
  return (
    <View style={[{ marginBottom: 20, backgroundColor: c.frame, borderRadius: radius.card, padding: 4 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 9, paddingBottom: 10 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Txt size={14} weight={600}>
              {title}
            </Txt>
            {count !== undefined ? <Count value={count} /> : null}
          </View>
          {qualifier ? (
            <Txt size={13} tone="muted" style={{ marginTop: 1 }}>
              {qualifier}
            </Txt>
          ) : null}
        </View>
        {action}
      </View>
      {bare ? (
        <View style={{ gap: 4 }}>{children}</View>
      ) : (
        <View
          style={{
            backgroundColor: c.bg,
            borderRadius: radius.panel,
            borderWidth: 1,
            borderColor: c.line,
            paddingHorizontal: flush ? 0 : 14,
            overflow: 'hidden',
            ...lift(name),
          }}
        >
          {/* rows draw a bottom rule; the last one is clipped by the panel edge */}
          <View style={{ marginBottom: -1 }}>{children}</View>
        </View>
      )}
    </View>
  );
}

/** coss Badge, secondary, for counts beside a title. */
export function Count({ value }: { value: number | string }) {
  const { c } = useTheme();
  return (
    <View style={{ minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: radius.badge, backgroundColor: c.hover, alignItems: 'center', justifyContent: 'center' }}>
      <Txt num size={12} weight={500} tone="ink2" lh={16}>
        {String(value)}
      </Txt>
    </View>
  );
}

export function PageHeader({ title, right, sub }: { title: string; right?: ReactNode; sub?: string }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt size={30} weight={600} title>
            {title}
          </Txt>
        </View>
        {right}
      </View>
      {sub ? (
        <Txt size={15} tone="muted" style={{ marginTop: 6 }}>
          {sub}
        </Txt>
      ) : null}
    </View>
  );
}

// ── Controls ───────────────────────────────────────────────────────────────
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  full,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  full?: boolean;
}) {
  const { c, name } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.hover, borderRadius: radius.button, padding: 2, gap: 2, alignSelf: full ? 'stretch' : 'flex-start' }} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Press
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            haptic
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={{
              flex: full ? 1 : undefined,
              minHeight: 34,
              paddingHorizontal: 12,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? (name === 'night' ? c.lineStrong : c.bg) : 'transparent',
              ...(on ? { shadowColor: '#000', shadowOpacity: name === 'night' ? 0 : 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } } : {}),
            }}
          >
            <Txt size={14} weight={500} tone={on ? 'ink' : 'muted'}>
              {o.label}
            </Txt>
          </Press>
        );
      })}
    </View>
  );
}

export function Chip({ label, on, onPress, color, icon: Icon }: { label: string; on?: boolean; onPress?: () => void; color?: string; icon?: LucideIcon }) {
  const { c } = useTheme();
  return (
    <Press
      onPress={onPress}
      haptic
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: 34,
        paddingHorizontal: 12,
        borderRadius: radius.button,
        borderWidth: 1,
        borderColor: on ? c.accent : c.lineStrong,
        backgroundColor: on ? c.accent : c.raised,
      }}
    >
      {Icon ? <Icon size={15} color={on ? c.onInk : c.ink} strokeWidth={1.9} style={{ opacity: 0.8 }} /> : null}
      <Txt size={14} color={on ? c.onInk : c.ink} weight={500}>
        {label}
      </Txt>
    </Press>
  );
}

export function Dot({ color, size = 8 }: { color: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  const { c } = useTheme();
  const x = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(x, { toValue: on ? 1 : 0, duration: sec(0.25), easing: EASE, useNativeDriver: false }).start();
  }, [on, x]);
  const bg = x.interpolate({ inputRange: [0, 1], outputRange: [c.lineStrong, c.accent] });
  const tx = x.interpolate({ inputRange: [0, 1], outputRange: [0, 16] });
  return (
    <Press onPress={() => onChange(!on)} haptic accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: on }} hitSlop={8}>
      <Animated.View style={{ width: 38, height: 22, borderRadius: 11, backgroundColor: bg, padding: 1 }}>
        <Animated.View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: on ? c.onInk : c.bg,
            transform: [{ translateX: tx }],
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 },
          }}
        />
      </Animated.View>
    </Press>
  );
}

export function Stepper({ value, onChange, step = 1, min = 0, max = 999, format }: { value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; format?: (v: number) => string }) {
  const { c } = useTheme();
  const btn = (label: string, delta: number) => (
    <Press
      onPress={() => onChange(Math.max(min, Math.min(max, Math.round((value + delta) * 100) / 100)))}
      haptic
      accessibilityRole="button"
      accessibilityLabel={delta > 0 ? 'Increase' : 'Decrease'}
      style={{ width: 40, height: 38, alignItems: 'center', justifyContent: 'center' }}
    >
      <Txt size={18} tone="muted">
        {label}
      </Txt>
    </Press>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: c.lineStrong, borderRadius: radius.button, backgroundColor: c.raised }}>
      {btn('−', -step)}
      <Txt num weight={600} size={15} style={{ minWidth: 64, textAlign: 'center' }}>
        {format ? format(value) : String(value)}
      </Txt>
      {btn('+', step)}
    </View>
  );
}

/** A settings row: label + hint on the left, control on the right. */
export function Row({ label, hint, children, onPress, last }: { label: string; hint?: string; children?: ReactNode; onPress?: () => void; last?: boolean }) {
  const { c } = useTheme();
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt size={15} weight={500}>
          {label}
        </Txt>
        {hint ? (
          <Txt size={12.5} tone="muted" style={{ marginTop: 2 }}>
            {hint}
          </Txt>
        ) : null}
      </View>
      {children}
    </View>
  );
  return onPress ? (
    <Press onPress={onPress} sink={0.98} accessibilityRole="button">
      {body}
    </Press>
  ) : (
    body
  );
}

/** Fades and rises in, once. Daybook's `.rise`. */
export function Rise({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: sec(0.4), delay: sec(delay), easing: EASE, useNativeDriver: native }).start();
  }, [v, delay]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }]}>{children}</Animated.View>
  );
}

export function Bar({ value, color, height = 6 }: { value: number; color?: string; height?: number }) {
  const { c } = useTheme();
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(w, { toValue: Math.max(0, Math.min(1, value)), duration: sec(0.6), easing: EASE, useNativeDriver: false }).start();
  }, [value, w]);
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: c.hover, overflow: 'hidden' }}>
      <Animated.View style={{ height, borderRadius: height / 2, backgroundColor: color ?? c.ink, width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <View style={{ paddingVertical: 26, paddingHorizontal: 16 }}>
      <Txt size={14} tone="muted" center>
        {text}
      </Txt>
    </View>
  );
}

export function Pill({ label, tone = 'pen' }: { label: string; tone?: 'pen' | 'amber' | 'accent' | 'good' | 'info' }) {
  const { c } = useTheme();
  const bg = c[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.badge, paddingHorizontal: 6, height: 20, justifyContent: 'center', alignSelf: 'flex-start' }}>
      <Txt size={12} weight={600} color={inkOn(bg)} lh={16}>
        {label}
      </Txt>
    </View>
  );
}
