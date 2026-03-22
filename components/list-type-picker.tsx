import React from 'react';
import { StyleSheet, Pressable, View, Text, Animated } from 'react-native';
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
  const scaleAnim = new Animated.Value(visible ? 1 : 0.8);
  const opacityAnim = new Animated.Value(visible ? 1 : 0);

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
  }, [visible]);

  if (!visible) return null;

  const handleSelect = (type: ListType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(type);
    onClose();
  };

  return (
    <>
      {/* Backdrop - close on press */}
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        pointerEvents={visible ? 'auto' : 'none'}
      />

      {/* Popover - above toolbar */}
      <Animated.View
        style={[
          styles.popover,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            pointerEvents: visible ? 'auto' : 'none',
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
                  name={option.icon}
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
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
  },
  popover: {
    position: 'absolute',
    bottom: 70,
    left: GlassTheme.spacing.lg,
    right: GlassTheme.spacing.lg,
    zIndex: 45,
    backgroundColor: GlassTheme.glassBackground,
    borderRadius: GlassTheme.radius.lg,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  card: {
    padding: GlassTheme.spacing.md,
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
    backgroundColor: `${GlassTheme.accentPrimary}15`,
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
