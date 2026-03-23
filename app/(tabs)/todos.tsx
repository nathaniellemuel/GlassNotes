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
import { BlurView } from 'expo-blur';
import { GlassTheme } from '@/constants/theme';
import { useTodos } from '@/hooks/use-todos';
import { TodoItem } from '@/components/todo-item';
import { TODO_PRIORITIES } from '@/types/todo';
import type { Todo, TodoPriority } from '@/types/todo';
import { generateId } from '@/utils/id';
import { requestPermissions } from '@/hooks/use-notifications';
import { processWithAI } from '@/utils/ai-client';

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
  const [itemToDelete, setItemToDelete] = useState<Todo | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState<TodoPriority>('medium');
  const [formDueDate, setFormDueDate] = useState('');
  const [formReminder, setFormReminder] = useState('');

  // AI Modal state
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);

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

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      Alert.alert('Please describe the task list you want to generate.');
      return;
    }

    setIsProcessingAI(true);
    try {
      const result = await processWithAI(aiPrompt, 'todo');
      if (result.success && result.data) {
        let tasks = [];
        try {
          // Attempt to parse the response inside the result
          let rawData = result.data;
          
          // Sometimes LLMs wrap json inside ```json ... ``` blocks even if instructed not to.
          // Try to clean it gently if needed:
          rawData = rawData.replace(/```json/gi, '').replace(/```/g, '').trim();

          tasks = JSON.parse(rawData);
          if (!Array.isArray(tasks)) {
            tasks = [tasks]; // just in case it returns a single object
          }
        } catch (err) {
          console.error("Failed to parse AI output:", result.data);
          Alert.alert('Error', 'Failed to read the generated tasks. Please try again.');
          setIsProcessingAI(false);
          return;
        }

        // Save each task
        for (const task of tasks) {
          if (!task.title) continue;
          
          let priority = 'medium';
          if (['low', 'medium', 'high'].includes(task.priority?.toLowerCase())) {
            priority = task.priority.toLowerCase();
          }

          const todo: Todo = {
            id: generateId(),
            title: task.title.trim(),
            description: task.description?.trim() || '',
            completed: false,
            priority: priority as TodoPriority,
            colorId: 'default',
            dueDate: undefined,
            reminderAt: undefined,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await saveTodo(todo);
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAiPrompt('');
        setShowAIModal(false);
      } else {
        Alert.alert('AI Error', result.error || 'Failed to generate tasks.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleLongPress = (todo: Todo) => {
    Alert.alert(todo.title, undefined, [
      { text: 'Edit', onPress: () => openEditModal(todo) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setItemToDelete(todo);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const completedCount = filteredTodos.filter((t) => t.completed).length;
  const totalCount = filteredTodos.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: GlassTheme.backgroundPrimary }]}>
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
            style={[
              styles.filterTab, 
              filter === tab.key && { backgroundColor: GlassTheme.accentPrimary + '20', borderColor: GlassTheme.accentPrimary + '60' }
            ]}
          >
            <Text style={[
              styles.filterLabel, 
              filter === tab.key && { color: GlassTheme.accentPrimary }
            ]}>
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
            onDelete={() => {
              setItemToDelete(item);
            }}
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

      {/* AI Generate FAB */}
      <Pressable
        onPress={() => setShowAIModal(true)}
        style={[styles.fab, { bottom: insets.bottom + 154, backgroundColor: 'transparent' }]}
      >
        <View style={{ flex: 1, borderRadius: 25, overflow: 'hidden' }}>
          <BlurView intensity={40} tint="dark" style={styles.fabBlur}>
            <View style={styles.aiFabInner}>
              <MaterialIcons name="auto-awesome" size={24} color={GlassTheme.accentPrimary} />
            </View>
          </BlurView>
        </View>
      </Pressable>

      {/* FAB */}
      <Pressable
        onPress={openCreateModal}
        style={[styles.fab, { bottom: insets.bottom + 86 }]}
      >
        <LinearGradient
          colors={[GlassTheme.accentPrimary, GlassTheme.accentSecondary]}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialIcons name="add" size={24} color={GlassTheme.accentText} />
        </LinearGradient>
      </Pressable>

      {/* AI Generate Modal */}
      <Modal visible={showAIModal} animationType="slide" transparent presentationStyle="overFullScreen">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => !isProcessingAI && setShowAIModal(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <MaterialIcons name="auto-awesome" size={24} color={GlassTheme.accentPrimary} />
                <Text style={[styles.modalTitle, { marginBottom: 0 }]}>Smart To-Do (AI)</Text>
              </View>

              <Text style={styles.fieldLabel}>What needs to be done?</Text>
              <TextInput
                style={[styles.textInput, styles.textInputMulti]}
                placeholder="E.g., Plan a 3-day trip to Bali, clean the house, or prepare for the math exam"
                placeholderTextColor={GlassTheme.textPlaceholder}
                value={aiPrompt}
                onChangeText={setAiPrompt}
                selectionColor={GlassTheme.accentPrimary}
                multiline
                numberOfLines={4}
                editable={!isProcessingAI}
                autoFocus
              />

              <View style={styles.modalActions}>
                <Pressable onPress={() => setShowAIModal(false)} style={styles.cancelBtn} disabled={isProcessingAI}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleGenerateAI} style={[styles.saveBtn, isProcessingAI && { opacity: 0.6 }]} disabled={isProcessingAI}>
                  <LinearGradient
                    colors={[GlassTheme.accentPrimary, GlassTheme.accentSecondary]}
                    style={styles.saveBtnGradient}
                  >
                    <Text style={styles.saveBtnText}>
                      {isProcessingAI ? 'Generating...' : 'Generate Magic'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Create/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent presentationStyle="overFullScreen">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowModal(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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

      {/* Delete Confirmation Modal */}
      <Modal visible={!!itemToDelete} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setItemToDelete(null)} />
          <View style={[styles.modalSheet, { maxHeight: 'auto', paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Delete Task</Text>
            <Text style={{ fontSize: 15, color: GlassTheme.textSecondary, marginBottom: 24, lineHeight: 22 }}>
              Are you sure you want to delete
              <Text style={{ fontWeight: 'bold', color: GlassTheme.textPrimary }}> "{itemToDelete?.title}"</Text>?
              This action cannot be undone.
            </Text>
            
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setItemToDelete(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalDanger}
                onPress={() => {
                  if (itemToDelete) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    deleteTodo(itemToDelete.id);
                    setItemToDelete(null);
                  }
                }}
              >
                <Text style={styles.modalDangerText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: GlassTheme.textTertiary,
  },
  listContent: {
    paddingBottom: 160,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    ...GlassTheme.shadowPrimary,
  },
  fabBlur: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  aiFabInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  fabGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  modalDanger: {
    flex: 2,
    paddingVertical: GlassTheme.spacing.md,
    borderRadius: GlassTheme.radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.5)',
    backgroundColor: 'rgba(239,68,68,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDangerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
});
