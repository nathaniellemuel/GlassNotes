import { StyleSheet, View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { GlassTheme } from '@/constants/theme';

export function EmptyState() {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.delay(100).duration(600)} style={styles.iconWrap}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="edit-note" size={48} color={GlassTheme.accentPrimary} />
        </View>
      </Animated.View>
      <Animated.Text entering={FadeInUp.delay(250).duration(500)} style={styles.title}>
        No notes yet
      </Animated.Text>
      <Animated.Text entering={FadeInUp.delay(400).duration(500)} style={styles.subtitle}>
        Tap + to create your first note
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  iconWrap: {
    marginBottom: GlassTheme.spacing.lg,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: GlassTheme.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: GlassTheme.textTertiary,
    marginTop: GlassTheme.spacing.sm,
  },
});
