import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/components/glass-card';
import { GlassTheme } from '@/constants/theme';
import { TODO_PRIORITIES } from '@/types/todo';
import type { Todo } from '@/types/todo';

interface Props {
  todo: Todo;
  index: number;
  onToggle: () => void;
  onPress: () => void;
  onLongPress: () => void;
  onDelete: () => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) return 'Today';
  const isTomorrow =
    d.getDate() === now.getDate() + 1 &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isTomorrow) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TodoItem({ todo, index, onToggle, onPress, onLongPress, onDelete }: Props) {
  const scale = useSharedValue(1);
  const priority = TODO_PRIORITIES.find((p) => p.id === todo.priority) ?? TODO_PRIORITIES[1];
  const isOverdue =
    !todo.completed && todo.dueDate && todo.dueDate < Date.now();

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.95, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
    onToggle();
  };

  return (
    <Animated.View
      entering={FadeIn.delay(index * 40).duration(300)}
      style={[animStyle, styles.containerMargin]}
    >
      <GlassCard noPadding style={{ borderRadius: GlassTheme.radius.xl }} accentColor={priority.color}>
        <View style={styles.container}>
          <Pressable onPress={handleToggle} style={styles.checkbox} hitSlop={15}>
            <View
              style={[
                styles.checkboxCircle,
                todo.completed && styles.checkboxCircleChecked,
                todo.completed && { borderColor: priority.color, backgroundColor: priority.color + '30' },
              ]}
            >
              {todo.completed && (
                <MaterialIcons name="check" size={14} color={priority.color} />
              )}
            </View>
          </Pressable>

          <Pressable
            onPress={onPress}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onLongPress();
            }}
            style={styles.content}
          >
            <Text
              style={[styles.title, todo.completed && styles.titleCompleted]}
              numberOfLines={2}
            >
              {todo.title || 'Untitled task'}
            </Text>

            {!!todo.description && (
              <Text style={styles.description} numberOfLines={1}>
                {todo.description}
              </Text>
            )}

            <View style={styles.meta}>
              <View style={[styles.priorityBadge, { backgroundColor: priority.color + '20' }]}>
                <Text style={[styles.priorityLabel, { color: priority.color }]}>
                  {priority.label}
                </Text>
              </View>

              {todo.dueDate && (
                <View style={styles.metaItem}>
                  <MaterialIcons
                    name="schedule"
                    size={11}
                    color={isOverdue ? GlassTheme.destructive : GlassTheme.textTertiary}
                  />
                  <Text
                    style={[
                      styles.metaText,
                      isOverdue ? { color: GlassTheme.destructive } : undefined,
                    ]}
                  >
                    {formatDate(todo.dueDate)}
                  </Text>
                </View>
              )}

              {todo.reminderAt && !todo.completed && (
                <View style={styles.metaItem}>
                  <MaterialIcons name="notifications" size={11} color={GlassTheme.accentPrimary} />
                  <Text style={[styles.metaText, { color: GlassTheme.accentPrimary }]}>
                    Reminder set
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
          
          <Pressable 
            onPress={onDelete} 
            style={styles.deleteButton}
            hitSlop={15}
          >
            <MaterialIcons name="delete-outline" size={20} color={GlassTheme.destructive} />
          </Pressable>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  containerMargin: {
    marginHorizontal: GlassTheme.spacing.md,
    marginVertical: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    padding: GlassTheme.spacing.md,
    paddingRight: GlassTheme.spacing.sm,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: GlassTheme.glassBorderFocused,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCircleChecked: {
    borderWidth: 2,
  },
  content: {
    flex: 1,
    paddingVertical: GlassTheme.spacing.md,
    paddingRight: GlassTheme.spacing.md,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: GlassTheme.textPrimary,
    lineHeight: 20,
  },
  titleCompleted: {
    color: GlassTheme.textTertiary,
    textDecorationLine: 'line-through',
  },
  description: {
    fontSize: 13,
    color: GlassTheme.textSecondary,
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: GlassTheme.radius.sm,
  },
  priorityLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaText: {
    fontSize: 11,
    color: GlassTheme.textTertiary,
    fontWeight: '500',
  },
  deleteButton: {
    padding: GlassTheme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
