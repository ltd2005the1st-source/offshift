import type { ReactNode, Ref } from 'react';
import { ScrollView } from 'react-native';
import type { ScrollViewInstance, ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';

export const TAB_BAR_SPACE = 96;

/** A tab screen: one long scroll with the app's side gutter. */
export function Screen({ children, tabs = true, contentContainerStyle, ref, ...rest }: { children: ReactNode; tabs?: boolean; ref?: Ref<ScrollViewInstance> } & ScrollViewProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      ref={ref}
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={[{ paddingTop: insets.top + 14, paddingHorizontal: 20, paddingBottom: (tabs ? TAB_BAR_SPACE : 24) + insets.bottom }, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}
