import { useState } from 'react';
import { TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { fontFor, useTheme } from '../theme/theme';
import { radius } from '../theme/tokens';
import { Press } from './Press';
import { Label, Txt } from './Text';

/** Daybook's hairline field that firms up on focus. */
export function Field({ label, ...rest }: { label?: string } & TextInputProps) {
  const { c } = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Label style={{ marginBottom: 6 }}>{label}</Label> : null}
      <TextInput
        placeholderTextColor={c.muted}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={[
          fontFor(400),
          {
            fontSize: 16,
            color: c.ink,
            minHeight: 46,
            paddingHorizontal: 12,
            borderRadius: radius.button,
            borderWidth: 1,
            borderColor: focus ? c.ink2 : c.line,
            backgroundColor: focus ? c.surface : 'transparent',
            outlineStyle: 'none',
          } as object,
        ]}
        {...rest}
      />
    </View>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');
export const minsToClock = (m: number) => `${pad(Math.floor((((m % 1440) + 1440) % 1440) / 60))}:${pad((((m % 1440) + 1440) % 1440) % 60)}`;
export const clockToMins = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

/** A time picker tuned for night times: steps wrap around midnight. */
export function TimeStepper({ value, onChange, step = 15, label }: { value: string; onChange: (v: string) => void; step?: number; label?: string }) {
  const { c } = useTheme();
  const m = clockToMins(value);
  const btn = (txt: string, d: number) => (
    <Press onPress={() => onChange(minsToClock(m + d))} haptic accessibilityLabel={`${d > 0 ? 'Later' : 'Earlier'} by ${Math.abs(d)} minutes`} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <Txt size={18} tone="ink2">
        {txt}
      </Txt>
    </Press>
  );
  return (
    <View style={{ flex: 1 }}>
      {label ? <Label style={{ marginBottom: 6 }}>{label}</Label> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: c.line, borderRadius: radius.button }}>
        {btn('−', -step)}
        <Txt num size={18} weight={600}>
          {value}
        </Txt>
        {btn('+', step)}
      </View>
    </View>
  );
}
