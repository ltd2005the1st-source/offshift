import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Easing, Platform, useColorScheme } from 'react-native';
import { useStore } from '../state/store';
import { day, night } from './tokens';
import { DISPLAY, TEXT } from './fonts';
import type { Palette, ThemeName } from './tokens';

// ── Motion: Daybook's one curve and one speed dial ──────────────────────────
export const SPEED = 1.5;
export const sec = (s: number) => (s * 1000) / SPEED; // → ms for Animated
export const ms = (m: number) => Math.round(m / SPEED);
export const EASE = Easing.bezier(0.65, 0, 0.35, 1);

// ── Type: a display face for titles, a text face for the rest ─────────────
export type Weight = 400 | 500 | 600 | 700;
const NATIVE_TEXT: Record<Weight, string> = {
  400: 'IBMPlexSans_400Regular',
  500: 'IBMPlexSans_500Medium',
  600: 'IBMPlexSans_600SemiBold',
  700: 'IBMPlexSans_700Bold',
};
const NATIVE_DISPLAY = 'SpaceGrotesk_600SemiBold';

export function fontFor(weight: Weight, role: 'text' | 'display' = 'text') {
  if (Platform.OS === 'web') {
    if (role === 'display') {
      return { fontFamily: `"${DISPLAY.family}", ui-sans-serif, system-ui, sans-serif`, fontWeight: String(DISPLAY.weight) as '600' };
    }
    return { fontFamily: `"${TEXT.family}", ui-sans-serif, system-ui, sans-serif`, fontWeight: String(weight) as '400' };
  }
  return { fontFamily: role === 'display' ? NATIVE_DISPLAY : NATIVE_TEXT[weight] };
}

interface ThemeValue {
  name: ThemeName;
  c: Palette;
}

const Ctx = createContext<ThemeValue>({ name: 'night', c: night });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pref = useStore((s) => s.theme);
  const system = useColorScheme();
  const name: ThemeName = pref === 'auto' ? (system === 'light' ? 'day' : 'night') : pref;
  const value = useMemo(() => ({ name, c: name === 'night' ? night : day }), [name]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
