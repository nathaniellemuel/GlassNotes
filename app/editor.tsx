import { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { GlassTheme } from '@/constants/theme';
import { useNotes } from '@/hooks/use-notes';
import { useDebounce } from '@/hooks/use-debounce';
import { FormattingToolbar } from '@/components/formatting-toolbar';
import { ChecklistEditor } from '@/components/checklist-editor';
import { ColorPicker } from '@/components/color-picker';
import { toggleBold, toggleItalic, toggleHeading, toggleBullet, stripFormatting } from '@/utils/formatting';
import { generateId } from '@/utils/id';
import { scheduleNotification, cancelNotification, requestPermissions } from '@/hooks/use-notifications';
import { NOTE_COLORS } from '@/types/note';
import type { Note, ChecklistItem, NoteColorId } from '@/types/note';

export default function EditorScreen() {
  const insets = useSafeAreaInsets();
  const { id, folderId: paramFolderId } = useLocalSearchParams<{ id?: string; folderId?: string }>();
  const { getNote, saveNote, deleteNote } = useNotes();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [colorId, setColorId] = useState<NoteColorId>('default');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [noteId] = useState(() => id ?? generateId());
  const [isLoaded, setIsLoaded] = useState(false);
  const [reminderAt, setReminderAt] = useState<number | undefined>();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [showReminderSheet, setShowReminderSheet] = useState(false);

  const contentRef = useRef<TextInput>(null);
  const selectionRef = useRef(selection);
  const debouncedTitle = useDebounce(title, 500);
  const debouncedContent = useDebounce(content, 500);
  const debouncedChecklist = useDebounce(checklist, 500);

  useEffect(() => {
    if (id) {
      const existing = getNote(id);
      if (existing) {
        setTitle(existing.title);
        setContent(existing.content);
        setChecklist(existing.checklist ?? []);
        setColorId(existing.colorId ?? 'default');
        setReminderAt(existing.reminderAt);
      }
    }
    setIsLoaded(true);
  }, [id, getNote]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!debouncedTitle && !debouncedContent && debouncedChecklist.length === 0) return;

    const note: Note = {
      id: noteId,
      title: debouncedTitle,
      content: debouncedContent,
      checklist: debouncedChecklist,
      colorId,
      folderId: id ? (getNote(id)?.folderId) : (paramFolderId || undefined),
      reminderAt,
      createdAt: id ? (getNote(id)?.createdAt ?? Date.now()) : Date.now(),
      updatedAt: Date.now(),
      isPinned: id ? (getNote(id)?.isPinned ?? false) : false,
    };
    saveNote(note);
  }, [debouncedTitle, debouncedContent, debouncedChecklist, colorId, reminderAt, isLoaded]);

  useEffect(() => {
    const showEvent = Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow';
    const hideEvent = Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleDelete = () => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          cancelNotification(`note_${noteId}`);
          deleteNote(noteId);
          router.back();
        },
      },
    ]);
  };

  const handleReminder = useCallback(async () => {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert('Notifications Disabled', 'Please enable notifications in device settings to set reminders.');
      return;
    }
    setShowReminderSheet(true);
  }, []);

  const buildTriggerTime = useCallback((offsetMs: number | null): number => {
    if (offsetMs !== null) return Date.now() + offsetMs;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.getTime();
  }, []);

  const setReminder = useCallback(
    async (triggerTime: number) => {
      setReminderAt(triggerTime);
      await scheduleNotification(
        `note_${noteId}`,
        `Note: ${title || 'Untitled'}`,
        'You have a note reminder',
        new Date(triggerTime),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowReminderSheet(false);
    },
    [noteId, title],
  );

  const clearReminder = useCallback(async () => {
    setReminderAt(undefined);
    await cancelNotification(`note_${noteId}`);
    setShowReminderSheet(false);
  }, [noteId]);

  const handleBold = useCallback(() => {
    const result = toggleBold(content, selectionRef.current);
    setContent(result.newText);
    selectionRef.current = result.newSelection;
    setSelection(result.newSelection);
    contentRef.current?.focus();
  }, [content]);

  const handleItalic = useCallback(() => {
    const result = toggleItalic(content, selectionRef.current);
    setContent(result.newText);
    selectionRef.current = result.newSelection;
    setSelection(result.newSelection);
    contentRef.current?.focus();
  }, [content]);

  const handleHeading = useCallback(() => {
    const result = toggleHeading(content, selectionRef.current);
    setContent(result.newText);
    selectionRef.current = result.newSelection;
    setSelection(result.newSelection);
    contentRef.current?.focus();
  }, [content]);

  const handleBullet = useCallback(() => {
    const result = toggleBullet(content, selectionRef.current);
    setContent(result.newText);
    selectionRef.current = result.newSelection;
    setSelection(result.newSelection);
    contentRef.current?.focus();
  }, [content]);

  const handleChecklist = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChecklist((prev) => [...prev, { id: generateId(), text: '', checked: false }]);
  }, []);

  const handleDivider = useCallback(() => {
    const sel = selectionRef.current;
    const before = content.slice(0, sel.start);
    const after = content.slice(sel.end);
    const divider = '\n---\n';
    const newText = before + divider + after;
    const newPos = sel.start + divider.length;
    setContent(newText);
    selectionRef.current = { start: newPos, end: newPos };
    setSelection({ start: newPos, end: newPos });
    contentRef.current?.focus();
  }, [content]);

  const handleInsertPhoto = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const hasAccess = permission.granted || permission.accessPrivileges === 'limited';
    if (!hasAccess) {
      Alert.alert('Permission Required', 'Allow photo access to insert images into your note.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });

    if (result.canceled || result.assets.length === 0) return;

    const image = result.assets[0];
    const imageMarkdown = `![${image.fileName ?? 'photo'}](${image.uri})`;
    const sel = selectionRef.current;
    const before = content.slice(0, sel.start);
    const after = content.slice(sel.end);
    const spacerBefore = before && !before.endsWith('\n') ? '\n' : '';
    const spacerAfter = after && !after.startsWith('\n') ? '\n' : '';
    const insertion = `${spacerBefore}${imageMarkdown}${spacerAfter}`;
    const newText = before + insertion + after;
    const caretPos = before.length + spacerBefore.length + imageMarkdown.length;
    const newSelection = { start: caretPos, end: caretPos };

    setContent(newText);
    selectionRef.current = newSelection;
    setSelection(newSelection);
    Alert.alert('Image Inserted', image.fileName ?? 'Photo added to note.');
    contentRef.current?.focus();
  }, [content]);

  const noteColor = NOTE_COLORS.find((c) => c.id === colorId) ?? NOTE_COLORS[0];
  const wordCount = stripFormatting(content).trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;
  const isKeyboardOpen = keyboardHeight > 0;
  
  // Extra space when keyboard is open to prevent sticking to prediction bars
  const extraPadding = isKeyboardOpen ? 16 : 0;
  const toolbarOffset = Math.max(0, keyboardHeight - insets.bottom);
  const toolbarPaddingBottom = Math.max(insets.bottom, GlassTheme.spacing.md) + extraPadding;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: GlassTheme.backgroundPrimary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + GlassTheme.spacing.sm }]}
      >
        <Pressable onPress={() => router.back()} style={styles.headerButton} hitSlop={8}>
          <MaterialIcons name="arrow-back-ios" size={22} color={GlassTheme.textPrimary} />
        </Pressable>

        <View style={styles.headerCenter}>
          {wordCount > 0 && (
            <Text style={styles.statsText}>
              {wordCount} words  {charCount} chars
            </Text>
          )}
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={handleReminder}
            style={styles.headerButton}
            hitSlop={8}
          >
            <MaterialIcons
              name={reminderAt ? 'notifications-active' : 'notifications-none'}
              size={22}
              color={reminderAt ? GlassTheme.accentPrimary : GlassTheme.textSecondary}
            />
          </Pressable>

          <Pressable
            onPress={() => setShowColorPicker(!showColorPicker)}
            style={styles.headerButton}
            hitSlop={8}
          >
            <View style={[styles.colorDot, { backgroundColor: noteColor.accent }]} />
          </Pressable>

          {(id || title || content || checklist.length > 0) && (
            <Pressable onPress={handleDelete} style={styles.headerButton} hitSlop={8}>
              <MaterialIcons name="delete-outline" size={22} color={GlassTheme.destructive} />
            </Pressable>
          )}
        </View>
      </Animated.View>

      {/* Color picker */}
      {showColorPicker && (
        <ColorPicker selected={colorId} onSelect={(id) => { setColorId(id); setShowColorPicker(false); }} />
      )}

      {/* Editor content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <TextInput
            style={styles.titleInput}
            placeholder="Note title"
            placeholderTextColor={GlassTheme.textPlaceholder}
            value={title}
            onChangeText={setTitle}
            selectionColor={GlassTheme.accentPrimary}
            returnKeyType="next"
            onSubmitEditing={() => contentRef.current?.focus()}
            blurOnSubmit={false}
          />

          <View style={styles.divider} />

          <TextInput
            ref={contentRef}
            style={styles.contentInput}
            placeholder="Start writing..."
            placeholderTextColor={GlassTheme.textPlaceholder}
            value={content}
            onChangeText={setContent}
            onSelectionChange={(e) => {
              selectionRef.current = e.nativeEvent.selection;
              setSelection(e.nativeEvent.selection);
            }}
            selectionColor={GlassTheme.accentPrimary}
            selection={selection}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          />

          <ChecklistEditor items={checklist} onChange={setChecklist} />
        </Animated.View>
      </ScrollView>

      {/* Toolbar - always visible at bottom */}
      <View style={[styles.toolbarContainer, { paddingBottom: toolbarPaddingBottom, bottom: toolbarOffset }]}>
        <FormattingToolbar
          onBold={handleBold}
          onItalic={handleItalic}
          onHeading={handleHeading}
          onBullet={handleBullet}
          onChecklist={handleChecklist}
          onDivider={handleDivider}
          onPhoto={handleInsertPhoto}
        />
      </View>

      <Modal visible={showReminderSheet} transparent animationType="fade">
        <Pressable
          style={[
            styles.modalOverlay,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 },
          ]}
          onPress={() => setShowReminderSheet(false)}
        >
          <View style={[styles.reminderSheet, { maxHeight: '82%' }]} onStartShouldSetResponder={() => true}>
            <Text style={styles.reminderTitle}>{reminderAt ? 'Change Reminder' : 'Set Reminder'}</Text>
            <Text style={styles.reminderSubtitle}>
              {reminderAt
                ? `Current: ${new Date(reminderAt).toLocaleString()}`
                : 'When would you like to be reminded?'}
            </Text>

            <Pressable style={styles.reminderOption} onPress={() => setReminder(buildTriggerTime(60 * 60 * 1000))}>
              <MaterialIcons name="schedule" size={16} color={GlassTheme.textSecondary} />
              <Text style={styles.reminderOptionText}>In 1 hour</Text>
            </Pressable>
            <Pressable style={styles.reminderOption} onPress={() => setReminder(buildTriggerTime(3 * 60 * 60 * 1000))}>
              <MaterialIcons name="schedule" size={16} color={GlassTheme.textSecondary} />
              <Text style={styles.reminderOptionText}>In 3 hours</Text>
            </Pressable>
            <Pressable style={styles.reminderOption} onPress={() => setReminder(buildTriggerTime(null))}>
              <MaterialIcons name="today" size={16} color={GlassTheme.textSecondary} />
              <Text style={styles.reminderOptionText}>Tomorrow 9AM</Text>
            </Pressable>

            {reminderAt ? (
              <Pressable style={[styles.reminderOption, styles.reminderDanger]} onPress={clearReminder}>
                <MaterialIcons name="notifications-off" size={16} color={GlassTheme.destructive} />
                <Text style={[styles.reminderOptionText, styles.reminderDangerText]}>Clear reminder</Text>
              </Pressable>
            ) : null}

            <Pressable style={styles.reminderCancel} onPress={() => setShowReminderSheet(false)}>
              <Text style={styles.reminderCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GlassTheme.spacing.md,
    paddingBottom: GlassTheme.spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: GlassTheme.radius.full,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: GlassTheme.textTertiary,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: GlassTheme.spacing.lg,
    paddingBottom: GlassTheme.spacing.xxl * 2,
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '700',
    color: GlassTheme.textPrimary,
    paddingVertical: GlassTheme.spacing.sm,
    letterSpacing: -0.3,
  },
  divider: {
    height: 1,
    backgroundColor: GlassTheme.glassBorder,
    marginVertical: GlassTheme.spacing.sm,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 26,
    color: GlassTheme.textPrimary,
    minHeight: 200,
    paddingTop: GlassTheme.spacing.sm,
  },
  toolbarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: GlassTheme.backgroundPrimary,
    borderTopWidth: 1,
    borderTopColor: GlassTheme.glassBorder,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: GlassTheme.spacing.lg,
  },
  reminderSheet: {
    width: '100%',
    borderRadius: GlassTheme.radius.xl,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    backgroundColor: GlassTheme.backgroundElevated,
    padding: GlassTheme.spacing.lg,
    gap: 10,
  },
  reminderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GlassTheme.textPrimary,
  },
  reminderSubtitle: {
    fontSize: 14,
    color: GlassTheme.textSecondary,
    marginBottom: 4,
  },
  reminderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: GlassTheme.radius.md,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    backgroundColor: GlassTheme.glassBackground,
    paddingHorizontal: GlassTheme.spacing.md,
    paddingVertical: GlassTheme.spacing.sm + 1,
  },
  reminderOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: GlassTheme.textSecondary,
  },
  reminderDanger: {
    borderColor: 'rgba(239,68,68,0.45)',
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  reminderDangerText: {
    color: GlassTheme.destructive,
  },
  reminderCancel: {
    marginTop: 4,
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  reminderCancelText: {
    color: GlassTheme.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
