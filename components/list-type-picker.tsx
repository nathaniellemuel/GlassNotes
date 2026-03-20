import { StyleSheet, Pressable, View, Text, Modal, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/components/glass-card';
import { GlassTheme } from '@/constants/theme';

export type ListType = 'bullet' | 'number' | 'dash' | 'roman';

interface ListTypeOption {
  id: ListType;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  prefix: string;
}

const LIST_OPTIONS: ListTypeOption[] = [
  { id: 'bullet', label: 'Bullet', icon: 'circle', prefix: '•' },
  { id: 'number', label: '123', icon: 'looks-one', prefix: '1.' },
  { id: 'dash', label: 'Dash', icon: 'remove', prefix: '—' },
  { id: 'roman', label: 'Roman', icon: 'text-fields', prefix: 'i.' },
];

interface ListTypePickerProps {
  visible: boolean;
  currentType?: ListType;
  onSelect: (type: ListType) => void;
  onClose: () => void;
}

export function ListTypePicker({
  visible,
  currentType = 'bullet',
  onSelect,
  onClose,
}: ListTypePickerProps) {
  const handleSelect = (type: ListType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(type);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
      >
        <View style={styles.centerContainer}>
          <Pressable style={styles.container} onPress={e => e.stopPropagation()}>
            <GlassCard style={styles.card}>
              <Text style={styles.title}>List Type</Text>
              <View style={styles.options}>
                {LIST_OPTIONS.map((option) => (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.option,
                      currentType === option.id && styles.optionActive,
                    ]}
                    onPress={() => handleSelect(option.id)}
                  >
                    <MaterialIcons
                      name={option.icon}
                      size={24}
                      color={
                        currentType === option.id
                          ? GlassTheme.accentPrimary
                          : GlassTheme.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.optionLabel,
                        currentType === option.id && styles.optionLabelActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {currentType === option.id && (
                      <MaterialIcons
                        name="check"
                        size={20}
                        color={GlassTheme.accentPrimary}
                        style={styles.checkmark}
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            </GlassCard>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: GlassTheme.spacing.md,
  },
  container: {
    width: '100%',
    maxWidth: 300,
  },
  card: {
    padding: GlassTheme.spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: GlassTheme.textPrimary,
    marginBottom: GlassTheme.spacing.md,
  },
  options: {
    gap: GlassTheme.spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: GlassTheme.spacing.md,
    borderRadius: GlassTheme.radius.md,
    backgroundColor: GlassTheme.glassBackground,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
  },
  optionActive: {
    backgroundColor: `${GlassTheme.accentPrimary}15`,
    borderColor: GlassTheme.accentPrimary,
  },
  optionLabel: {
    fontSize: 14,
    color: GlassTheme.textSecondary,
    marginLeft: GlassTheme.spacing.md,
    flex: 1,
  },
  optionLabelActive: {
    color: GlassTheme.accentPrimary,
    fontWeight: '600',
  },
  checkmark: {
    marginLeft: 'auto',
  },
});
