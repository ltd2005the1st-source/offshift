import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { useStore } from '../../state/store';
import type { ThemePref } from '../../state/store';
import { useTheme } from '../../theme/theme';
import { Field } from '../../ui/Field';
import { Button, Card, Chip, PageHeader, Row, Section, Segmented, Stepper, Switch } from '../../ui/kit';
import { Screen } from '../../ui/Screen';
import { useToast } from '../../ui/Sheet';
import { Txt } from '../../ui/Text';

const ROLES = [
  { value: 'rn', label: 'RN' },
  { value: 'lpn', label: 'LPN' },
  { value: 'cna', label: 'CNA' },
  { value: 'resident', label: 'Resident' },
  { value: 'paramedic', label: 'Paramedic' },
  { value: 'other', label: 'Other' },
] as const;

export default function You() {
  const { c } = useTheme();
  const toast = useToast();
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const reminders = useStore((s) => s.reminders);
  const setReminders = useStore((s) => s.setReminders);
  const resetAll = useStore((s) => s.resetAll);
  const [confirm, setConfirm] = useState(false);

  return (
    <Screen>
      <PageHeader title={profile.name || 'Your settings'} sub="Good defaults are already set. Change what doesn’t fit, and the plan follows." />

      <Section title="About you">
        <Field label="Name" value={profile.name} placeholder="What should Offshift call you?" onChangeText={(name) => setProfile({ name })} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ROLES.map((r) => (
            <Chip key={r.value} label={r.label} on={profile.role === r.value} onPress={() => setProfile({ role: r.value })} />
          ))}
        </View>
      </Section>

      <Section title="Sleep">
        <Row label="Sleep you need" hint="Most adults need 7 to 9">
          <Stepper value={profile.sleepNeedH} step={0.25} min={5} max={10} onChange={(sleepNeedH) => setProfile({ sleepNeedH })} format={(v) => `${Math.floor(v)}h${v % 1 ? ` ${Math.round((v % 1) * 60)}m` : ''}`} />
        </Row>
        <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.line }}>
          <Txt size={15} style={{ marginBottom: 8 }}>
            On a free day you’re a…
          </Txt>
          <Segmented
            full
            value={profile.chronotype}
            onChange={(chronotype) => setProfile({ chronotype })}
            options={[
              { value: 'morning', label: 'Early bird' },
              { value: 'neutral', label: 'In between' },
              { value: 'evening', label: 'Night owl' },
            ]}
          />
        </View>
        <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.line }}>
          <Txt size={15} style={{ marginBottom: 8 }}>
            Nap before a first night
          </Txt>
          <Segmented
            full
            value={profile.napMin}
            onChange={(napMin) => setProfile({ napMin })}
            options={[
              { value: 30, label: '30 min' },
              { value: 60, label: '1 hour' },
              { value: 90, label: '90 min' },
            ]}
          />
        </View>
        <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.line }}>
          <Txt size={15} style={{ marginBottom: 2 }}>
            Days off between nights
          </Txt>
          <Txt size={12.5} tone="muted" style={{ marginBottom: 8 }}>
            Flip back to days, or keep a late rhythm until the next night.
          </Txt>
          <Segmented
            full
            value={profile.daysOffStyle}
            onChange={(daysOffStyle) => setProfile({ daysOffStyle })}
            options={[
              { value: 'flip', label: 'Flip back' },
              { value: 'owl', label: 'Stay a night owl' },
            ]}
          />
        </View>
        <Row label="Last coffee" hint="Hours before planned sleep.">
          <Stepper value={profile.caffeineCutoffH} min={3} max={10} onChange={(caffeineCutoffH) => setProfile({ caffeineCutoffH })} format={(v) => `${v}h`} />
        </Row>
        <Row label="Wind-down" hint="Quiet time before bed." last>
          <Stepper value={profile.windDownMin} step={15} min={0} max={90} onChange={(windDownMin) => setProfile({ windDownMin })} format={(v) => `${v}m`} />
        </Row>
      </Section>

      <Section title="Getting there">
        <Row label="Commute, each way">
          <Stepper value={profile.commuteMin} step={5} min={0} max={180} onChange={(commuteMin) => setProfile({ commuteMin })} format={(v) => `${v}m`} />
        </Row>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 12 }}>
          {(['drive', 'transit', 'walk', 'bike'] as const).map((m) => (
            <Chip key={m} label={{ drive: 'Drive', transit: 'Transit', walk: 'Walk', bike: 'Bike' }[m]} on={profile.commuteMode === m} onPress={() => setProfile({ commuteMode: m })} />
          ))}
        </View>
      </Section>

      <Section title="Reminders" qualifier="All on this phone">
        <Row label="Leave for work" hint="Commute plus a buffer">
          <Switch label="Leave for work" on={reminders.leave} onChange={(leave) => setReminders({ leave })} />
        </Row>
        <Row label="Last coffee">
          <Switch label="Last coffee" on={reminders.caffeine} onChange={(caffeine) => setReminders({ caffeine })} />
        </Row>
        <Row label="Wind-down">
          <Switch label="Wind-down" on={reminders.windDown} onChange={(windDown) => setReminders({ windDown })} />
        </Row>
        <Row label="Nap time">
          <Switch label="Nap time" on={reminders.nap} onChange={(nap) => setReminders({ nap })} />
        </Row>
        <Row label="Check-in before the drive home">
          <Switch label="Drive check" on={reminders.driveCheck} onChange={(driveCheck) => setReminders({ driveCheck })} />
        </Row>
        <Row label="Allow during shifts" hint="Off by default" last>
          <Switch label="Allow during shifts" on={reminders.duringShift} onChange={(duringShift) => setReminders({ duringShift })} />
        </Row>
      </Section>

      <Section title="Appearance">
        <Segmented<ThemePref>
          full
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'night', label: 'Night' },
            { value: 'day', label: 'Day' },
            { value: 'auto', label: 'Match phone' },
          ]}
        />
        <Txt size={12.5} tone="muted" style={{ marginTop: 8 }}>
          Night is easiest on the eyes at 3 a.m.
        </Txt>
      </Section>

      <Section title="Privacy">
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <ShieldCheck size={18} color={c.good} style={{ marginTop: 2 }} />
          <Txt size={14} tone="ink2" style={{ flex: 1 }}>
            Your schedule and plan stay on this phone. Nothing is shared unless you create a link, and there are no ads or trackers.
          </Txt>
        </View>
      </Section>

      <Section title="Help">
        <Txt size={13.5} tone="ink2">
          Offshift gives general planning and wellness guidance. It isn’t medical advice and doesn’t diagnose or treat any condition. If sleep problems carry on, talk to a clinician.
        </Txt>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          <Button kind="line" label="Replay onboarding" onPress={() => router.replace('/onboarding')} />
          <Button
            kind={confirm ? 'primary' : 'ghost'}
            danger={!confirm}
            style={confirm ? { backgroundColor: c.pen } : undefined}
            label={confirm ? 'Tap again to erase' : 'Erase everything'}
            onPress={() => {
              if (!confirm) {
                setConfirm(true);
                setTimeout(() => setConfirm(false), 3500);
                return;
              }
              resetAll();
              toast.show('Everything erased.');
              router.replace('/onboarding');
            }}
          />
        </View>
      </Section>
    </Screen>
  );
}
