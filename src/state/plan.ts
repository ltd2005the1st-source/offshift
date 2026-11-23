import { useEffect, useMemo, useState } from 'react';
import { buildPlan } from '../engine/plan';
import { addDays, toISODate } from '../engine/time';
import type { Plan } from '../engine/types';
import { useStore } from './store';

/** The current time, ticking every 30 s. The preview frame can override it. */
export function useNow(): number {
  const override = useStore((s) => s.nowOverride);
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setT(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return override ?? t;
}

export function useToday() {
  return toISODate(useNow());
}

/** The plan for a window of days. Recomputed whenever inputs change. */
export function usePlan(from: string, days: number): Plan {
  const shifts = useStore((s) => s.shifts);
  const profile = useStore((s) => s.profile);
  const anchors = useStore((s) => s.anchors);
  return useMemo(() => buildPlan({ shifts, profile, anchors, from, days }), [shifts, profile, anchors, from, days]);
}

/** A plan that always covers yesterday through next week, for Today and widgets. */
export function useRollingPlan(): Plan {
  const today = useToday();
  return usePlan(addDays(today, -1), 10);
}
