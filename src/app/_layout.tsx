import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaFrameContext, SafeAreaInsetsContext, SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import type { Metrics } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk/600SemiBold';
import { IBMPlexSans_400Regular } from '@expo-google-fonts/ibm-plex-sans/400Regular';
import { IBMPlexSans_500Medium } from '@expo-google-fonts/ibm-plex-sans/500Medium';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans/600SemiBold';
import { IBMPlexSans_700Bold } from '@expo-google-fonts/ibm-plex-sans/700Bold';
import { ThemeProvider, useTheme } from '../theme/theme';
import { GOOGLE_FONTS_URL } from '../theme/fonts';
import { ToastProvider } from '../ui/Sheet';
import { useStore } from '../state/store';
import { installPreviewBridge, markPreviewReady, previewMetrics } from '../state/preview';

export default function RootLayout() {
  const [loaded] = useFonts(
    Platform.OS === 'web'
      ? {}
      : { SpaceGrotesk_600SemiBold, IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold },
  );
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());

  useEffect(() => {
    const off = useStore.persist.onFinishHydration(() => setHydrated(true));
    if (useStore.persist.hasHydrated()) setHydrated(true);
    return off;
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    // Space Grotesk (titles) and IBM Plex Sans (text) from Google Fonts.
    const id = 'offshift-font';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = GOOGLE_FONTS_URL;
      document.head.appendChild(link);
      const style = document.createElement('style');
      style.textContent =
        'html,body{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;overscroll-behavior:none}*{-webkit-tap-highlight-color:transparent}::-webkit-scrollbar{width:0;height:0}*{scrollbar-width:none}';
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
