import { useEffect, useRef } from 'react';
import { Animated, Platform, View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { EASE, fontFor, sec, useTheme } from '../theme/theme';
import { TEXT } from '../theme/fonts';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** A 24-hour clock face: a night shift wraps straight across midnight. */
export function ClockHero({ size = 260 }: { size?: number }) {
  const { c } = useTheme();
  const r = size / 2 - 26;
  const C = 2 * Math.PI * r;
  const cx = size / 2;
  const arcs = [
    { from: 19, to: 31, color: '#E5A35B', w: 18, delay: 0.1 }, // night shift 19:00–07:00
    { from: 32, to: 39.5, color: c.sleep, w: 18, delay: 0.5 }, // day sleep 08:00–15:30
    { from: 18.5, to: 19, color: c.lineStrong, w: 18, delay: 0.05 }, // commute
    { from: 31, to: 31.5, color: c.lineStrong, w: 18, delay: 0.45 },
  ];
  const vals = useRef(arcs.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(
      sec(0.12),
      vals.map((v, i) => Animated.timing(v, { toValue: 1, duration: sec(0.9), delay: sec(arcs[i].delay), easing: EASE, useNativeDriver: false })),
    ).start();
  }, [vals]);
  const font = fontFor(600);
  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }} accessibilityLabel="A 24-hour clock: a night shift from 7 p.m. to 7 a.m., then sleep from 8 a.m. to 3:30 p.m.">
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cx} r={r} stroke={c.hover} strokeWidth={18} fill="none" />
        {Array.from({ length: 24 }, (_, h) => {
          const a = (h / 24) * 2 * Math.PI - Math.PI / 2;
          const big = h % 6 === 0;
          const r1 = r - 14;
          const r2 = r - (big ? 22 : 17);
          return <Line key={h} x1={cx + Math.cos(a) * r1} y1={cx + Math.sin(a) * r1} x2={cx + Math.cos(a) * r2} y2={cx + Math.sin(a) * r2} stroke={big ? c.ink2 : c.lineStrong} strokeWidth={big ? 1.5 : 1} />;
        })}
        {[0, 6, 12, 18].map((h) => {
          const a = (h / 24) * 2 * Math.PI - Math.PI / 2;
          const rr = r - 36;
          return (
            <SvgText
              key={h}
              x={cx + Math.cos(a) * rr}
              y={cx + Math.sin(a) * rr + 4}
              fontSize={11}
              fontFamily={Platform.OS === 'web' ? TEXT.family : font.fontFamily}
              fontWeight="600"
              fill={h === 0 ? c.amber : c.muted}
              textAnchor="middle"
            >
              {String(h).padStart(2, '0')}
            </SvgText>
          );
        })}
        <G rotation={-90} origin={`${cx}, ${cx}`}>
          {arcs.map((a, i) => {
            const len = ((a.to - a.from) / 24) * C;
            return (
              <AnimatedCircle
                key={i}
                cx={cx}
                cy={cx}
                r={r}
                stroke={a.color}
                strokeWidth={a.w}
                strokeLinecap="butt"
                fill="none"
                strokeDasharray={`${len} ${C}`}
                strokeDashoffset={vals[i].interpolate({ inputRange: [0, 1], outputRange: [len, 0] })}
                rotation={(a.from / 24) * 360}
                origin={`${cx}, ${cx}`}
              />
            );
          })}
        </G>
      </Svg>
      <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' } as never} pointerEvents="none">
        <Animated.Text style={[fontFor(500), { fontSize: 12, color: c.muted, letterSpacing: 0.8, textTransform: 'uppercase', opacity: vals[1] }]}>Then sleep</Animated.Text>
        <Animated.Text style={[fontFor(600, 'display'), { fontSize: 30, color: c.ink, fontVariant: ['tabular-nums'], opacity: vals[1], letterSpacing: -0.6 }]}>08:00</Animated.Text>
        <Animated.Text style={[fontFor(400), { fontSize: 12.5, color: c.ink2, opacity: vals[1] }]}>to 15:30</Animated.Text>
      </View>
    </View>
  );
}
