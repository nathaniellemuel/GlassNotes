import { BlurView } from 'expo-blur';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { GlassTheme } from '@/constants/theme';

type GlassCardProps = ViewProps & {
  intensity?: number;
  noPadding?: boolean;
};

export function GlassCard({
  children,
  style,
  intensity = GlassTheme.blurIntensity,
  noPadding = false,
  ...props
}: GlassCardProps) {
  return (
    <View style={[styles.container, style]} {...props}>
      <BlurView
        intensity={intensity}
        tint={GlassTheme.blurTint}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.innerBorder, !noPadding && styles.padding]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: GlassTheme.radius.lg,
    overflow: 'hidden',
    backgroundColor: GlassTheme.glassBackground,
  },
  innerBorder: {
    flex: 1,
    borderRadius: GlassTheme.radius.lg,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
  },
  padding: {
    padding: GlassTheme.spacing.md,
  },
});
