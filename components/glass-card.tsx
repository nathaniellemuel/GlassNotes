import { BlurView } from 'expo-blur';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassTheme } from '@/constants/theme';

type GlassCardProps = ViewProps & {
  intensity?: number;
  noPadding?: boolean;
  accentColor?: string;
};

export function GlassCard({
  children,
  style,
  intensity = 65, // Increased default intensity for stronger glass effect
  noPadding = false,
  accentColor,
  ...props
}: GlassCardProps) {
  const borderStyle: ViewStyle = accentColor
    ? { borderLeftColor: accentColor, borderLeftWidth: 3 }
    : {};

  return (
    <View style={[styles.container, style]} {...props}>
      <BlurView
        intensity={intensity}
        tint={GlassTheme.blurTint}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.innerBorder, !noPadding && styles.padding, borderStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: GlassTheme.radius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 20, 25, 0.4)', // Richer base translucent layer
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)', // Stronger outer border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 5,
  },
  innerBorder: {
    flex: 1,
    borderRadius: GlassTheme.radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)', // Super subtle inner border reflection
  },
  padding: {
    padding: GlassTheme.spacing.md,
  },
});
