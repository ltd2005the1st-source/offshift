import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaFrameContext, SafeAreaInsetsContext, SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import type { Metrics } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { BricolageGrotesque_400Regular } from '@expo-google-fonts/bricolage-grotesque/400Regular';
import { BricolageGrotesque_500Medium } from '@expo-google-fonts/bricolage-grotesque/500Medium';
import { BricolageGrotesque_600SemiBold } from '@expo-google-fonts/bricolage-grotesque/600SemiBold';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { ThemeProvider, useTheme } from '../theme/theme';
import { ToastProvider } from '../ui/Sheet';
import { useStore } from '../state/store';
import { installPreviewBridge, markPreviewReady, previewMetrics } from '../state/preview';

export default function RootLayout() {
  const [loaded] = useFonts(
    Platform.OS === 'web'
      ? {}
      : { BricolageGrotesque_400Regular, BricolageGrotesque_500Medium, BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold },
  );
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());

  useEffect(() => {
    const off = useStore.persist.onFinishHydration(() => setHydrated(true));
    if (useStore.persist.hasHydrated()) setHydrated(true);
    return off;
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    // Bricolage Grotesque, variable, with the optical-size axis (Daybook's setup).
    const id = 'offshift-font';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&display=swap';
      document.head.appendChild(link);
      const style = document.createElement('style');
      style.textContent =
        'html,body{font-optical-sizing:auto;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;overscroll-behavior:none}*{-webkit-tap-highlight-color:transparent}::-webkit-scrollbar{width:0;height:0}*{scrollbar-width:none}';
      document.head.appendChild(style);
    }
    return installPreviewBridge();
  }, []);

  const preview = previewMetrics();
  const metrics: Metrics | null = preview ?? initialWindowMetrics;
  const body = (
    <ThemeProvider>
      <Shell ready={(loaded || Platform.OS === 'web') && hydrated} />
    </ThemeProvider>
  );

  return (
    <SafeAreaProvider initialMetrics={metrics}>
      {preview ? (
        // In the iPhone frame the browser reports no safe areas, so pin the phone's.
        <SafeAreaFrameContext.Provider value={preview.frame}>
          <SafeAreaInsetsContext.Provider value={preview.insets}>{body}</SafeAreaInsetsContext.Provider>
        </SafeAreaFrameContext.Provider>
      ) : (
        body
      )}
    </SafeAreaProvider>
  );
}

function Shell({ ready }: { ready: boolean }) {
  const { c, name } = useTheme();
  useEffect(() => {
    if (Platform.OS === 'web') document.body.style.backgroundColor = c.bg;
  }, [c.bg]);
  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(markPreviewReady, 300);
    return () => clearTimeout(id);
  }, [ready]);
  if (!ready) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  return (
    <ToastProvider>
      <StatusBar style={name === 'night' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="called-in" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </ToastProvider>
  );
}
