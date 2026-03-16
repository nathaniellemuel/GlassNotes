import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GlassTheme } from '@/constants/theme';
import { useNotes } from '@/hooks/use-notes';
import { useTodos } from '@/hooks/use-todos';
import { CalendarView } from '@/components/calendar-view';
import { NOTE_COLORS } from '@/types/note';

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { notes, loadNotes } = useNotes();
  const { todos, loadTodos } = useTodos();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
      loadTodos();
    }, [loadNotes, loadTodos]),
  );

  const getEventsForDate = useCallback(
    (date: Date) => {
      const events: { id: string; title: string; type: 'note' | 'todo' | 'todo_done'; color?: string }[] = [];

      notes.forEach((n) => {
        if (isSameDay(new Date(n.createdAt), date)) {
          const noteColor = NOTE_COLORS.find((c) => c.id === n.colorId);
          events.push({
            id: n.id,
            title: n.title || 'Untitled',
            type: 'note',
            color: noteColor?.accent ?? GlassTheme.accentPrimary,
          });
        }
      });

      todos.forEach((t) => {
        if (t.dueDate && isSameDay(new Date(t.dueDate), date)) {
          events.push({
            id: t.id,
            title: t.title || 'Untitled task',
            type: t.completed ? 'todo_done' : 'todo',
          });
        }
      });

      return events;
    },
    [notes, todos],
  );

  const selectedDayNotes = notes.filter((n) =>
    isSameDay(new Date(n.createdAt), selectedDate),
  );
  const selectedDayTodos = todos.filter(
    (t) => t.dueDate && isSameDay(new Date(t.dueDate), selectedDate),
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadNotes(), loadTodos()]);
    setIsRefreshing(false);
  };

  const today = new Date();
  const isToday = isSameDay(selectedDate, today);
  const dateLabel = isToday
    ? 'Today'
    : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(34, 197, 94, 0.06)', 'transparent']}
        style={styles.gradient}
      />

      <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <Text style={styles.headerSubtitle}>
          {notes.length} notes  •  {todos.length} tasks
        </Text>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={GlassTheme.accentPrimary}
          />
        }
      >
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <CalendarView
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            getEventsForDate={getEventsForDate}
          />
        </Animated.View>

        {/* Selected day events */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.eventsSection}>
          <Text style={styles.dateLabel}>{dateLabel}</Text>

          {selectedDayNotes.length === 0 && selectedDayTodos.length === 0 && (
            <View style={styles.noEvents}>
              <MaterialIcons name="event-available" size={32} color={GlassTheme.textTertiary} />
              <Text style={styles.noEventsText}>Nothing on this day</Text>
            </View>
          )}

          {selectedDayNotes.length > 0 && (
            <View style={styles.eventGroup}>
              <View style={styles.eventGroupHeader}>
                <MaterialIcons name="note" size={14} color={GlassTheme.accentPrimary} />
                <Text style={[styles.eventGroupTitle, { color: GlassTheme.accentPrimary }]}>
                  Notes Created
                </Text>
              </View>
              {selectedDayNotes.map((note) => {
                const noteColor = NOTE_COLORS.find((c) => c.id === note.colorId);
                return (
                  <Pressable
                    key={note.id}
                    style={styles.eventCard}
                    onPress={() => router.push({ pathname: '/editor', params: { id: note.id } })}
                  >
                    <View
                      style={[
                        styles.eventDot,
                        { backgroundColor: noteColor?.accent ?? GlassTheme.accentPrimary },
                      ]}
                    />
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle} numberOfLines={1}>
                        {note.title || 'Untitled'}
                      </Text>
                      <Text style={styles.eventMeta}>{formatTime(note.createdAt)}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={18} color={GlassTheme.textTertiary} />
                  </Pressable>
                );
              })}
            </View>
          )}

          {selectedDayTodos.length > 0 && (
            <View style={styles.eventGroup}>
              <View style={styles.eventGroupHeader}>
                <MaterialIcons name="checklist" size={14} color="#F59E0B" />
                <Text style={[styles.eventGroupTitle, { color: '#F59E0B' }]}>Tasks Due</Text>
              </View>
              {selectedDayTodos.map((todo) => (
                <View key={todo.id} style={styles.eventCard}>
                  <View
                    style={[
                      styles.eventDot,
                      { backgroundColor: todo.completed ? '#22C55E' : '#F59E0B' },
                    ]}
                  />
                  <View style={styles.eventInfo}>
                    <Text
                      style={[
                        styles.eventTitle,
                        todo.completed && styles.eventTitleDone,
                      ]}
                      numberOfLines={1}
                    >
                      {todo.title || 'Untitled task'}
                    </Text>
                    <Text style={styles.eventMeta}>
                      {todo.completed ? 'Completed' : todo.priority + ' priority'}
                    </Text>
                  </View>
                  {todo.completed && (
                    <MaterialIcons name="check-circle" size={18} color="#22C55E" />
                  )}
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlassTheme.backgroundPrimary,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  header: {
    paddingHorizontal: GlassTheme.spacing.lg,
    paddingTop: GlassTheme.spacing.lg,
    paddingBottom: GlassTheme.spacing.md,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: GlassTheme.textPrimary,
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: GlassTheme.textTertiary,
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  eventsSection: {
    paddingHorizontal: GlassTheme.spacing.md,
    marginTop: GlassTheme.spacing.lg,
  },
  dateLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: GlassTheme.textPrimary,
    marginBottom: GlassTheme.spacing.md,
    letterSpacing: -0.3,
  },
  noEvents: {
    alignItems: 'center',
    paddingVertical: GlassTheme.spacing.xl,
    gap: 8,
  },
  noEventsText: {
    fontSize: 14,
    color: GlassTheme.textTertiary,
  },
  eventGroup: {
    marginBottom: GlassTheme.spacing.lg,
    gap: 6,
  },
  eventGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  eventGroupTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlassTheme.glassBackground,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    borderRadius: GlassTheme.radius.md,
    padding: GlassTheme.spacing.md,
    gap: 12,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: GlassTheme.textPrimary,
  },
  eventTitleDone: {
    textDecorationLine: 'line-through',
    color: GlassTheme.textTertiary,
  },
  eventMeta: {
    fontSize: 11,
    color: GlassTheme.textTertiary,
    marginTop: 2,
  },
});
