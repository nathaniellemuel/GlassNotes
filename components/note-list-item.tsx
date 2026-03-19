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
  width?: number;
  onPress: () => void;
  onLongPress: (event: any) => void;
  onMenuPress?: () => void;
  onItemTouchMove?: (event: any) => void;
  onItemTouchEnd?: (event: any) => void;
  isDragging?: boolean;
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

export function NoteListItem({
  note,
  index,
  width,
  onPress,
  onLongPress,
  onMenuPress,
  onItemTouchMove,
  onItemTouchEnd,
  isDragging,
}: NoteListItemProps) {
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

  const handleLongPress = (event: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress(event);
  };

  const noteColor = getNoteColor(note.colorId);
  const hasChecklist = note.checklistTotal > 0;

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400).springify()} style={{ width }}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        onTouchMove={onItemTouchMove}
        onTouchEnd={onItemTouchEnd}
        style={[styles.wrapper, animatedStyle, isDragging && { opacity: 0.35 }]}
      >
        <GlassCard accentColor={note.colorId !== 'default' ? noteColor.accent : undefined} style={{ borderRadius: GlassTheme.radius.xxl }}>
          <View style={styles.innerContainer}>
            <View style={styles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <MaterialIcons name="description" size={18} color="rgba(255, 255, 255, 0.9)" />
                <Text style={styles.title} numberOfLines={2}>
                  {note.title || 'Untitled'}
                </Text>
              </View>
              <View style={styles.headerActions}>
                {note.isPinned && (
                  <MaterialIcons name="push-pin" size={14} color={GlassTheme.accentPrimary} />
                )}
                {onMenuPress ? (
                  <Pressable onPress={onMenuPress} hitSlop={12}>
                    <MaterialIcons name="more-horiz" size={22} color="rgba(255, 255, 255, 0.6)" />
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={styles.centerContent}>
              <MaterialIcons name="description" size={48} color="rgba(255, 255, 255, 0.15)" />
            </View>
          </View>
        </GlassCard>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedStyle: {
    // animated styles apply here
  },
  wrapper: {
    marginBottom: GlassTheme.spacing.md,
  },
  innerContainer: {
    height: 110, // Match the height of folder card for a uniform compact grid
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: GlassTheme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: GlassTheme.textPrimary,
    letterSpacing: -0.2,
  },
  centerContent: {
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
