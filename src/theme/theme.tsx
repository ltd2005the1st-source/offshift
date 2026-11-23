import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Easing, Platform, useColorScheme } from 'react-native';
import { useStore } from '../state/store';
import { day, night } from './tokens';
import { pairById } from './fonts';
import type { FontPair } from './fonts';
import type { Palette, ThemeName } from './tokens';

// ── Motion: Daybook's one curve and one speed dial ──────────────────────────
export const SPEED = 1.5;
export const sec = (s: number) => (s * 1000) / SPEED; // → ms for Animated
export const ms = (m: number) => Math.round(m / SPEED);
export const EASE = Easing.bezier(0.65, 0, 0.35, 1);

// ── Type: a display face for titles, a text face for the rest ─────────────
export type Weight = 400 | 500 | 600 | 700;
const NATIVE_FAMILY: Record<Weight, string> = {
  400: 'BricolageGrotesque_400Regular',
  500: 'BricolageGrotesque_500Medium',
  600: 'BricolageGrotesque_600SemiBold',
  700: 'BricolageGrotesque_700Bold',
};

export const currentPair = (): FontPair => pairById(useStore.getState().fontPair);

export function fontFor(weight: Weight, role: 'text' | 'display' = 'text') {
  if (Platform.OS === 'web') {
    const pair = currentPair();
    if (role === 'display') {
      return { fontFamily: `"${pair.display.family}", ui-serif, Georgia, serif`, fontWeight: String(pair.display.weight) as '400' };
    }
    return { fontFamily: `"${pair.text.family}", ui-sans-serif, system-ui, sans-serif`, fontWeight: String(weight) as '400' };
  }
  // Native keeps the bundled face until a pairing is chosen and installed.
  return { fontFamily: NATIVE_FAMILY[weight] };
}

interface ThemeValue {
  name: ThemeName;
  c: Palette;
  pair: FontPair;
}

const Ctx = createContext<ThemeValue>({ name: 'night', c: night, pair: pairById(undefined) });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pref = useStore((s) => s.theme);
  const system = useColorScheme();
  const name: ThemeName = pref === 'auto' ? (system === 'light' ? 'day' : 'night') : pref;
  const pairId = useStore((s) => s.fontPair);
  const value = useMemo(() => ({ name, c: name === 'night' ? night : day, pair: pairById(pairId) }), [name, pairId]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
