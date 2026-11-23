import { Bed, BriefcaseMedical, Car, Coffee, Glasses, Lock, Moon, MoonStar, Leaf, Sun, Sparkles, Utensils, Shirt } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { PlanBlock, PlanMarker, ShiftPreset } from '../engine/types';
import type { Palette } from '../theme/tokens';
import { tint } from '../theme/tokens';

export interface BlockLook {
  fill: string;
  edge: string;
  ink: string;
  sub: string;
  icon: LucideIcon;
  dashed?: boolean;
}

export function shiftColor(b: PlanBlock, presets: ShiftPreset[], shifts: { id: string; presetId?: string; type: string }[]): string {
  const s = shifts.find((x) => x.id === b.shiftId);
  const p = presets.find((x) => x.id === s?.presetId);
  if (p) return p.color;
  if (s?.type === 'night') return '#E5A35B';
  if (s?.type === 'evening') return '#D987A6';
  return '#6FA8DC';
}

export function lookFor(b: PlanBlock, c: Palette, workColor = '#6FA8DC'): BlockLook {
  switch (b.kind) {
    case 'work':
      return { fill: tint(workColor, 0.2), edge: workColor, ink: c.ink, sub: c.ink2, icon: BriefcaseMedical };
    case 'commute':
      return { fill: c.commute, edge: c.lineStrong, ink: c.ink2, sub: c.muted, icon: Car };
    case 'sleep':
      return { fill: c.sleepFill, edge: c.sleep, ink: c.sleepInk, sub: tint(hexOf(c.sleepInk), 0.7), icon: Moon };
    case 'nap':
      return { fill: c.napFill, edge: c.nap, ink: c.ink, sub: c.ink2, icon: Bed, dashed: b.variant === 'power-nap' };
    case 'winddown':
      return { fill: c.windFill, edge: tint(hexOf(c.sleep), 0.5), ink: c.ink2, sub: c.muted, icon: MoonStar };
    case 'ready':
      return { fill: c.hover, edge: c.lineStrong, ink: c.ink2, sub: c.muted, icon: Shirt };
    case 'anchor':
      return { fill: tint(b.color ?? '#7FB08A', 0.16), edge: b.color ?? '#7FB08A', ink: c.ink, sub: c.ink2, icon: Lock };
    case 'free':
    default:
      return {
        fill: 'transparent',
        edge: b.energy === 'good' ? tint(hexOf(c.freeGood), 0.55) : c.lineStrong,
        ink: c.ink2,
        sub: c.muted,
        icon: b.energy === 'good' ? Sparkles : Leaf,
        dashed: true,
      };
  }
}

export function markerIcon(m: PlanMarker): LucideIcon {
  switch (m.kind) {
    case 'caffeine-cutoff':
      return Coffee;
    case 'seek-light':
      return Sun;
    case 'avoid-light':
      return Glasses;
    case 'meal':
      return Utensils;
    case 'drive-check':
    default:
      return Car;
  }
}

export function markerColor(m: PlanMarker, c: Palette): string {
  switch (m.kind) {
    case 'caffeine-cutoff':
      return '#C89A6A';
    case 'seek-light':
      return c.amber;
    case 'avoid-light':
      return c.muted;
    case 'meal':
      return c.good;
    case 'drive-check':
    default:
      return c.pen;
  }
}

function hexOf(s: string): string {
  return s.startsWith('#') ? s : '#888888';
}
