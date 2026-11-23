import { useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { ScrollViewInstance } from 'react-native';
import { Animated, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Car, Check, ChevronLeft, Grid3x3, Moon, Sparkles, Sun } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { NURSE_PRESETS } from '../data/sample';
import { addDays, clockOf, toISODate } from '../engine/time';
import type { Anchor, Chronotype, Role } from '../engine/types';
import { usePlan, useNow, useToday } from '../state/plan';
import { useStore } from '../state/store';
import type { Pattern } from '../state/store';
import { EASE, sec, useTheme } from '../theme/theme';
import { inkOn, tint } from '../theme/tokens';
import { ClockHero } from '../ui/ClockHero';
import { Field } from '../ui/Field';
import { FlipCard } from '../ui/FlipCard';
import { Button, Chip, Pill, Segmented, Stepper } from '../ui/kit';
import { Press } from '../ui/Press';
import { Txt } from '../ui/Text';
import { Legend, WeekStrips } from '../ui/WeekStrips';

const STEPS = ['welcome', 'role', 'pattern', 'shifts', 'schedule', 'sleep', 'commute', 'anchors', 'daysoff', 'week', 'plus', 'reminders'] as const;
type Step = (typeof STEPS)[number];

export default function Onboarding() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const step: Step = STEPS[i];
  const fade = useRef(new Animated.Value(1)).current;
  const scroll = useRef<ScrollViewInstance>(null);
  const s = useStore();

  // Local answers for the chronotype quiz.
  const [quiz, setQuiz] = useState<[number, number, number]>([1, 1, 1]);
  const [scheduleChoice, setScheduleChoice] = useState<'sample' | 'grid' | null>(s.shifts.length ? 'sample' : null);
  const [usual, setUsual] = useState<string[]>(['d12', 'n12']);
  const [billing, setBilling] = useState<'year' | 'month'>('year');

  const go = (n: number) => {
    Animated.timing(fade, { toValue: 0, duration: sec(0.16), easing: EASE, useNativeDriver: Platform.OS !== 'web' }).start(() => {
      setI(n);
      scroll.current?.scrollTo({ y: 0, animated: false });
      Animated.timing(fade, { toValue: 1, duration: sec(0.3), easing: EASE, useNativeDriver: Platform.OS !== 'web' }).start();
    });
  };

  const finish = () => {
    s.finishOnboarding();
    router.replace(scheduleChoice === 'grid' ? '/schedule' : '/today');
  };

  const next = () => {
    if (step === 'shifts') useStore.setState({ presets: NURSE_PRESETS.filter((p) => usual.includes(p.id)).concat(NURSE_PRESETS.filter((p) => !usual.includes(p.id))) });
    if (step === 'schedule' && scheduleChoice === 'sample') s.loadSample();
    if (step === 'sleep') {
      const score = quiz[0] + quiz[1] + quiz[2];
      const chronotype: Chronotype = score <= 2 ? 'morning' : score >= 4 ? 'evening' : 'neutral';
      s.setProfile({ chronotype });
    }
    if (i < STEPS.length - 1) go(i + 1);
    else finish();
  };

  const canContinue = step === 'schedule' ? !!scheduleChoice : true;
  const cta: Record<Step, string> = {
    welcome: 'Get started',
    role: 'Continue',
    pattern: 'Continue',
    shifts: 'Continue',
    schedule: 'Continue',
    sleep: 'Continue',
    commute: 'Continue',
    anchors: 'Build my week',
    daysoff: 'Show my week',
    week: 'Looks good',
    plus: billing === 'year' ? 'Start 7-day free trial' : 'Start monthly plan',
    reminders: 'Turn on reminders',
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      {/* top bar */}
      {step !== 'welcome' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 48, gap: 8 }}>
          <Press onPress={() => go(i - 1)} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={22} color={c.ink2} />
          </Press>
          <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
            {STEPS.slice(1).map((_, k) => (
              <View key={k} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: k < i ? c.ink2 : c.hover }} />
            ))}
          </View>
          {i >= 2 && i <= 8 ? (
            <Press onPress={() => go(STEPS.indexOf('week'))} hitSlop={8} style={{ paddingHorizontal: 8, height: 40, justifyContent: 'center' }} accessibilityRole="button">
              <Txt size={14} tone="muted">
                Skip
              </Txt>
            </Press>
          ) : (
            <View style={{ width: 48 }} />
          )}
        </View>
      ) : null}

      <Animated.View style={{ flex: 1, opacity: fade }}>
        <ScrollView ref={scroll} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: step === 'welcome' ? 36 : 18, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {step === 'welcome' ? <Welcome /> : null}
          {step === 'role' ? <RoleStep /> : null}
          {step === 'pattern' ? <PatternStep /> : null}
          {step === 'shifts' ? <ShiftsStep usual={usual} setUsual={setUsual} /> : null}
          {step === 'schedule' ? <ScheduleStep choice={scheduleChoice} setChoice={setScheduleChoice} /> : null}
          {step === 'sleep' ? <SleepStep quiz={quiz} setQuiz={setQuiz} /> : null}
          {step === 'commute' ? <CommuteStep /> : null}
          {step === 'anchors' ? <AnchorsStep /> : null}
          {step === 'daysoff' ? <DaysOffStep /> : null}
          {step === 'week' ? <WeekStep /> : null}
          {step === 'plus' ? <PlusStep billing={billing} setBilling={setBilling} /> : null}
          {step === 'reminders' ? <RemindersStep /> : null}
        </ScrollView>
      </Animated.View>

      <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: insets.bottom + 14, gap: 4 }}>
        <Button
          big
          full
          label={cta[step]}
          disabled={!canContinue}
          onPress={() => {
            if (step === 'plus') s.startTrial();
            next();
          }}
        />
        {step === 'plus' || step === 'reminders' ? (
          <Button big full kind="ghost" label={step === 'plus' ? 'Not now, keep the free version' : 'Maybe later'} onPress={next} />
        ) : null}
      </View>
    </View>
  );
}

