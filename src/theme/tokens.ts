// Offshift tokens: Daybook's type, radii, curve and tone, on a night palette.
// Dark ("night") is the default because the app is built for 3 a.m. use.

export type ThemeName = 'night' | 'day';

export interface Palette {
  bg: string;
  surface: string;
  raised: string;
  sunken: string;
  hover: string;
  ink: string;
  ink2: string;
  muted: string;
  line: string;
  lineStrong: string;
  hairline: string;
  accent: string;
  accentSoft: string;
  pen: string;
  penSoft: string;
  good: string;
  goodSoft: string;
  amber: string;
  amberSoft: string;
  scrim: string;
  material: string;
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
  bg: '#0D0F15',
  surface: '#151820',
  raised: '#1A1E28',
  sunken: '#11131A',
  hover: 'rgba(255,255,255,0.055)',
  ink: '#ECEAE4',
  ink2: '#B8B6AF',
  muted: '#868890',
  line: '#22252F',
  lineStrong: '#343845',
  hairline: 'rgba(255,255,255,0.08)',
  accent: '#8FA6F2',
  accentSoft: 'rgba(143,166,242,0.14)',
  pen: '#F07A64',
  penSoft: 'rgba(240,122,100,0.13)',
  good: '#6CC597',
  goodSoft: 'rgba(108,197,151,0.12)',
  amber: '#F2B866',
  amberSoft: 'rgba(242,184,102,0.12)',
  scrim: 'rgba(0,0,0,0.55)',
  material: 'rgba(17,19,26,0.82)',
  onInk: '#0D0F15',
  sleep: '#6F7FD8',
  sleepFill: '#232B55',
  sleepInk: '#D6DCFF',
  nap: '#8D9AE6',
  napFill: 'rgba(141,154,230,0.16)',
  windFill: 'rgba(111,127,216,0.09)',
  freeGood: '#6CC597',
  freeLow: '#5D6070',
  commute: 'rgba(255,255,255,0.045)',
  nightWash: 'rgba(111,127,216,0.05)',
};

export const day: Palette = {
  bg: '#FBFBFA',
  surface: '#FFFFFF',
  raised: '#FFFFFF',
  sunken: '#F4F4F2',
  hover: 'rgba(55,53,47,0.06)',
  ink: '#26251F',
  ink2: '#57554D',
  muted: '#8A877E',
  line: '#E9E8E4',
  lineStrong: '#D9D7D1',
  hairline: 'rgba(15,15,10,0.08)',
  accent: '#2F4FB5',
  accentSoft: 'rgba(47,79,181,0.09)',
  pen: '#C8412B',
  penSoft: 'rgba(200,65,43,0.09)',
  good: '#2E7A55',
  goodSoft: 'rgba(46,122,85,0.1)',
  amber: '#B7791F',
  amberSoft: 'rgba(183,121,31,0.1)',
  scrim: 'rgba(20,20,15,0.22)',
  material: 'rgba(251,251,250,0.86)',
  onInk: '#FBFBFA',
  sleep: '#4A5BB8',
  sleepFill: '#E3E7F8',
  sleepInk: '#27326B',
  nap: '#6B79C9',
  napFill: 'rgba(107,121,201,0.12)',
  windFill: 'rgba(74,91,184,0.06)',
  freeGood: '#2E7A55',
  freeLow: '#B5B2A9',
  commute: 'rgba(55,53,47,0.05)',
  nightWash: 'rgba(74,91,184,0.04)',
};

export const radius = {
  card: 14,
  strip: 12,
  sheet: 18,
  button: 8,
  big: 12,
  row: 10,
  block: 8,
  tick: 5,
} as const;

/** Mix a hex colour with alpha, for tinted block fills. */
export function tint(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
