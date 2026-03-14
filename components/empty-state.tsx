import { StyleSheet, View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassTheme } from '@/constants/theme';

export function EmptyState() {
  return (
    <View style={styles.container}>
      <MaterialIcons name="edit-note" size={72} color={GlassTheme.textTertiary} />
      <Text style={styles.title}>No notes yet</Text>
      <Text style={styles.subtitle}>Tap + to create your first note</Text>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: GlassTheme.textSecondary,
    marginTop: GlassTheme.spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: GlassTheme.textTertiary,
    marginTop: GlassTheme.spacing.sm,
  },
});
