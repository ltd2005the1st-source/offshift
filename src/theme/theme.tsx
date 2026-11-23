import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Easing, Platform, useColorScheme } from 'react-native';
import { useStore } from '../state/store';
import { day, night } from './tokens';
import type { Palette, ThemeName } from './tokens';

// ── Motion: Daybook's one curve and one speed dial ──────────────────────────
export const SPEED = 1.5;
export const sec = (s: number) => (s * 1000) / SPEED; // → ms for Animated
export const ms = (m: number) => Math.round(m / SPEED);
export const EASE = Easing.bezier(0.65, 0, 0.35, 1);

// ── Type: Bricolage Grotesque for everything ───────────────────────────────
export type Weight = 400 | 500 | 600 | 700;
const NATIVE_FAMILY: Record<Weight, string> = {
  400: 'BricolageGrotesque_400Regular',
  500: 'BricolageGrotesque_500Medium',
  600: 'BricolageGrotesque_600SemiBold',
  700: 'BricolageGrotesque_700Bold',
};

export function fontFor(weight: Weight) {
  if (Platform.OS === 'web') {
    return { fontFamily: '"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif', fontWeight: String(weight) as '400' };
  }
  return { fontFamily: NATIVE_FAMILY[weight] };
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
