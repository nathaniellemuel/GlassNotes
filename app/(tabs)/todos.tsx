import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GlassTheme } from '@/constants/theme';
import { useTodos } from '@/hooks/use-todos';
import { TodoItem } from '@/components/todo-item';
import { TODO_PRIORITIES } from '@/types/todo';
import type { Todo, TodoPriority } from '@/types/todo';
import { generateId } from '@/utils/id';
import { requestPermissions } from '@/hooks/use-notifications';

type FilterType = 'all' | 'active' | 'completed';

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Done' },
];

export default function TodosScreen() {
  const insets = useSafeAreaInsets();
  const { filteredTodos, isLoading, filter, setFilter, loadTodos, saveTodo, toggleTodo, deleteTodo } =
    useTodos();

  const [showModal, setShowModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState<TodoPriority>('medium');
  const [formDueDate, setFormDueDate] = useState('');
  const [formReminder, setFormReminder] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadTodos();
    }, [loadTodos]),
  );

  const openCreateModal = () => {
    setEditingTodo(null);
    setFormTitle('');
    setFormDesc('');
    setFormPriority('medium');
    setFormDueDate('');
    setFormReminder('');
    setShowModal(true);
  };

  const openEditModal = (todo: Todo) => {
    setEditingTodo(todo);
    setFormTitle(todo.title);
    setFormDesc(todo.description);
    setFormPriority(todo.priority);
    setFormDueDate(todo.dueDate ? new Date(todo.dueDate).toISOString().slice(0, 10) : '');
    setFormReminder(
      todo.reminderAt
        ? new Date(todo.reminderAt).toISOString().slice(0, 16).replace('T', ' ')
        : '',
    );
    setShowModal(true);
  };

  const parseDateInput = (input: string): number | undefined => {
    if (!input.trim()) return undefined;
    const d = new Date(input.trim());
    return isNaN(d.getTime()) ? undefined : d.getTime();
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Please enter a task title.');
      return;
    }
    const hasReminder = !!formReminder.trim();
    if (hasReminder) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert('Notifications Disabled', 'Enable notifications in settings to use reminders.');
      }
    }

    const todo: Todo = {
      id: editingTodo?.id ?? generateId(),
      title: formTitle.trim(),
      description: formDesc.trim(),
      completed: editingTodo?.completed ?? false,
      priority: formPriority,
      colorId: 'default',
      dueDate: parseDateInput(formDueDate),
      reminderAt: parseDateInput(formReminder),
      createdAt: editingTodo?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    await saveTodo(todo);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowModal(false);
  };

  const handleLongPress = (todo: Todo) => {
    Alert.alert(todo.title, undefined, [
      { text: 'Edit', onPress: () => openEditModal(todo) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete Task', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                deleteTodo(todo.id);
              },
            },
          ]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const completedCount = filteredTodos.filter((t) => t.completed).length;
  const totalCount = filteredTodos.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(245, 158, 11, 0.06)', 'transparent']}
        style={styles.gradient}
      />

      <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>To-Do</Text>
          <Text style={styles.headerSubtitle}>
            {completedCount}/{totalCount} completed
          </Text>
        </View>
      </Animated.View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setFilter(tab.key)}
            style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
          >
            <Text style={[styles.filterLabel, filter === tab.key && styles.filterLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filteredTodos}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TodoItem
            todo={item}
            index={index}
            onToggle={() => toggleTodo(item.id)}
            onPress={() => openEditModal(item)}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        contentContainerStyle={[styles.listContent, filteredTodos.length === 0 && styles.listEmpty]}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="checklist" size={48} color={GlassTheme.textTertiary} />
              <Text style={styles.emptyTitle}>No tasks yet</Text>
              <Text style={styles.emptySubtitle}>Tap + to add your first task</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadTodos}
            tintColor={GlassTheme.accentPrimary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <Pressable
        onPress={openCreateModal}
        style={styles.fab}
      >
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          style={styles.fabGradient}
        >
          <MaterialIcons name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </Pressable>

      {/* Create/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent presentationStyle="overFullScreen">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowModal(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingTodo ? 'Edit Task' : 'New Task'}
              </Text>

              <Text style={styles.fieldLabel}>Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="What needs to be done?"
                placeholderTextColor={GlassTheme.textPlaceholder}
                value={formTitle}
                onChangeText={setFormTitle}
                selectionColor={GlassTheme.accentPrimary}
                autoFocus
              />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textInputMulti]}
                placeholder="Add details..."
                placeholderTextColor={GlassTheme.textPlaceholder}
                value={formDesc}
                onChangeText={setFormDesc}
                selectionColor={GlassTheme.accentPrimary}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.fieldLabel}>Priority</Text>
              <View style={styles.priorityRow}>
                {TODO_PRIORITIES.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => setFormPriority(p.id)}
                    style={[
                      styles.priorityBtn,
                      { borderColor: p.color + '60' },
                      formPriority === p.id && { backgroundColor: p.color + '25', borderColor: p.color },
                    ]}
                  >
                    <Text style={[styles.priorityBtnText, { color: p.color }]}>
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Due Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 2026-03-20"
                placeholderTextColor={GlassTheme.textPlaceholder}
                value={formDueDate}
                onChangeText={setFormDueDate}
                selectionColor={GlassTheme.accentPrimary}
                keyboardType="default"
              />

              <Text style={styles.fieldLabel}>Reminder (YYYY-MM-DD HH:MM)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 2026-03-20 09:00"
                placeholderTextColor={GlassTheme.textPlaceholder}
                value={formReminder}
                onChangeText={setFormReminder}
                selectionColor={GlassTheme.accentPrimary}
              />

              <View style={styles.modalActions}>
                <Pressable onPress={() => setShowModal(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleSave} style={styles.saveBtn}>
                  <LinearGradient
                    colors={[GlassTheme.accentPrimary, GlassTheme.accentSecondary]}
                    style={styles.saveBtnGradient}
                  >
                    <Text style={styles.saveBtnText}>
                      {editingTodo ? 'Save Changes' : 'Add Task'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlassTheme.backgroundPrimary,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  header: {
    paddingHorizontal: GlassTheme.spacing.lg,
    paddingTop: GlassTheme.spacing.lg,
    paddingBottom: GlassTheme.spacing.md,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: GlassTheme.textPrimary,
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: GlassTheme.textTertiary,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: GlassTheme.spacing.md,
    gap: 8,
    marginBottom: GlassTheme.spacing.sm,
  },
  filterTab: {
    paddingHorizontal: GlassTheme.spacing.md,
    paddingVertical: 6,
    borderRadius: GlassTheme.radius.full,
    backgroundColor: GlassTheme.glassBackground,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
  },
  filterTabActive: {
    backgroundColor: '#F59E0B20',
    borderColor: '#F59E0B60',
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: GlassTheme.textTertiary,
  },
  filterLabelActive: {
    color: '#F59E0B',
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: 4,
  },
  listEmpty: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GlassTheme.textSecondary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: GlassTheme.textTertiary,
  },
  fab: {
    position: 'absolute',
    right: GlassTheme.spacing.lg,
    bottom: 80,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    backgroundColor: GlassTheme.backgroundElevated,
    borderTopLeftRadius: GlassTheme.radius.xxl,
    borderTopRightRadius: GlassTheme.radius.xxl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: GlassTheme.glassBorder,
    paddingHorizontal: GlassTheme.spacing.lg,
    paddingTop: GlassTheme.spacing.sm,
    paddingBottom: GlassTheme.spacing.xxl,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: GlassTheme.glassBorderFocused,
    alignSelf: 'center',
    marginBottom: GlassTheme.spacing.md,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: GlassTheme.textPrimary,
    marginBottom: GlassTheme.spacing.lg,
    letterSpacing: -0.4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: GlassTheme.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: GlassTheme.spacing.sm,
  },
  textInput: {
    backgroundColor: GlassTheme.glassBackground,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    borderRadius: GlassTheme.radius.md,
    paddingHorizontal: GlassTheme.spacing.md,
    paddingVertical: GlassTheme.spacing.sm + 2,
    fontSize: 15,
    color: GlassTheme.textPrimary,
  },
  textInputMulti: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: GlassTheme.spacing.sm,
    borderRadius: GlassTheme.radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  priorityBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: GlassTheme.spacing.xl,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: GlassTheme.spacing.md,
    borderRadius: GlassTheme.radius.md,
    alignItems: 'center',
    backgroundColor: GlassTheme.glassBackground,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: GlassTheme.textSecondary,
  },
  saveBtn: {
    flex: 2,
    borderRadius: GlassTheme.radius.md,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    paddingVertical: GlassTheme.spacing.md,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
