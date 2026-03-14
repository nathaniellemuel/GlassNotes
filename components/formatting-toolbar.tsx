import { StyleSheet, Pressable, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/components/glass-card';
import { GlassTheme } from '@/constants/theme';

type FormattingToolbarProps = {
  onBold: () => void;
  onItalic: () => void;
  onHeading: () => void;
};

function ToolbarButton({
  icon,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
}) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      hitSlop={4}
    >
      <MaterialIcons name={icon} size={22} color={GlassTheme.textSecondary} />
    </Pressable>
  );
}

export function FormattingToolbar({ onBold, onItalic, onHeading }: FormattingToolbarProps) {
  return (
    <GlassCard noPadding style={styles.container}>
      <View style={styles.inner}>
        <ToolbarButton icon="format-bold" onPress={onBold} />
        <ToolbarButton icon="format-italic" onPress={onItalic} />
        <View style={styles.separator} />
        <ToolbarButton icon="title" onPress={onHeading} />
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
    paddingHorizontal: GlassTheme.spacing.md,
    paddingVertical: GlassTheme.spacing.sm,
    gap: GlassTheme.spacing.xs,
  },
  button: {
    width: 40,
    height: 36,
    borderRadius: GlassTheme.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: GlassTheme.glassBorder,
    marginHorizontal: GlassTheme.spacing.xs,
  },
});
