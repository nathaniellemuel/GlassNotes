import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GlassTheme } from '@/constants/theme';

export const TEXT_COLORS = [
  { id: 'default', label: 'Default', color: '#FFFFFF' },
  { id: 'red', label: 'Red', color: '#EF4444' },
  { id: 'orange', label: 'Orange', color: '#F97316' },
  { id: 'yellow', label: 'Yellow', color: '#EAB308' },
  { id: 'green', label: 'Green', color: '#22C55E' },
  { id: 'blue', label: 'Blue', color: '#3B82F6' },
  { id: 'purple', label: 'Purple', color: '#A855F7' },
  { id: 'pink', label: 'Pink', color: '#EC4899' },
  { id: 'cyan', label: 'Cyan', color: '#06B6D4' },
  { id: 'gray', label: 'Gray', color: '#9CA3AF' },
] as const;

export type TextColorId = typeof TEXT_COLORS[number]['id'];

type TextColorPickerProps = {
  selected?: TextColorId;
  onSelect: (id: TextColorId) => void;
  onClose: () => void;
};

export function TextColorPicker({ selected, onSelect, onClose }: TextColorPickerProps) {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="palette" size={16} color={GlassTheme.textSecondary} />
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TEXT_COLORS.map((color) => (
          <Pressable
            key={color.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(color.id);
            }}
            style={[
              styles.colorButton,
              {
                backgroundColor: color.color + '20', // 20% opacity background
                borderColor: selected === color.id ? color.color : 'transparent',
              },
            ]}
          >
            <View style={[styles.colorDot, { backgroundColor: color.color }]} />
            {selected === color.id && (
              <View style={styles.checkmark}>
                <MaterialIcons name="check" size={12} color="#FFFFFF" />
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: GlassTheme.glassBackground,
    borderRadius: 16,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
  },
  header: {
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  scrollContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
