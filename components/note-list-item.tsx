import { StyleSheet, Text, View, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/components/glass-card';
import { GlassTheme } from '@/constants/theme';
import { NOTE_COLORS } from '@/types/note';
import type { NotePreview } from '@/types/note';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type NoteListItemProps = {
  note: NotePreview;
  index: number;
  onPress: () => void;
  onLongPress: () => void;
};

function formatDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function getNoteColor(colorId: string) {
  return NOTE_COLORS.find((c) => c.id === colorId) ?? NOTE_COLORS[0];
}

export function NoteListItem({ note, index, onPress, onLongPress }: NoteListItemProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress();
  };

  const noteColor = getNoteColor(note.colorId);
  const hasChecklist = note.checklistTotal > 0;

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400).springify()}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        style={[styles.wrapper, animatedStyle]}
      >
        <GlassCard accentColor={note.colorId !== 'default' ? noteColor.accent : undefined}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {note.title || 'Untitled'}
            </Text>
            {note.isPinned && (
              <MaterialIcons name="push-pin" size={14} color={GlassTheme.accentPrimary} />
            )}
          </View>

          {note.preview.length > 0 && (
            <Text style={styles.preview} numberOfLines={2}>
              {note.preview}
            </Text>
          )}

          {hasChecklist && (
            <View style={styles.checklistBadge}>
              <MaterialIcons
                name={note.checklistDone === note.checklistTotal ? 'check-circle' : 'radio-button-unchecked'}
                size={14}
                color={note.checklistDone === note.checklistTotal ? GlassTheme.success : GlassTheme.textTertiary}
              />
              <Text
                style={[
                  styles.checklistText,
                  note.checklistDone === note.checklistTotal && styles.checklistDone,
                ]}
              >
                {note.checklistDone}/{note.checklistTotal}
              </Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.date}>{formatDate(note.updatedAt)}</Text>
            {note.wordCount > 0 && (
              <Text style={styles.wordCount}>{note.wordCount} words</Text>
            )}
          </View>
        </GlassCard>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: GlassTheme.spacing.md,
    marginBottom: GlassTheme.spacing.sm + 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GlassTheme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: GlassTheme.textPrimary,
    letterSpacing: -0.2,
  },
  preview: {
    fontSize: 14,
    color: GlassTheme.textSecondary,
    marginTop: GlassTheme.spacing.xs + 2,
    lineHeight: 20,
  },
  checklistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: GlassTheme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: GlassTheme.radius.full,
  },
  checklistText: {
    fontSize: 12,
    color: GlassTheme.textTertiary,
    fontWeight: '500',
  },
  checklistDone: {
    color: GlassTheme.success,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: GlassTheme.spacing.sm,
  },
  date: {
    fontSize: 12,
    color: GlassTheme.textTertiary,
  },
  wordCount: {
    fontSize: 12,
    color: GlassTheme.textTertiary,
  },
});
