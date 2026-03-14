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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GlassTheme } from '@/constants/theme';
import { useNotes } from '@/hooks/use-notes';
import { useDebounce } from '@/hooks/use-debounce';
import { FormattingToolbar } from '@/components/formatting-toolbar';
import { ChecklistEditor } from '@/components/checklist-editor';
import { ColorPicker } from '@/components/color-picker';
import { toggleBold, toggleItalic, toggleHeading, toggleBullet, stripFormatting } from '@/utils/formatting';
import { generateId } from '@/utils/id';
import { NOTE_COLORS } from '@/types/note';
import type { Note, ChecklistItem, NoteColorId } from '@/types/note';

export default function EditorScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getNote, saveNote, deleteNote } = useNotes();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [colorId, setColorId] = useState<NoteColorId>('default');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [noteId] = useState(() => id ?? generateId());
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  const contentRef = useRef<TextInput>(null);
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
      createdAt: id ? (getNote(id)?.createdAt ?? Date.now()) : Date.now(),
      updatedAt: Date.now(),
      isPinned: id ? (getNote(id)?.isPinned ?? false) : false,
    };
    saveNote(note);
  }, [debouncedTitle, debouncedContent, debouncedChecklist, colorId, isLoaded]);

  const handleDelete = () => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteNote(noteId);
          router.back();
        },
      },
    ]);
  };

  const handleBold = useCallback(() => {
    const result = toggleBold(content, selection);
    setContent(result.newText);
    setSelection(result.newSelection);
  }, [content, selection]);

  const handleItalic = useCallback(() => {
    const result = toggleItalic(content, selection);
    setContent(result.newText);
    setSelection(result.newSelection);
  }, [content, selection]);

  const handleHeading = useCallback(() => {
    const result = toggleHeading(content, selection);
    setContent(result.newText);
    setSelection(result.newSelection);
  }, [content, selection]);

  const handleBullet = useCallback(() => {
    const result = toggleBullet(content, selection);
    setContent(result.newText);
    setSelection(result.newSelection);
  }, [content, selection]);

  const handleChecklist = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChecklist((prev) => [...prev, { id: generateId(), text: '', checked: false }]);
  }, []);

  const handleDivider = useCallback(() => {
    const before = content.slice(0, selection.start);
    const after = content.slice(selection.end);
    const divider = '\n---\n';
    const newText = before + divider + after;
    const newPos = selection.start + divider.length;
    setContent(newText);
    setSelection({ start: newPos, end: newPos });
  }, [content, selection]);

  const noteColor = NOTE_COLORS.find((c) => c.id === colorId) ?? NOTE_COLORS[0];
  const wordCount = stripFormatting(content).trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
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
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
            selectionColor={GlassTheme.accentPrimary}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          />

          <ChecklistEditor items={checklist} onChange={setChecklist} />
        </Animated.View>
      </ScrollView>

      {/* Toolbar */}
      <View style={{ paddingBottom: insets.bottom }}>
        <FormattingToolbar
          onBold={handleBold}
          onItalic={handleItalic}
          onHeading={handleHeading}
          onBullet={handleBullet}
          onChecklist={handleChecklist}
          onDivider={handleDivider}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlassTheme.backgroundPrimary,
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
});
