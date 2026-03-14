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
import * as Haptics from 'expo-haptics';
import { GlassTheme } from '@/constants/theme';
import { useNotes } from '@/hooks/use-notes';
import { useDebounce } from '@/hooks/use-debounce';
import { FormattingToolbar } from '@/components/formatting-toolbar';
import { toggleBold, toggleItalic, toggleHeading } from '@/utils/formatting';
import { generateId } from '@/utils/id';
import type { Note } from '@/types/note';

export default function EditorScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getNote, saveNote, deleteNote } = useNotes();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteId] = useState(() => id ?? generateId());
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  const contentRef = useRef<TextInput>(null);
  const debouncedTitle = useDebounce(title, 500);
  const debouncedContent = useDebounce(content, 500);

  // Load existing note
  useEffect(() => {
    if (id) {
      const existing = getNote(id);
      if (existing) {
        setTitle(existing.title);
        setContent(existing.content);
      }
    }
    setIsLoaded(true);
  }, [id, getNote]);

  // Auto-save on debounced changes
  useEffect(() => {
    if (!isLoaded) return;
    if (!debouncedTitle && !debouncedContent) return;

    const note: Note = {
      id: noteId,
      title: debouncedTitle,
      content: debouncedContent,
      createdAt: id ? (getNote(id)?.createdAt ?? Date.now()) : Date.now(),
      updatedAt: Date.now(),
      isPinned: id ? (getNote(id)?.isPinned ?? false) : false,
    };
    saveNote(note);
  }, [debouncedTitle, debouncedContent, isLoaded]);

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + GlassTheme.spacing.sm }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={8}
        >
          <MaterialIcons name="arrow-back-ios" size={22} color={GlassTheme.textPrimary} />
        </Pressable>
        <View style={styles.headerSpacer} />
        {(id || title || content) && (
          <Pressable onPress={handleDelete} style={styles.deleteButton} hitSlop={8}>
            <MaterialIcons name="delete-outline" size={22} color={GlassTheme.destructive} />
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
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
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom }}>
        <FormattingToolbar
          onBold={handleBold}
          onItalic={handleItalic}
          onHeading={handleHeading}
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: GlassTheme.radius.full,
  },
  headerSpacer: {
    flex: 1,
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: GlassTheme.radius.full,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: GlassTheme.spacing.lg,
    paddingBottom: GlassTheme.spacing.xxl,
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '700',
    color: GlassTheme.textPrimary,
    paddingVertical: GlassTheme.spacing.sm,
    letterSpacing: -0.3,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 26,
    color: GlassTheme.textPrimary,
    minHeight: 300,
    paddingTop: GlassTheme.spacing.sm,
  },
});