function H({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Txt size={30} weight={600} title>
        {title}
      </Txt>
      {sub ? (
        <Txt size={15.5} tone="ink2" style={{ marginTop: 10 }}>
          {sub}
        </Txt>
      ) : null}
    </View>
  );
}

function OptionCard({ icon: Icon, title, body, on, onPress, right }: { icon?: LucideIcon; title: string; body?: string; on?: boolean; onPress?: () => void; right?: ReactNode }) {
  const { c } = useTheme();
  return (
    <Press
      onPress={onPress}
      haptic
      sink={0.98}
      accessibilityRole="radio"
      accessibilityState={{ selected: !!on }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: on ? c.accent : c.line,
        backgroundColor: on ? c.accentSoft : c.surface,
        marginBottom: 10,
      }}
    >
      <View style={{ flex: 1 }}>
        <Txt size={16} weight={500}>
          {title}
        </Txt>
        {body ? (
          <Txt size={13.5} tone="muted" style={{ marginTop: 2 }}>
            {body}
          </Txt>
        ) : null}
      </View>
      {right}
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: on ? c.accent : c.lineStrong, backgroundColor: on ? c.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {on ? <Check size={13} color={c.surface} strokeWidth={3} /> : null}
      </View>
    </Press>
  );
}

function Welcome() {
  return (
    <View>
      <ClockHero />
      <View style={{ marginTop: 28 }}>
        <Txt size={38} weight={600} title>
          Sleep, naps and coffee, planned around your shifts.
        </Txt>
        <Txt size={16.5} tone="ink2" style={{ marginTop: 14 }}>
          Add your shifts and Offshift works out when to sleep, when to nap and when to stop caffeine. It all sits on one timeline that keeps going past midnight.
        </Txt>
        <Txt size={13} tone="muted" style={{ marginTop: 18 }}>
          Takes about two minutes. Everything stays on your phone.
        </Txt>
      </View>
    </View>
  );
}

function RoleStep() {
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const roles: { v: Role; l: string }[] = [
    { v: 'rn', l: 'Registered nurse' },
    { v: 'lpn', l: 'LPN / LVN' },
    { v: 'cna', l: 'CNA or tech' },
    { v: 'resident', l: 'Resident' },
    { v: 'paramedic', l: 'Paramedic or EMT' },
    { v: 'other', l: 'Something else' },
  ];
  return (
    <View>
      <H title="What do you do?" sub="This sets your shift presets and the words Offshift uses." />
      <Field label="Your first name (optional)" value={profile.name} placeholder="Maya" onChangeText={(name) => setProfile({ name })} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {roles.map((r) => (
          <Chip key={r.v} label={r.l} on={profile.role === r.v} onPress={() => setProfile({ role: r.v })} />
        ))}
      </View>
    </View>
  );
}

