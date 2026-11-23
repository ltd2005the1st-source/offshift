import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { CalendarPlus, Camera, ChevronLeft, ChevronRight, Link2, Repeat } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { addDays, fromISODate, toISODate, weekday } from '../../engine/time';
import { shiftHours } from '../../engine/plan';
import { useToday } from '../../state/plan';
import { useStore } from '../../state/store';
import { useTheme } from '../../theme/theme';
import { inkOn, tint } from '../../theme/tokens';
import { monthYear } from '../../ui/format';
import { Button, Chip, IconButton, PageHeader, Pill, Section } from '../../ui/kit';
import { Press } from '../../ui/Press';
import { Screen } from '../../ui/Screen';
import { Sheet, useToast } from '../../ui/Sheet';
import { Label, Txt } from '../../ui/Text';

const WD = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Schedule() {
  const { c } = useTheme();
  const today = useToday();
  const toast = useToast();
  const shifts = useStore((s) => s.shifts);
  const presets = useStore((s) => s.presets);
  const assign = useStore((s) => s.assignShifts);
  const [month, setMonth] = useState(today.slice(0, 7) + '-01');
  const [sel, setSel] = useState<string[]>([]);
  const [importOpen, setImportOpen] = useState(false);

  const cells = useMemo(() => {
    const lead = (weekday(month) + 6) % 7; // Monday first
    const start = addDays(month, -lead);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [month]);
  const inMonth = (d: string) => d.slice(0, 7) === month.slice(0, 7);
  const rows = cells.slice(35).some(inMonth) ? 6 : 5;

  const monthShifts = shifts.filter((s) => s.date.slice(0, 7) === month.slice(0, 7));
  const hours = monthShifts.reduce((t, s) => t + shiftHours(s), 0);
  const nights = monthShifts.filter((s) => s.type === 'night').length;

  const move = (n: number) => {
    const { y, mo } = fromISODate(month);
    setMonth(toISODate(new Date(y, mo + n, 1, 12).getTime()));
    setSel([]);
  };

  const apply = (presetId: string | null) => {
    assign(sel, presetId);
    const p = presets.find((x) => x.id === presetId);
    toast.show(p ? `${p.label} added to ${sel.length} day${sel.length > 1 ? 's' : ''}. Plan updated.` : `Cleared ${sel.length} day${sel.length > 1 ? 's' : ''}. Plan updated.`);
    setSel([]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen contentContainerStyle={{ paddingBottom: sel.length ? 260 : undefined }}>
        <PageHeader
          title={monthYear(month)}
          right={
            <View style={{ flexDirection: 'row' }}>
              <IconButton icon={ChevronLeft} label="Previous month" onPress={() => move(-1)} />
              <IconButton icon={ChevronRight} label="Next month" onPress={() => move(1)} />
            </View>
          }
        />
        <Txt size={14.5} tone="ink2" style={{ marginTop: -10, marginBottom: 18 }}>
          {monthShifts.length ? (
            <>
              <Txt num size={14.5} weight={600}>
                {monthShifts.length}
              </Txt>{' '}
              shifts,{' '}
              <Txt num size={14.5} weight={600}>
                {Math.round(hours)}
              </Txt>{' '}
              hours,{' '}
              <Txt num size={14.5} weight={600}>
                {nights}
              </Txt>{' '}
              nights
            </>
          ) : (
            'No shifts this month yet. Tap days to add them.'
          )}
        </Txt>

        {/* Month grid */}
        <View style={{ flexDirection: 'row', marginBottom: 6 }}>
          {WD.map((w, i) => (
            <Label key={i} style={{ flex: 1, textAlign: 'center' }}>
              {w}
            </Label>
          ))}
        </View>
        <View style={{ borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: c.line, backgroundColor: c.line, gap: 1 }}>
          {Array.from({ length: rows }, (_, r) => (
            <View key={r} style={{ flexDirection: 'row', gap: 1 }}>
              {cells.slice(r * 7, r * 7 + 7).map((d) => {
                const s = shifts.find((x) => x.date === d);
                const p = presets.find((x) => x.id === s?.presetId);
                const on = sel.includes(d);
                const isToday = d === today;
                const out = !inMonth(d);
                return (
                  <Press
                    key={d}
                    sink={0.95}
                    haptic
                    onPress={() => setSel(on ? sel.filter((x) => x !== d) : [...sel, d])}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={`${d}${p ? `, ${p.label}` : ''}`}
                    style={{ flex: 1, height: 62, backgroundColor: on ? c.accentSoft : out ? c.sunken : c.surface, padding: 5, alignItems: 'center', gap: 5 }}
                  >
                    <View style={{ minWidth: 24, height: 22, paddingHorizontal: 3, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.accent : isToday ? c.pen : 'transparent' }}>
                      <Txt num size={13} weight={isToday || on ? 700 : 500} color={on ? c.onInk : isToday ? '#fff' : out ? c.muted : c.ink}>
                        {Number(d.slice(8))}
                      </Txt>
                    </View>
                    {p ? (
                      <View style={{ alignSelf: 'stretch', borderRadius: 4, backgroundColor: p.color, paddingVertical: 3, alignItems: 'center', opacity: out ? 0.4 : 1 }}>
                        <Txt size={11.5} weight={700} color={inkOn(p.color)} lh={14}>
                          {p.code}
                        </Txt>
                      </View>
                    ) : null}
                  </Press>
                );
              })}
            </View>
          ))}
        </View>
        <Txt size={12.5} tone="muted" style={{ marginTop: 8, marginBottom: 26 }}>
          Tap several days, then pick a shift. The plan updates as soon as you do.
        </Txt>

        <Section title="Add a whole schedule">
          <View style={{ gap: 8 }}>
            <Button big full kind="line" label="Import from a screenshot or feed" icon={CalendarPlus} onPress={() => setImportOpen(true)} />
          </View>
        </Section>

        <Section title="Your shifts" count={presets.length}>
          {presets.map((p) => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: c.line }}>
              <View style={{ width: 32, height: 26, borderRadius: 4, backgroundColor: p.color, alignItems: 'center', justifyContent: 'center' }}>
                <Txt size={12} weight={700} color={inkOn(p.color)}>
                  {p.code}
                </Txt>
              </View>
              <Txt size={15} style={{ flex: 1 }}>
                {p.label}
              </Txt>
              <Txt num size={14} tone="ink2">
                {p.start} to {p.end}
              </Txt>
            </View>
          ))}
        </Section>
      </Screen>

      {/* Assign bar */}
      {sel.length ? (
        <View
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 104,
            backgroundColor: c.raised,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: c.hairline,
            padding: 14,
            shadowColor: '#000',
            shadowOpacity: 0.4,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 10 },
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Txt size={14.5} weight={600} style={{ flex: 1 }}>
              {sel.length} day{sel.length > 1 ? 's' : ''} selected
            </Txt>
            <Press onPress={() => setSel([])} hitSlop={10}>
              <Txt size={13.5} tone="muted">
                Clear
              </Txt>
            </Press>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {presets.map((p) => (
              <Chip key={p.id} label={`${p.code}  ${p.start.replace(':00', '')} to ${p.end.replace(':00', '')}`} color={p.color} onPress={() => apply(p.id)} />
            ))}
            <Chip label="Day off" onPress={() => apply(null)} />
          </View>
        </View>
      ) : null}

      <ImportSheet open={importOpen} onClose={() => setImportOpen(false)} />
    </View>
  );
}

function ImportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { c } = useTheme();
  const loadSample = useStore((s) => s.loadSample);
  const toast = useToast();
  const opt = (Icon: LucideIcon, title: string, body: string, tag?: string, onPress?: () => void) => (
    <Press onPress={onPress} disabled={!onPress} sink={0.98} style={{ flexDirection: 'row', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.line, opacity: onPress ? 1 : 0.75 }}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt size={15.5} weight={500}>
            {title}
          </Txt>
          {tag ? <Pill label={tag} tone="accent" /> : null}
        </View>
        <Txt size={13.5} tone="muted" style={{ marginTop: 2 }}>
          {body}
        </Txt>
      </View>
    </Press>
  );
  return (
    <Sheet open={open} onClose={onClose} title="Add your schedule">
      {opt(Camera, 'Screenshot of your roster', 'Snap it, check it, save', 'Coming soon')}
      {opt(Link2, 'Calendar feed', 'Paste an ICS link', 'Coming soon')}
      {opt(Repeat, 'A repeating rotation', 'Pick a cycle and start date', 'Coming soon')}
      {opt(CalendarPlus, 'Use a sample fortnight', 'See how plans look', undefined, () => {
        loadSample();
        toast.show('Sample fortnight added. Plan updated.');
        onClose();
      })}
      <Txt size={12} tone="muted" style={{ marginTop: 14 }}>
        Offshift never needs coworkers’ names or anything about patients.
      </Txt>
    </Sheet>
  );
}

