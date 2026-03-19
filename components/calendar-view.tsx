import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassTheme } from '@/constants/theme';

import { GlassCard } from '@/components/glass-card';

interface DayEvent {
  id: string;
  title: string;
  type: 'note' | 'todo' | 'todo_done';
  color?: string;
}

interface Props {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  getEventsForDate: (date: Date) => DayEvent[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function CalendarView({ selectedDate, onSelectDate, getEventsForDate }: Props) {
  const today = new Date();
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startPad = firstDayOfMonth.getDay(); // 0 = Sunday
  const totalDays = lastDayOfMonth.getDate();

  const cells: (Date | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => new Date(year, month, i + 1)),
  ];

  const goToPrevMonth = () => {
    onSelectDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    onSelectDate(new Date(year, month + 1, 1));
  };

  return (
    <GlassCard style={styles.containerWrap} noPadding>
      <View style={{ padding: GlassTheme.spacing.md }}>
        {/* Month navigation */}
      <View style={styles.header}>
        <Pressable onPress={goToPrevMonth} style={styles.navBtn} hitSlop={8}>
          <MaterialIcons name="chevron-left" size={24} color={GlassTheme.textPrimary} />
        </Pressable>
        <Text style={styles.monthTitle}>
          {MONTHS[month]} {year}
        </Text>
        <Pressable onPress={goToNextMonth} style={styles.navBtn} hitSlop={8}>
          <MaterialIcons name="chevron-right" size={24} color={GlassTheme.textPrimary} />
        </Pressable>
      </View>

      {/* Weekday labels */}
      <View style={styles.weekdays}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {cells.map((date, idx) => {
          if (!date) {
            return <View key={`empty-${idx}`} style={styles.cell} />;
          }

          const events = getEventsForDate(date);
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          const hasEvents = events.length > 0;
          const hasTodo = events.some((e) => e.type === 'todo');
          const hasTodoDone = events.some((e) => e.type === 'todo_done');
          const hasNote = events.some((e) => e.type === 'note');

          return (
            <Pressable
              key={date.toISOString()}
              style={styles.cell}
              onPress={() => onSelectDate(date)}
            >
              <View
                style={[
                  styles.dayCircle,
                  isToday && { backgroundColor: GlassTheme.accentPrimary },
                  isSelected && !isToday && { 
                    backgroundColor: GlassTheme.glassBorderFocused,
                    borderWidth: 1.5,
                    borderColor: GlassTheme.accentPrimary 
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isToday && styles.todayText,
                    isSelected && { color: GlassTheme.textPrimary, fontWeight: '700' },
                  ]}
                >
                  {date.getDate()}
                </Text>
              </View>
              {hasEvents && (
                <View style={styles.dotRow}>
                  {hasNote && <View style={[styles.dot, { backgroundColor: GlassTheme.accentPrimary }]} />}
                  {hasTodo && <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />}
                  {hasTodoDone && <View style={[styles.dot, { backgroundColor: '#22C55E' }]} />}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Today button */}
      {!isSameDay(selectedDate, today) && (
        <Pressable 
          onPress={() => onSelectDate(new Date())} 
          style={[
            styles.todayBtn,
            {
              backgroundColor: GlassTheme.accentPrimary + '20',
              borderColor: GlassTheme.accentPrimary + '40',
            }
          ]}
        >
          <Text style={[styles.todayBtnText, { color: GlassTheme.accentPrimary }]}>Today</Text>
        </Pressable>
      )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  containerWrap: {
    marginHorizontal: GlassTheme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: GlassTheme.spacing.md,
  },
  navBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: GlassTheme.radius.full,
    backgroundColor: GlassTheme.glassBorder,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GlassTheme.textPrimary,
    letterSpacing: -0.3,
  },
  weekdays: {
    flexDirection: 'row',
    marginBottom: GlassTheme.spacing.xs,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '600',
    color: GlassTheme.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
    color: GlassTheme.textSecondary,
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  selectedText: {
    color: GlassTheme.textPrimary,
    fontWeight: '700',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    height: 5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  todayBtn: {
    alignSelf: 'center',
    marginTop: GlassTheme.spacing.sm,
    paddingHorizontal: GlassTheme.spacing.md,
    paddingVertical: GlassTheme.spacing.xs,
    borderRadius: GlassTheme.radius.full,
    borderWidth: 1,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