function PatternStep() {
  const pattern = useStore((s) => s.pattern);
  const setPattern = useStore((s) => s.setPattern);
  const opts: { v: Pattern; t: string; b: string }[] = [
    { v: 'rotating', t: 'Rotating', b: 'Days and nights, mixed' },
    { v: 'fixed-days', t: 'Mostly days', b: 'Daytime shifts, the odd night' },
    { v: 'fixed-nights', t: 'Permanent nights', b: 'Nights, days off between' },
    { v: 'on-call', t: 'On call', b: 'Shifts might not happen' },
    { v: 'rotation', t: 'A repeating rotation', b: 'Like 2-2-3' },
    { v: 'chaos', t: 'No real pattern', b: 'Changes all the time' },
  ];
  return (
    <View>
      <H title="What does your schedule usually look like?" />
      {opts.map((o) => (
        <OptionCard key={o.v} title={o.t} body={o.b} on={pattern === o.v} onPress={() => setPattern(o.v)} />
      ))}
    </View>
  );
}

function ShiftsStep({ usual, setUsual }: { usual: string[]; setUsual: (v: string[]) => void }) {
  return (
    <View>
      <H title="Which shifts do you work?" sub="Tap all that apply. You can add custom times later." />
      {NURSE_PRESETS.map((p) => {
        const on = usual.includes(p.id);
        return (
          <OptionCard
            key={p.id}
            title={p.label}
            body={`${p.start} to ${p.end}`}
            on={on}
            onPress={() => setUsual(on ? usual.filter((x) => x !== p.id) : [...usual, p.id])}
            right={
              <View style={{ width: 34, height: 26, borderRadius: 4, backgroundColor: p.color, alignItems: 'center', justifyContent: 'center' }}>
                <Txt size={12} weight={700} color={inkOn(p.color)}>
                  {p.code}
                </Txt>
              </View>
            }
          />
        );
      })}
      <Txt size={12.5} tone="muted" style={{ marginTop: 4 }}>
        {usual.length ? `${usual.length} selected.` : 'Pick at least one, or skip for now.'}
      </Txt>
    </View>
  );
}

function ScheduleStep({ choice, setChoice }: { choice: 'sample' | 'grid' | null; setChoice: (v: 'sample' | 'grid') => void }) {
  return (
    <View>
      <H title="Let’s get your next few weeks in." sub="The plan is only as good as the schedule behind it." />
      <OptionCard icon={Camera} title="Screenshot of your roster" body="Snap it, check it, save" right={<Pill label="Soon" tone="accent" />} />
      <OptionCard icon={Grid3x3} title="Tap days on a calendar" body="About a minute a month" on={choice === 'grid'} onPress={() => setChoice('grid')} />
      <OptionCard icon={Sparkles} title="Show me with a sample fortnight" body="Try it, then add yours" on={choice === 'sample'} onPress={() => setChoice('sample')} />
    </View>
  );
}

function SleepStep({ quiz, setQuiz }: { quiz: [number, number, number]; setQuiz: (q: [number, number, number]) => void }) {
  const { c } = useTheme();
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const Q: { q: string; a: [string, string, string] }[] = [
    { q: 'On a free day, when would you wake up naturally?', a: ['Before 7', '7 to 9', 'After 9'] },
    { q: 'When do you feel sharpest?', a: ['Morning', 'Midday', 'Evening'] },
    { q: 'With nothing on tomorrow, when do you get sleepy?', a: ['By 22:30', '22:30 to 00:00', 'After 00:00'] },
  ];
  return (
    <View>
      <H title="How do you sleep when nobody’s scheduling you?" />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.line, marginBottom: 18 }}>
        <View style={{ flex: 1 }}>
          <Txt size={16}>Sleep you need</Txt>
          <Txt size={12.5} tone="muted">
            Most adults do best with 7 to 9 hours.
          </Txt>
        </View>
        <Stepper value={profile.sleepNeedH} step={0.25} min={5} max={10} onChange={(sleepNeedH) => setProfile({ sleepNeedH })} format={(v) => `${Math.floor(v)}h${v % 1 ? ` ${Math.round((v % 1) * 60)}m` : ''}`} />
      </View>
      {Q.map((q, k) => (
        <View key={k} style={{ marginBottom: 20 }}>
          <Txt size={15.5} weight={500} style={{ marginBottom: 10 }}>
            {q.q}
          </Txt>
          <Segmented
            full
            value={quiz[k]}
            onChange={(v) => {
              const n = [...quiz] as [number, number, number];
              n[k] = v;
              setQuiz(n);
            }}
            options={q.a.map((l, j) => ({ value: j, label: l }))}
          />
        </View>
      ))}
    </View>
  );
}

