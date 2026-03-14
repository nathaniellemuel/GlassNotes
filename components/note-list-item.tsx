import { StyleSheet, Text, View, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/components/glass-card';
import { GlassTheme } from '@/constants/theme';
import type { NotePreview } from '@/types/note';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type NoteListItemProps = {
  note: NotePreview;
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

export function NoteListItem({ note, onPress, onLongPress }: NoteListItemProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={handleLongPress}
      style={[styles.wrapper, animatedStyle]}
    >
      <GlassCard>
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
        <Text style={styles.date}>{formatDate(note.updatedAt)}</Text>
      </GlassCard>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: GlassTheme.spacing.md,
    marginBottom: GlassTheme.spacing.sm,
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
  },
  preview: {
    fontSize: 14,
    color: GlassTheme.textSecondary,
    marginTop: GlassTheme.spacing.xs,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: GlassTheme.textTertiary,
    marginTop: GlassTheme.spacing.sm,
  },
});
