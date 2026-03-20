import { StyleSheet, Pressable, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/components/glass-card';
import { GlassTheme } from '@/constants/theme';
import { useRef } from 'react';

type FormattingToolbarProps = {
  onBold: () => void;
  onItalic: () => void;
  onUppercase: () => void;
  onBullet: () => void;
  onBulletLongPress?: () => void;
  onChecklist: () => void;
  onPhoto: () => void;
  onTextColor: () => void;
  onAI: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ToolbarButton({
  icon,
  onAction,
  onLongPress,
  color,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  onAction: () => void;
  onLongPress?: () => void;
  color?: string;
}) {
  const scale = useSharedValue(1);
  const longPressTimer = useRef<NodeJS.Timeout>();

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // IMPORTANT: Use onPressIn, not onPress.
  // On Android, tapping a button blurs the TextInput first ("blur" fires before "press").
  // onPressIn fires while the input is still focused, so selectionRef is still accurate.
  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.78, { damping: 10, stiffness: 400 });

    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress();
      }, 500);
    } else {
      onAction();
    }
  };

  const handlePressOut = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = undefined;
    }
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = undefined;
        }
        onAction();
      }}
      style={[styles.button, animStyle]}
      hitSlop={6}
    >
      <MaterialIcons name={icon} size={21} color={color ?? GlassTheme.textSecondary} />
    </AnimatedPressable>
  );
}

export function FormattingToolbar({
  onBold,
  onItalic,
  onUppercase,
  onBullet,
  onBulletLongPress,
  onChecklist,
  onPhoto,
  onTextColor,
  onAI,
}: FormattingToolbarProps) {
  return (
    <GlassCard noPadding style={styles.container}>
      <View style={styles.inner}>
        <ToolbarButton icon="format-bold" onAction={onBold} />
        <ToolbarButton icon="format-italic" onAction={onItalic} />
        <ToolbarButton icon="title" onAction={onUppercase} />
        <View style={styles.separator} />
        <ToolbarButton icon="palette" onAction={onTextColor} color={GlassTheme.accentSecondary} />
        <View style={styles.separator} />
        <ToolbarButton
          icon="format-list-bulleted"
          onAction={onBullet}
          onLongPress={onBulletLongPress}
        />
        <ToolbarButton icon="check-box" onAction={onChecklist} color={GlassTheme.accentPrimary} />
        <View style={styles.separator} />
        <ToolbarButton icon="auto-fix-high" onAction={onAI} color={GlassTheme.accentPrimary} />
        <ToolbarButton icon="add-a-photo" onAction={onPhoto} color={GlassTheme.accentPrimary} />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: GlassTheme.spacing.md,
    marginBottom: GlassTheme.spacing.md, // Increased from sm to md for better breathing room
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GlassTheme.spacing.sm,
    paddingVertical: GlassTheme.spacing.sm,
    gap: 2,
  },
  button: {
    width: 38,
    height: 36,
    borderRadius: GlassTheme.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: GlassTheme.glassBorder,
    marginHorizontal: 4,
  },
});
