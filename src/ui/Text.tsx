import { Text } from 'react-native';
import type { TextProps, TextStyle } from 'react-native';
import { fontFor, useTheme } from '../theme/theme';
import type { Weight } from '../theme/theme';
import type { Palette } from '../theme/tokens';
import { DISPLAY } from '../theme/fonts';

type Tone = 'ink' | 'ink2' | 'muted' | 'accent' | 'pen' | 'good' | 'amber' | 'onInk' | 'sleepInk';

export interface TxtProps extends TextProps {
  size?: number;
  weight?: Weight;
  tone?: Tone;
  color?: string;
  /** Tabular figures for every number, time and date. */
  num?: boolean;
  /** Display tracking (-0.02em), for titles. */
  display?: boolean;
  /** Title tracking (-0.028em) and tight leading. */
  title?: boolean;
  lh?: number;
  center?: boolean;
}

export function Txt({ size = 15, weight = 400, tone = 'ink', color, num, display, title, lh, center, style, ...rest }: TxtProps) {
  const { c } = useTheme();
  // Titles and big words take the display face; numbers stay in the text face.
  const isDisplay = !!(title || display || (size >= 20 && !num));
  const fontSize = isDisplay ? Math.round(size * DISPLAY.scale * 2) / 2 : size;
  const tracking = isDisplay ? DISPLAY.tracking : num ? 0 : 0.003;
  const s: TextStyle = {
    ...fontFor(weight, isDisplay ? 'display' : 'text'),
    fontSize,
    lineHeight: lh ?? Math.round(fontSize * (title ? 1.08 : isDisplay ? 1.2 : 1.42)),
    letterSpacing: fontSize * tracking,
    color: color ?? c[tone as keyof Palette],
    textAlign: center ? 'center' : undefined,
    fontVariant: num ? ['tabular-nums'] : undefined,
  };
  return <Text allowFontScaling maxFontSizeMultiplier={1.6} style={[s, style]} {...rest} />;
}

/** 11px, 600, .07em, uppercase, muted — Daybook's eyebrow. */
export function Label({ children, tone = 'muted', style, ...rest }: TxtProps) {
  return (
    <Txt size={11} weight={600} tone={tone} lh={14} style={[{ letterSpacing: 11 * 0.07, textTransform: 'uppercase' }, style]} {...rest}>
      {children}
    </Txt>
  );
}
