import { View, Platform } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, Clock, Columns3, Sprout, UserRound } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/theme';
import { Press } from '../../ui/Press';
import { Txt } from '../../ui/Text';

const TABS: Record<string, { label: string; icon: LucideIcon }> = {
  today: { label: 'Today', icon: Clock },
  week: { label: 'Week', icon: Columns3 },
  schedule: { label: 'Schedule', icon: CalendarDays },
  life: { label: 'Life', icon: Sprout },
  you: { label: 'You', icon: UserRound },
};

function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const { c, name } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingTop: 8,
        backgroundColor: c.material,
        borderTopWidth: 1,
        borderTopColor: name === 'night' ? c.hairline : c.line,
        flexDirection: 'row',
        ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(24px) saturate(180%)' } as object) : {}),
      }}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, i) => {
        const meta = TABS[route.name];
        if (!meta) return null;
        const focused = state.index === i;
        const Icon = meta.icon;
        return (
          <Press
            key={route.key}
            haptic
            accessibilityRole="tab"
            accessibilityLabel={meta.label}
            accessibilityState={{ selected: focused }}
            onPress={() => {
              if (!focused) navigateToTab(route.key);
            }}
            style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 2 }}
          >
            <View
              style={{
                width: 52,
                height: 30,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? c.accentSoft : 'transparent',
              }}
            >
              <Icon size={20} color={focused ? c.accent : c.muted} strokeWidth={focused ? 2.1 : 1.8} />
            </View>
            <Txt size={10.5} weight={focused ? 600 : 500} color={focused ? c.ink : c.muted} lh={13}>
              {meta.label}
            </Txt>
          </Press>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { c } = useTheme();
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.bg } }}>
      <Tabs.Screen name="today" />
      <Tabs.Screen name="week" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="life" />
      <Tabs.Screen name="you" />
    </Tabs>
  );
}
