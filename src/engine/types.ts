import type { Clock, ISODate } from './time';

export type ShiftType = 'day' | 'evening' | 'night';
export type Chronotype = 'morning' | 'neutral' | 'evening';
export type DaysOffStyle = 'flip' | 'owl';
export type CommuteMode = 'drive' | 'transit' | 'walk' | 'bike';
export type Role = 'rn' | 'lpn' | 'cna' | 'resident' | 'paramedic' | 'other';

export interface ShiftPreset {
  id: string;
  label: string; // "Day 12"
  code: string; // "D" — shown on the month grid
  start: Clock;
  end: Clock;
  type: ShiftType;
  color: string;
}

export interface Shift {
  id: string;
  date: ISODate; // the date the shift starts
  start: Clock;
  end: Clock; // if end <= start the shift ends the next day
  type: ShiftType;
  presetId?: string;
  onCall?: boolean;
  overtime?: boolean;
  source?: 'manual' | 'import' | 'pattern' | 'called-in';
}

export interface Profile {
  name: string;
  role: Role;
  sleepNeedH: number;
  chronotype: Chronotype;
  commuteMin: number;
  commuteMode: CommuteMode;
  napMin: number;
  daysOffStyle: DaysOffStyle;
  caffeineCutoffH: number;
  windDownMin: number;
  sunrise: Clock;
  sunset: Clock;
}

export interface Anchor {
  id: string;
  title: string;
  days: number[]; // 0 = Sunday
  start: Clock;
  end: Clock;
  priority: 'must' | 'prefer';
  color: string;
}

export type BlockKind = 'work' | 'commute' | 'sleep' | 'nap' | 'winddown' | 'ready' | 'free' | 'anchor';

export interface PlanBlock {
  id: string;
  kind: BlockKind;
  start: number;
  end: number;
  title: string;
  /** One plain sentence: what to do. */
  action: string;
  /** Why, in plain words, naming the general principle. */
  why: string;
  rule: string;
  confidence: 'planned' | 'best-effort';
  movable: boolean;
  /** work: shift colour; anchor: anchor colour */
  color?: string;
  shiftId?: string;
  energy?: 'good' | 'low';
  /** sleep sub-type */
  variant?: 'main' | 'recovery' | 'between-nights' | 'late' | 'owl' | 'anchor-nap' | 'power-nap' | 'quick-return';
  atRisk?: boolean;
}

export type MarkerKind = 'caffeine-cutoff' | 'seek-light' | 'avoid-light' | 'meal' | 'drive-check';

export interface PlanMarker {
  id: string;
  kind: MarkerKind;
  at: number;
  title: string;
  why: string;
  priority?: 'normal' | 'high';
}

export type TransitionKind = 'into-nights' | 'off-nights' | 'single-night' | 'quick-return';

export interface FlipStep {
  at: number;
  text: string;
}

export interface Transition {
  date: ISODate;
  kind: TransitionKind;
  title: string;
  summary: string;
  steps: FlipStep[];
}

export interface Plan {
  from: ISODate;
  days: number;
  blocks: PlanBlock[];
  markers: PlanMarker[];
  transitions: Transition[];
  /** Flexible anchors that didn't fit (e.g. clash with a shift). */
  skipped: PlanBlock[];
}

export interface PlanInput {
  shifts: Shift[];
  profile: Profile;
  anchors: Anchor[];
  from: ISODate;
  days: number;
}
