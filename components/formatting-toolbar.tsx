import { StyleSheet, Pressable, View, Text } from 'react-native';
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
  label,
  onAction,
  onLongPress,
  color,
}: {
  icon?: keyof typeof MaterialIcons.glyphMap;
  label?: string;
  onAction: () => void;
  onLongPress?: () => void;
  color?: string;
}) {
  const scale = useSharedValue(1);
  const longPressTimer = useRef<NodeJS.Timeout>();

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
      {icon ? (
        <MaterialIcons name={icon} size={21} color={color ?? GlassTheme.textSecondary} />
      ) : (
        <Text style={[styles.buttonText, { color: color ?? GlassTheme.textSecondary }]}>
          {label}
        </Text>
      )}
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
        <ToolbarButton label="AI" onAction={onAI} color={GlassTheme.accentPrimary} />
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
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: GlassTheme.glassBorder,
    marginHorizontal: 4,
  },
});
