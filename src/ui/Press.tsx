import { useRef } from 'react';
import type { ReactNode } from 'react';
import { Animated, Platform, Pressable } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { EASE, sec } from '../theme/theme';

const APressable = Animated.createAnimatedComponent(Pressable);

export interface PressProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** How far it sinks: .96 for buttons, .98 for rows and cards. */
  sink?: number;
  haptic?: boolean;
}

/** Everything pointable sinks on press: instant down, eased release. */
export function Press({ style, children, sink = 0.96, haptic, onPressIn, onPressOut, onPress, ...rest }: PressProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const native = Platform.OS !== 'web';
  return (
    <APressable
      {...rest}
      style={[style, { transform: [{ scale }] }]}
      onPress={(e) => {
        if (haptic && native) Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      onPressIn={(e) => {
        Animated.timing(scale, { toValue: sink, duration: sec(0.06), easing: EASE, useNativeDriver: native }).start();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        Animated.timing(scale, { toValue: 1, duration: sec(0.22), easing: EASE, useNativeDriver: native }).start();
        onPressOut?.(e);
      }}
    >
      {children}
    </APressable>
  );
}
