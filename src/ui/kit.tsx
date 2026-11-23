import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Animated, Platform, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { EASE, sec, useTheme } from '../theme/theme';
import { inkOn, radius } from '../theme/tokens';
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
  const { c } = useTheme();
  const fg = kind === 'primary' ? c.onInk : danger ? c.pen : kind === 'ghost' || kind === 'quiet' ? c.ink2 : c.ink;
  const box: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: big ? 52 : 40,
    paddingHorizontal: big ? 18 : 13,
    borderRadius: big ? radius.big : radius.button,
    backgroundColor: kind === 'primary' ? c.ink : kind === 'quiet' ? c.hover : 'transparent',
    borderWidth: kind === 'line' ? 1 : 0,
    borderColor: c.lineStrong,
    alignSelf: full ? 'stretch' : 'flex-start',
    opacity: disabled ? 0.4 : 1,
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
      {Icon ? <Icon size={big ? 18 : 16} color={fg} strokeWidth={1.9} /> : null}
      <Txt size={big ? 16 : 14} weight={500} color={fg}>
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
      style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: filled ? c.hover : 'transparent' }}
    >
      <Icon size={19} color={c.ink2} strokeWidth={1.8} />
    </Press>
  );
}

/** A quiet "Action →" link. */
export function LinkAction({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Press onPress={onPress} hitSlop={10} sink={0.98} accessibilityRole="link">
      <Txt size={13} tone="muted">
        {label} →
      </Txt>
    </Press>
  );
}

// ── Surfaces ───────────────────────────────────────────────────────────────
export function Card({ children, style, pad = 16, onPress, accessibilityLabel }: { children: ReactNode; style?: StyleProp<ViewStyle>; pad?: number; onPress?: () => void; accessibilityLabel?: string }) {
  const { c, name } = useTheme();
  const box: ViewStyle = {
    backgroundColor: c.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: name === 'night' ? c.hairline : c.line,
    padding: pad,
    ...(name === 'day'
      ? { shadowColor: '#0f0f0a', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }
      : {}),
  };
  if (onPress)
    return (
      <Press onPress={onPress} sink={0.98} style={[box, style]} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
        {children}
      </Press>
    );
  return <View style={[box, style]}>{children}</View>;
}

/** Small grey title over a hairline, quiet action on the right. */
export function Section({ title, qualifier, action, children, style }: { title: string; qualifier?: string; action?: ReactNode; children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <View style={[{ marginBottom: 28 }, style]}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: c.line,
          paddingBottom: 7,
          marginBottom: 12,
        }}
      >
        <Txt size={13.5} weight={600} tone="ink2">
          {title}
          {qualifier ? (
            <Txt size={13.5} tone="muted">
              {'  ·  '}
              {qualifier}
            </Txt>
          ) : null}
        </Txt>
        {action}
      </View>
      {children}
    </View>
  );
}

export function PageHeader({ title, right, sub }: { title: string; right?: ReactNode; sub?: string }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt size={32} weight={600} title>
            {title}
          </Txt>
        </View>
        {right}
      </View>
      {sub ? (
        <Txt size={15} tone="ink2" style={{ marginTop: 8 }}>
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
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.hover, borderRadius: 10, padding: 3, alignSelf: full ? 'stretch' : 'flex-start' }} accessibilityRole="tablist">
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
              borderRadius: 7,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? c.raised : 'transparent',
              ...(on ? { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } } : {}),
            }}
          >
            <Txt size={13.5} weight={on ? 600 : 400} tone={on ? 'ink' : 'muted'}>
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
        minHeight: 36,
        paddingHorizontal: 13,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: on ? c.ink : c.line,
        backgroundColor: on ? c.ink : 'transparent',
      }}
    >
      {Icon ? <Icon size={15} color={on ? c.onInk : c.ink2} strokeWidth={1.8} /> : null}
      <Txt size={13.5} color={on ? c.onInk : c.ink2} weight={on ? 500 : 400}>
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
  const tx = x.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });
  return (
    <Press onPress={() => onChange(!on)} haptic accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: on }} hitSlop={8}>
      <Animated.View style={{ width: 46, height: 28, borderRadius: 14, backgroundColor: bg, padding: 3 }}>
        <Animated.View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: '#fff',
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
      style={{ width: 44, height: 40, alignItems: 'center', justifyContent: 'center' }}
    >
      <Txt size={18} tone="ink2">
        {label}
      </Txt>
    </Press>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: c.line, borderRadius: radius.button }}>
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
        <Txt size={15}>{label}</Txt>
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
      <Animated.View style={{ height, borderRadius: height / 2, backgroundColor: color ?? c.accent, width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  const { c } = useTheme();
  return (
    <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: c.lineStrong, borderRadius: radius.strip, paddingVertical: 22, paddingHorizontal: 16 }}>
      <Txt size={14} tone="muted" center>
        {text}
      </Txt>
    </View>
  );
}

export function Pill({ label, tone = 'pen' }: { label: string; tone?: 'pen' | 'amber' | 'accent' | 'good' }) {
  const { c } = useTheme();
  const bg = c[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' }}>
      <Txt size={11} weight={700} color={inkOn(bg)} lh={15}>
        {label}
      </Txt>
    </View>
  );
}