function CommuteStep() {
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const { c } = useTheme();
  return (
    <View>
      <H title="How long is your trip to work?" sub="Used for “leave by” reminders, and so the drive home is part of the plan." />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.line, marginBottom: 18 }}>
        <Txt size={16}>Each way</Txt>
        <Stepper value={profile.commuteMin} step={5} min={0} max={180} onChange={(commuteMin) => setProfile({ commuteMin })} format={(v) => `${v} min`} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(['drive', 'transit', 'walk', 'bike'] as const).map((m) => (
          <Chip key={m} icon={m === 'drive' ? Car : undefined} label={{ drive: 'Drive', transit: 'Transit', walk: 'Walk', bike: 'Bike' }[m]} on={profile.commuteMode === m} onPress={() => setProfile({ commuteMode: m })} />
        ))}
      </View>
    </View>
  );
}

const QUICK_ANCHORS: Anchor[] = [
  { id: 'q-school-am', title: 'School drop-off', days: [1, 2, 3, 4, 5], start: '08:00', end: '08:45', priority: 'must', color: '#E0A458' },
  { id: 'q-school-pm', title: 'School pickup', days: [1, 2, 3, 4, 5], start: '15:00', end: '15:45', priority: 'must', color: '#E0A458' },
  { id: 'q-dog', title: 'Walk the dog', days: [0, 1, 2, 3, 4, 5, 6], start: '17:30', end: '18:00', priority: 'prefer', color: '#7FB08A' },
  { id: 'q-gym', title: 'Gym or a class', days: [3, 6], start: '10:00', end: '11:00', priority: 'prefer', color: '#D88FB4' },
  { id: 'q-care', title: 'Check on Mum or Dad', days: [0], start: '12:00', end: '14:00', priority: 'prefer', color: '#6FA8DC' },
];

function AnchorsStep() {
  const anchors = useStore((s) => s.anchors);
  const upsert = useStore((s) => s.upsertAnchor);
  const remove = useStore((s) => s.removeAnchor);
  return (
    <View>
      <H title="Anything your week has to work around?" sub="Tap what fits. You can set exact times in Life later." />
      {QUICK_ANCHORS.map((a) => {
        const on = anchors.some((x) => x.id === a.id);
        return <OptionCard key={a.id} title={a.title} body={`${a.days.length === 7 ? 'Every day' : a.days.length === 5 ? 'Weekdays' : 'Some days'} · ${a.start} to ${a.end} · ${a.priority === 'must' ? 'has to happen' : 'if it fits'}`} on={on} onPress={() => (on ? remove(a.id) : upsert(a))} />;
      })}
    </View>
  );
}

function DaysOffStep() {
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  return (
    <View>
      <H title="On days off between nights, what feels better?" sub="No wrong answer. You can switch any time." />
      <OptionCard icon={Sun} title="Flip back to days" body="Normal bedtime after nights" on={profile.daysOffStyle === 'flip'} onPress={() => setProfile({ daysOffStyle: 'flip' })} />
      <OptionCard icon={Moon} title="Stay a night owl" body="Late nights, bed around 03:00" on={profile.daysOffStyle === 'owl'} onPress={() => setProfile({ daysOffStyle: 'owl' })} />
    </View>
  );
}

function WeekStep() {
  const today = useToday();
  const now = useNow();
  const plan = usePlan(today, 7);
  const t = plan.transitions[0];
  const { c } = useTheme();
  const explain = useMemo(() => plan.blocks.find((b) => b.kind === 'sleep' && b.variant === 'between-nights') ?? plan.blocks.find((b) => b.kind === 'nap') ?? plan.blocks.find((b) => b.kind === 'sleep'), [plan]);
  return (
    <View>
      <H title="Here’s your next seven days." sub={t ? `Your next change is ${t.title.toLowerCase()}, ${t.date === today ? 'today' : t.date === addDays(today, 1) ? 'tomorrow' : 'this week'}. It’s planned step by step.` : 'Sleep, naps and free time, planned around every shift.'} />
      <WeekStrips plan={plan} from={today} today={today} now={now} hourH={13} highlight={t ? [t.date] : []} />
      <Legend />
      {explain ? (
        <Txt size={15} lh={22} tone="ink2" style={{ marginTop: 22 }}>
          <Txt size={15} lh={22} weight={600}>
            {`Why ${explain.title.toLowerCase()} at ${clockOf(explain.start)}? `}
          </Txt>
          {explain.why}
        </Txt>
      ) : null}
      {t ? (
        <View style={{ marginTop: 14 }}>
          <FlipCard t={t} today={today} />
        </View>
      ) : null}
    </View>
  );
}

