import { StyleSheet, TextInput, View, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@/components/glass-card';
import { GlassTheme } from '@/constants/theme';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
};

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  return (
    <GlassCard noPadding style={styles.container}>
      <View style={styles.inner}>
        <MaterialIcons name="search" size={20} color={GlassTheme.textTertiary} />
        <TextInput
          style={styles.input}
          placeholder="Search notes..."
          placeholderTextColor={GlassTheme.textPlaceholder}
          value={value}
          onChangeText={onChangeText}
          selectionColor={GlassTheme.accentPrimary}
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChangeText('')} hitSlop={8}>
            <MaterialIcons name="close" size={18} color={GlassTheme.textTertiary} />
          </Pressable>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: GlassTheme.spacing.md,
    marginBottom: GlassTheme.spacing.md,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GlassTheme.spacing.md,
    paddingVertical: GlassTheme.spacing.sm + 2,
    gap: GlassTheme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: GlassTheme.textPrimary,
    padding: 0,
  },
});
