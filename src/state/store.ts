import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_PROFILE, NURSE_PRESETS, SAMPLE_ANCHORS, sampleShifts } from '../data/sample';
import { toISODate } from '../engine/time';
import type { Anchor, Profile, Shift, ShiftPreset } from '../engine/types';

export type ThemePref = 'night' | 'day' | 'auto';
export type Pattern = 'fixed-days' | 'fixed-nights' | 'rotating' | 'on-call' | 'rotation' | 'chaos';

export interface ReminderPrefs {
  leave: boolean;
  caffeine: boolean;
  windDown: boolean;
  nap: boolean;
  driveCheck: boolean;
  duringShift: boolean;
}

interface State {
  onboarded: boolean;
  profile: Profile;
  pattern: Pattern;
  presets: ShiftPreset[];
  shifts: Shift[];
  anchors: Anchor[];
  theme: ThemePref;
  reminders: ReminderPrefs;
  /** Not persisted: lets the preview frame simulate another time of day. */
  nowOverride: number | null;

  setProfile: (p: Partial<Profile>) => void;
  setPattern: (p: Pattern) => void;
  setTheme: (t: ThemePref) => void;
  setReminders: (r: Partial<ReminderPrefs>) => void;
  loadSample: () => void;
  loadSampleAnchors: () => void;
  assignShifts: (dates: string[], presetId: string | null) => void;
  replaceShiftsOn: (date: string, shift: Shift | null) => void;
  upsertAnchor: (a: Anchor) => void;
  removeAnchor: (id: string) => void;
  finishOnboarding: () => void;
  resetAll: () => void;
  setNowOverride: (ms: number | null) => void;
}

const initial = {
  onboarded: false,
  profile: DEFAULT_PROFILE,
  pattern: 'rotating' as Pattern,
  presets: NURSE_PRESETS,
  shifts: [] as Shift[],
  anchors: [] as Anchor[],
  theme: 'night' as ThemePref,
  reminders: { leave: true, caffeine: true, windDown: true, nap: true, driveCheck: true, duringShift: false },
  nowOverride: null,
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial,
      setProfile: (p) => set({ profile: { ...get().profile, ...p } }),
      setPattern: (pattern) => set({ pattern }),
      setTheme: (theme) => set({ theme }),
      setReminders: (r) => set({ reminders: { ...get().reminders, ...r } }),
      loadSample: () => {
        set({ shifts: sampleShifts(toISODate(Date.now())) });
      },
      loadSampleAnchors: () => {
        if (!get().anchors.length) set({ anchors: SAMPLE_ANCHORS });
      },
      assignShifts: (dates, presetId) => {
        const preset = get().presets.find((p) => p.id === presetId);
        const keep = get().shifts.filter((s) => !dates.includes(s.date));
        const add: Shift[] = preset
          ? dates.map((date) => ({
              id: `s-${date}-${preset.id}`,
              date,
              start: preset.start,
              end: preset.end,
              type: preset.type,
              presetId: preset.id,
              source: 'manual',
            }))
          : [];
        set({ shifts: [...keep, ...add].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.start < b.start ? -1 : 1)) });
      },
      replaceShiftsOn: (date, shift) => {
        const keep = get().shifts.filter((s) => s.date !== date);
        set({ shifts: [...keep, ...(shift ? [shift] : [])].sort((a, b) => (a.date < b.date ? -1 : 1)) });
      },
      upsertAnchor: (a) => {
        const rest = get().anchors.filter((x) => x.id !== a.id);
        set({ anchors: [...rest, a] });
      },
      removeAnchor: (id) => set({ anchors: get().anchors.filter((x) => x.id !== id) }),
      finishOnboarding: () => set({ onboarded: true }),
      resetAll: () => set({ ...initial, theme: get().theme }),
      setNowOverride: (nowOverride) => set({ nowOverride }),
    }),
    {
      name: 'offshift.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => {
        const { nowOverride, ...rest } = s;
        return rest;
      },
    },
  ),
);
