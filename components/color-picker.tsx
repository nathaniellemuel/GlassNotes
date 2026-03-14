import { StyleSheet, View, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GlassTheme } from '@/constants/theme';
import { NOTE_COLORS, type NoteColorId } from '@/types/note';

type ColorPickerProps = {
  selected: NoteColorId;
  onSelect: (id: NoteColorId) => void;
};

export function ColorPicker({ selected, onSelect }: ColorPickerProps) {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
      {NOTE_COLORS.map((color) => (
        <Pressable
          key={color.id}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(color.id);
          }}
          style={[
            styles.color,
            {
              backgroundColor: color.color,
              borderColor: selected === color.id ? color.accent : 'transparent',
            },
          ]}
        >
          {selected === color.id && (
            <MaterialIcons name="check" size={16} color={color.accent} />
          )}
        </Pressable>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: GlassTheme.spacing.sm,
    paddingHorizontal: GlassTheme.spacing.lg,
    paddingVertical: GlassTheme.spacing.sm,
  },
  color: {
    width: 32,
    height: 32,
    borderRadius: GlassTheme.radius.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
