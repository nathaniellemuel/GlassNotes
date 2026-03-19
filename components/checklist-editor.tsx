import { StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GlassTheme } from '@/constants/theme';
import { generateId } from '@/utils/id';
import type { ChecklistItem } from '@/types/note';

type ChecklistEditorProps = {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
};

export function ChecklistEditor({ items, onChange }: ChecklistEditorProps) {
  const toggleItem = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  };

  const updateText = (id: string, text: string) => {
    onChange(items.map((i) => (i.id === id ? { ...i, text } : i)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  const addItem = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange([...items, { id: generateId(), text: '', checked: false }]);
  };

  const handleSubmitEditing = (index: number) => {
    if (index === items.length - 1) {
      addItem();
    }
  };

  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="checklist" size={16} color={GlassTheme.textTertiary} />
        <Text style={styles.headerText}>Checklist</Text>
        <Text style={styles.count}>
          {items.filter((i) => i.checked).length}/{items.length}
        </Text>
      </View>

      {items.map((item, index) => (
        <Animated.View
          key={item.id}
          entering={FadeInDown.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={LinearTransition.springify()}
          style={styles.item}
        >
          <Pressable onPress={() => toggleItem(item.id)} hitSlop={4}>
            <MaterialIcons
              name={item.checked ? 'check-circle' : 'radio-button-unchecked'}
              size={22}
              color={item.checked ? GlassTheme.success : GlassTheme.textTertiary}
            />
          </Pressable>
          <TextInput
            style={[styles.input, item.checked && styles.inputChecked]}
            value={item.text}
            onChangeText={(text) => updateText(item.id, text)}
            placeholder="Todo item..."
            placeholderTextColor={GlassTheme.textPlaceholder}
            selectionColor={GlassTheme.accentPrimary}
            returnKeyType="next"
            onSubmitEditing={() => handleSubmitEditing(index)}
            blurOnSubmit={false}
          />
          <Pressable onPress={() => removeItem(item.id)} hitSlop={8}>
            <MaterialIcons name="close" size={16} color={GlassTheme.textTertiary} />
          </Pressable>
        </Animated.View>
      ))}

      <Pressable onPress={addItem} style={styles.addButton}>
        <MaterialIcons name="add" size={18} color={GlassTheme.accentPrimary} />
        <Text style={[styles.addText, { color: GlassTheme.accentPrimary }]}>Add item</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: GlassTheme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: GlassTheme.radius.lg,
    padding: GlassTheme.spacing.md,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: GlassTheme.spacing.sm,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: GlassTheme.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  count: {
    fontSize: 12,
    color: GlassTheme.textTertiary,
    fontWeight: '500',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GlassTheme.spacing.sm,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: GlassTheme.textPrimary,
    paddingVertical: 2,
  },
  inputChecked: {
    color: GlassTheme.textTertiary,
    textDecorationLine: 'line-through',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: GlassTheme.spacing.sm,
    marginTop: 4,
  },
  addText: {
    fontSize: 14,
    color: GlassTheme.accentPrimary,
    fontWeight: '500',
  },
});
