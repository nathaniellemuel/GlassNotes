const fs = require('fs');
const content = `import React from 'react';
import { StyleSheet, Pressable, View, Text, Animated, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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
  const scaleAnim = React.useRef(new Animated.Value(visible ? 1 : 0.8)).current;
  const opacityAnim = React.useRef(new Animated.Value(visible ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: visible ? 1 : 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: visible ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, scaleAnim, opacityAnim]);

  const handleSelect = (type: ListType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(type);
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.cardWrapper,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={styles.card}>
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
                    name={option.icon as any}
                    size={20}
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
                      size={16}
                      color={GlassTheme.accentPrimary}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardWrapper: {
    paddingHorizontal: GlassTheme.spacing.lg,
    paddingBottom: 80,
    zIndex: 50,
  },
  card: {
    padding: GlassTheme.spacing.md,
    backgroundColor: 'rgba(25, 25, 25, 0.98)',
    borderRadius: GlassTheme.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 24,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: GlassTheme.textTertiary,
    marginBottom: GlassTheme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  options: {
    gap: GlassTheme.spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GlassTheme.spacing.md,
    paddingVertical: GlassTheme.spacing.sm,
    borderRadius: GlassTheme.radius.md,
    gap: GlassTheme.spacing.sm,
  },
  optionActive: {
    backgroundColor: \`\${GlassTheme.accentPrimary}15\`,
  },
  optionLabel: {
    fontSize: 13,
    color: GlassTheme.textSecondary,
    flex: 1,
    fontWeight: '500',
  },
  optionLabelActive: {
    color: GlassTheme.accentPrimary,
    fontWeight: '600',
  },
});
`;

fs.writeFileSync('components/list-type-picker.tsx', content);
console.log('Fixed list type picker');
