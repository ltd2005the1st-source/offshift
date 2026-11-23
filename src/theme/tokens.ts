// Offshift tokens, in the coss ui style: neutral greys, hairline borders,
// a near-black (or near-white) primary, and soft framed surfaces.
// Dark ("night") stays the default because the app is built for 3 a.m. use.
// Data colours (shifts, sleep, naps) sit on top of the neutral base.

export type ThemeName = 'night' | 'day';

export interface Palette {
  /** coss --background */
  bg: string;
  /** coss --card */
  surface: string;
  /** coss --popover */
  raised: string;
  /** solid muted fill */
  sunken: string;
  /** coss CardFrame fill (muted at 72%) */
  frame: string;
  /** coss --accent / --muted, for hover and pressed fills */
  hover: string;
  /** coss --foreground */
  ink: string;
  ink2: string;
  /** coss --muted-foreground */
  muted: string;
  /** coss --border */
  line: string;
  /** coss --input */
  lineStrong: string;
  hairline: string;
  /** coss --primary */
  accent: string;
  accentSoft: string;
  /** coss --destructive */
  pen: string;
  penSoft: string;
  /** coss --success */
  good: string;
  goodSoft: string;
  /** coss --warning */
  amber: string;
  amberSoft: string;
  /** coss --info */
  info: string;
  scrim: string;
  material: string;
  /** coss --primary-foreground */
  onInk: string;
  // plan blocks
  sleep: string;
  sleepFill: string;
  sleepInk: string;
  nap: string;
  napFill: string;
  windFill: string;
  freeGood: string;
  freeLow: string;
  commute: string;
  nightWash: string;
}

export const night: Palette = {
  bg: '#141414',
  surface: '#191919',
  raised: '#1D1D1D',
  sunken: '#1A1A1A',
  frame: '#1B1B1B',
  hover: 'rgba(255,255,255,0.05)',
  ink: '#F5F5F5',
  ink2: '#D4D4D4',
  muted: '#8F8F8F',
  line: '#252525',
  lineStrong: '#2F2F2F',
  hairline: 'rgba(255,255,255,0.07)',
  accent: '#F5F5F5',
  accentSoft: 'rgba(255,255,255,0.07)',
  pen: '#EF4444',
  penSoft: 'rgba(239,68,68,0.16)',
  good: '#34D399',
  goodSoft: 'rgba(16,185,129,0.16)',
  amber: '#FBBF24',
  amberSoft: 'rgba(245,158,11,0.16)',
  info: '#60A5FA',
  scrim: 'rgba(0,0,0,0.6)',
  material: 'rgba(20,20,20,0.86)',
  onInk: '#262626',
  sleep: '#818CF8',
  sleepFill: '#262A4A',
  sleepInk: '#DDE1FF',
  nap: '#A5B4FC',
  napFill: 'rgba(129,140,248,0.16)',
  windFill: 'rgba(129,140,248,0.08)',
  freeGood: '#34D399',
  freeLow: '#5C5C5C',
  commute: 'rgba(255,255,255,0.04)',
  nightWash: 'rgba(129,140,248,0.05)',
};

export const day: Palette = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  raised: '#FFFFFF',
  sunken: '#F5F5F5',
  frame: '#F7F7F7',
  hover: 'rgba(0,0,0,0.04)',
  ink: '#262626',
  ink2: '#404040',
  muted: '#686868',
  line: '#EBEBEB',
  lineStrong: '#E3E3E3',
  hairline: 'rgba(0,0,0,0.08)',
  accent: '#262626',
  accentSoft: 'rgba(0,0,0,0.05)',
  pen: '#DC2626',
  penSoft: 'rgba(239,68,68,0.08)',
  good: '#047857',
  goodSoft: 'rgba(16,185,129,0.08)',
  amber: '#B45309',
  amberSoft: 'rgba(245,158,11,0.08)',
  info: '#1D4ED8',
  scrim: 'rgba(0,0,0,0.32)',
  material: 'rgba(255,255,255,0.86)',
  onInk: '#FAFAFA',
  sleep: '#4F46E5',
  sleepFill: '#E8E9FB',
  sleepInk: '#2E2A7A',
  nap: '#6366F1',
  napFill: 'rgba(99,102,241,0.1)',
  windFill: 'rgba(79,70,229,0.05)',
  freeGood: '#047857',
  freeLow: '#C4C4C4',
  commute: 'rgba(0,0,0,0.035)',
  nightWash: 'rgba(79,70,229,0.03)',
};

// coss radii: --radius 10px; lg 10, md 8, sm 6, xl 14, 2xl 16.
export const radius = {
  card: 16,
  panel: 12,
  strip: 12,
  sheet: 16,
  button: 10,
  big: 12,
  row: 10,
  block: 8,
  badge: 6,
  tick: 5,
} as const;

/** coss shadow-xs/5: a faint lift on light surfaces only. */
export const lift = (name: ThemeName) =>
  name === 'day' ? { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } } : {};

/** Mix a hex colour with alpha, for tinted block fills. */
/** Text colour for a solid fill: near-black on light colours, white on dark. */
export function inkOn(hex: string): string {
  const h = hex.replace('#', '');
  if (h.length < 6) return '#FFFFFF';
  const lin = (i: number) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * lin(0) + 0.7152 * lin(2) + 0.0722 * lin(4);
  return L > 0.18 ? '#111318' : '#FFFFFF';
}

export function tint(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
