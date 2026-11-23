import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { EASE, ms, sec, useTheme } from '../theme/theme';
import { radius } from '../theme/tokens';
import { Press } from './Press';
import { Txt } from './Text';

const native = Platform.OS !== 'web';

/** Bottom sheet. Enters with Daybook's sheet motion: rise + fade on the one curve. */
export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; footer?: ReactNode }) {
  const { c, name } = useTheme();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(open);
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.timing(v, { toValue: 1, duration: sec(0.34), easing: EASE, useNativeDriver: native }).start();
    } else if (mounted) {
      Animated.timing(v, { toValue: 0, duration: sec(0.28), easing: EASE, useNativeDriver: native }).start(() => setMounted(false));
    }
  }, [open, mounted, v]);

  if (!mounted) return null;
  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View style={{ position: 'absolute', inset: 0, backgroundColor: c.scrim, opacity: v } as never}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={{
            maxHeight: '88%',
            backgroundColor: c.raised,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            borderWidth: 1,
            borderBottomWidth: 0,
            borderColor: name === 'night' ? c.hairline : c.line,
            opacity: v,
            transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [36, 0] }) }],
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 8 }}>
            <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: c.lineStrong }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 }}>
            <Txt size={20} weight={600} display style={{ flex: 1 }}>
              {title ?? ''}
            </Txt>
            <Press
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.hover, alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={17} color={c.ink2} />
            </Press>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: footer ? 12 : 20 + insets.bottom }} bounces={false}>
            {children}
          </ScrollView>
          {footer ? (
            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 + insets.bottom, borderTopWidth: 1, borderTopColor: c.line }}>{footer}</View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Toasts ────────────────────────────────────────────────────────────────
interface ToastCtx {
  show: (text: string) => void;
}
const ToastContext = createContext<ToastCtx>({ show: () => {} });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState<string | null>(null);
  const v = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (t: string) => {
      setText(t);
      if (timer.current) clearTimeout(timer.current);
      Animated.timing(v, { toValue: 1, duration: sec(0.34), easing: EASE, useNativeDriver: native }).start();
      timer.current = setTimeout(() => {
        Animated.timing(v, { toValue: 0, duration: sec(0.3), easing: EASE, useNativeDriver: native }).start(() => setText(null));
      }, ms(3000 * 1.5));
    },
    [v],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {text ? (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: insets.bottom + 92,
            alignItems: 'center',
            opacity: v,
            transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
          }}
        >
          <View style={{ backgroundColor: c.ink, borderRadius: 22, paddingVertical: 10, paddingHorizontal: 18, maxWidth: 340 }}>
            <Txt size={14} color={c.onInk} center>
              {text}
            </Txt>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}
