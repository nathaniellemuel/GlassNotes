import { StyleSheet, Pressable, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/components/glass-card';
import { GlassTheme } from '@/constants/theme';

type FormattingToolbarProps = {
  onBold: () => void;
  onItalic: () => void;
  onHeading: () => void;
  onBullet: () => void;
  onChecklist: () => void;
  onDivider: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ToolbarButton({
  icon,
  onPress,
  color,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  color?: string;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.8, { damping: 10, stiffness: 400 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    }, 80);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[styles.button, animStyle]}
      hitSlop={4}
    >
      <MaterialIcons name={icon} size={21} color={color ?? GlassTheme.textSecondary} />
    </AnimatedPressable>
  );
}

export function FormattingToolbar({
  onBold,
  onItalic,
  onHeading,
  onBullet,
  onChecklist,
  onDivider,
}: FormattingToolbarProps) {
  return (
    <GlassCard noPadding style={styles.container}>
      <View style={styles.inner}>
        <ToolbarButton icon="format-bold" onPress={onBold} />
        <ToolbarButton icon="format-italic" onPress={onItalic} />
        <ToolbarButton icon="title" onPress={onHeading} />
        <View style={styles.separator} />
        <ToolbarButton icon="format-list-bulleted" onPress={onBullet} />
        <ToolbarButton icon="check-box" onPress={onChecklist} color={GlassTheme.accentPrimary} />
        <View style={styles.separator} />
        <ToolbarButton icon="horizontal-rule" onPress={onDivider} />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: GlassTheme.spacing.md,
    marginBottom: GlassTheme.spacing.sm,
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