function PlusStep({ billing, setBilling }: { billing: 'year' | 'month'; setBilling: (v: 'year' | 'month') => void }) {
  const { c } = useTheme();
  const feats = [
    'The full week and every flip plan, like the one you just saw',
    'A check-in before the drive home after nights',
    'Lock Screen and home widgets, and a Live Activity during shifts',
    'A link so family knows when you’re asleep',
    'Screenshot import when it arrives',
  ];
  return (
    <View>
      <H title="Keep the whole week planned." sub="Try everything free for 7 days. Cancel any time before it ends and you won’t be charged." />
      {feats.map((f) => (
        <View key={f} style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
            <Check size={13} color={c.accent} strokeWidth={2.6} />
          </View>
          <Txt size={15.5} style={{ flex: 1 }}>
            {f}
          </Txt>
        </View>
      ))}
      <View style={{ gap: 10, marginTop: 12 }}>
        {(
          [
            { v: 'year', t: '$29.99 a year', b: '$2.50 a month, 7-day trial', tag: 'Best value' },
            { v: 'month', t: '$4.99 a month', b: 'No trial, cancel any time' },
          ] as const
        ).map((o) => {
          const on = billing === o.v;
          return (
            <Press key={o.v} onPress={() => setBilling(o.v)} haptic sink={0.98} accessibilityRole="radio" accessibilityState={{ selected: on }} style={{ padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accentSoft : c.surface }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Txt num size={17} weight={600}>
                  {o.t}
                </Txt>
                {'tag' in o ? <Pill label={o.tag} tone="good" /> : null}
              </View>
              <Txt size={13.5} tone="muted" style={{ marginTop: 2 }}>
                {o.b}
              </Txt>
            </Press>
          );
        })}
      </View>
      <Txt size={12} tone="muted" style={{ marginTop: 14 }}>
        The free version keeps Today, your schedule and basic reminders. Preview build: no payment is taken.
      </Txt>
    </View>
  );
}

function RemindersStep() {
  const { c } = useTheme();
  const profile = useStore((st) => st.profile);
  const today = useToday();
  const plan = usePlan(today, 3);
  const now = useNow();
  const atWork = (t: number) => plan.blocks.some((b) => b.kind === 'work' && t >= b.start && t < b.end);
  const cut = plan.markers.find((m) => m.kind === 'caffeine-cutoff' && m.at > now && !atWork(m.at));
  const sleep = plan.blocks.find((b) => b.kind === 'sleep' && b.start > now);
  const work = plan.blocks.find((b) => b.kind === 'work' && b.start > now);
  const day = (t: number) => (toISODate(t) === today ? 'Today' : new Date(t).toLocaleDateString('en-GB', { weekday: 'short' }));
  const wind = sleep ? sleep.start - profile.windDownMin * 60_000 : 0;
  const items = [
    work ? { at: work.start - (profile.commuteMin + 10) * 60_000, lead: `Leave in 10 minutes.`, rest: ` ${work.title} starts at ${clockOf(work.start)}.` } : null,
    cut ? { at: cut.at, lead: 'Last coffee.', rest: ' Anything after this is still in you at bedtime.' } : null,
    sleep ? { at: wind, lead: 'Start winding down.', rest: ` Lights low, screens down, bed by ${clockOf(sleep.start)}.` } : null,
  ]
    .filter((x): x is { at: number; lead: string; rest: string } => !!x)
    .sort((a, b) => a.at - b.at);
  return (
    <View>
      <H title="A few nudges. Never during a shift." sub="Here are the next ones you’d get. Turn any of them off in You." />
      <View style={{ marginTop: 4 }}>
        {items.map((n, k) => (
          <View key={k} style={{ flexDirection: 'row', gap: 16, borderBottomWidth: 1, borderBottomColor: c.line }}>
            <View style={{ width: 58, paddingTop: 14 }}>
              <Txt size={17} weight={600} num>
                {clockOf(n.at)}
              </Txt>
              <Txt size={12} tone="muted">
                {day(n.at)}
              </Txt>
            </View>
            <View style={{ flex: 1, paddingVertical: 14 }}>
              <Txt size={15.5} lh={22}>
                <Txt size={15.5} lh={22} weight={600}>
                  {n.lead}
                </Txt>
                <Txt size={15.5} lh={22} tone="ink2">
                  {n.rest}
                </Txt>
              </Txt>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
