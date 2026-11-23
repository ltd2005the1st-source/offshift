// Bridge for the browser preview: the iPhone frame page talks to the app
// with postMessage, so the person previewing can simulate 3 a.m., restart
// onboarding or flip the theme without reloading.
import { Platform } from 'react-native';
import type { Metrics } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from './store';
import type { ThemePref } from './store';

export function inFrame(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('frame');
}

/** iPhone 16 Pro safe areas, so the app lays out as it will on the phone. */
export function previewMetrics(): Metrics | null {
  if (!inFrame()) return null;
  return {
    frame: { x: 0, y: 0, width: 402, height: 874 },
    insets: { top: 62, left: 0, right: 0, bottom: 34 },
  };
}

type Msg = { type: 'offshift'; now?: number | null; reset?: boolean; skip?: boolean; theme?: ThemePref; go?: string };

let appReady = false;
const pending: Msg[] = [];

/** Called once the store is loaded and the navigator has mounted. */
export function markPreviewReady() {
  if (appReady || Platform.OS !== 'web' || typeof window === 'undefined') return;
  appReady = true;
  pending.splice(0).forEach(handle);
  window.parent?.postMessage({ type: 'offshift-ready' }, '*');
}

function handle(d: Msg) {
    const s = useStore.getState();
    if ('now' in d) {
      s.setNowOverride(d.now ?? null);
      if (s.onboarded && !d.go) router.navigate('/today');
    }
    if (d.theme) s.setTheme(d.theme);
    if (d.reset) {
      s.resetAll();
      router.replace('/onboarding');
    }
    if (d.skip) {
      if (!s.shifts.length) s.loadSample();
      s.loadSampleAnchors();
      s.setProfile({ name: s.profile.name || 'Maya' });
      s.finishOnboarding();
      router.replace('/today');
    }
    if (d.go) router.navigate(d.go as never);
}

export function installPreviewBridge(): () => void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return () => {};
  const onMsg = (e: MessageEvent) => {
    const d = e.data as Msg;
    if (!d || d.type !== 'offshift') return;
    if (appReady) handle(d);
    else pending.push(d);
  };
  window.addEventListener('message', onMsg);
  return () => window.removeEventListener('message', onMsg);
}
