import { useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
  Image,
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  FadeIn,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GlassTheme } from '@/constants/theme';
import { useNotes } from '@/hooks/use-notes';
import { useFolders } from '@/hooks/use-folders';
import { SearchBar } from '@/components/search-bar';
import { NoteListItem } from '@/components/note-list-item';
import { EmptyState } from '@/components/empty-state';
import type { NotePreview } from '@/types/note';
import type { Folder } from '@/types/folder';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const TAB_BAR_HEIGHT = 80;
const ROOT_NAME = '';

function folderLabel(folder: Folder, folderMap: Map<string, Folder>): string {
  const path: string[] = [folder.name];
  const visited = new Set<string>([folder.id]);
  let cursor = folder.parentId ? folderMap.get(folder.parentId) : undefined;
  while (cursor && !visited.has(cursor.id)) {
    path.unshift(cursor.name);
    visited.add(cursor.id);
    cursor = cursor.parentId ? folderMap.get(cursor.parentId) : undefined;
  }
  return `${ROOT_NAME}/${path.join('/')}`;
}

function collectFolderSubtreeIds(folderId: string, folders: Folder[]): Set<string> {
  const childrenMap = new Map<string, string[]>();
  for (const folder of folders) {
    if (!folder.parentId) continue;
    const children = childrenMap.get(folder.parentId) ?? [];
    children.push(folder.id);
    childrenMap.set(folder.parentId, children);
  }
  const ids = new Set<string>([folderId]);
  const stack = [folderId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const children = childrenMap.get(current) ?? [];
    for (const child of children) {
      if (ids.has(child)) continue;
      ids.add(child);
      stack.push(child);
    }
  }
  return ids;
}

export default function NotesListScreen() {
  const insets = useSafeAreaInsets();
  const {
    notes,
    filteredNotes,
    isLoading,
    searchQuery,
    setSearchQuery,
    deleteNote,
    togglePin,
    moveToFolder,
    loadNotes,
  } = useNotes();
  const { folders, loadFolders, createFolder, renameFolder, deleteFolder } = useFolders();

  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [draggingNote, setDraggingNote] = useState<NotePreview | null>(null);

  const fabScale = useSharedValue(1);
  const fabRotation = useSharedValue(0);
  const orbFloat = useSharedValue(0);
  const orbFloat2 = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
      loadFolders();
      orbFloat.value = withRepeat(
        withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
      orbFloat2.value = withRepeat(
        withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }, [loadNotes, loadFolders]),
  );

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }, { rotate: `${fabRotation.value}deg` }],
  }));
  const orbStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: orbFloat.value * -20 }, { translateX: orbFloat.value * 10 }],
    opacity: 0.4 + orbFloat.value * 0.2,
  }));
  const orbStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: orbFloat2.value * 15 }, { translateX: orbFloat2.value * -15 }],
    opacity: 0.3 + orbFloat2.value * 0.15,
  }));

  const folderMap = useMemo(
    () => new Map(folders.map((folder) => [folder.id, folder])),
    [folders],
  );

  const currentFolder = currentFolderId ? folderMap.get(currentFolderId) : undefined;

  const pathFolders = useMemo(() => {
    if (!currentFolderId) return [] as Folder[];
    const path: Folder[] = [];
    const visited = new Set<string>();
    let cursor = folderMap.get(currentFolderId);
    while (cursor && !visited.has(cursor.id)) {
      path.unshift(cursor);
      visited.add(cursor.id);
      cursor = cursor.parentId ? folderMap.get(cursor.parentId) : undefined;
    }
    return path;
  }, [currentFolderId, folderMap]);

  const childFolders = useMemo(
    () =>
      folders
        .filter((folder) => folder.parentId === currentFolderId)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [folders, currentFolderId],
  );

  const displayedNotes = useMemo(
    () => filteredNotes.filter((note) => note.folderId === currentFolderId),
    [filteredNotes, currentFolderId],
  );

  const handleCreateNote = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fabRotation.value = withSpring(90, { damping: 12, stiffness: 200 });
    setTimeout(() => {
      fabRotation.value = withSpring(0, { damping: 12, stiffness: 200 });
      if (currentFolderId) {
        router.push({ pathname: '/editor', params: { folderId: currentFolderId } });
      } else {
        router.push('/editor');
      }
    }, 150);
  };

  const handleNotePress = (id: string) => {
    router.push({ pathname: '/editor', params: { id } });
  };

  const moveOptions = useMemo(
    () =>
      folders.map((folder) => ({
        text: folderLabel(folder, folderMap),
        id: folder.id,
      })),
    [folders, folderMap],
  );

  const handleNoteLongPress = (note: NotePreview) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(note.title, undefined, [
      {
        text: draggingNote?.id === note.id ? 'Cancel Drag' : 'Pick Up (Drag)',
        onPress: () => {
          setDraggingNote((prev) => (prev?.id === note.id ? null : note));
        },
      },
      { text: note.isPinned ? 'Unpin' : 'Pin', onPress: () => togglePin(note.id) },
      ...(folders.length > 0
        ? [
            {
              text: 'Move to Folder',
              onPress: () => {
                Alert.alert('Move to Folder', undefined, [
                  ...moveOptions.map((option) => ({
                    text: option.text,
                    onPress: () => moveToFolder(note.id, option.id),
                  })),
                  { text: `${ROOT_NAME} (Unfiled)`, onPress: () => moveToFolder(note.id, undefined) },
                  { text: 'Cancel', style: 'cancel' as const },
                ]);
              },
            },
          ]
        : []),
      {
        text: 'Delete',
        style: 'destructive' as const,
        onPress: () => {
          Alert.alert('Delete Note', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteNote(note.id) },
          ]);
        },
      },
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const handleFolderLongPress = (folder: Folder) => {
    Alert.alert(folder.name, folder.parentId ? folderLabel(folder, folderMap) : undefined, [
      {
        text: 'Rename',
        onPress: () => {
          setEditingFolderId(folder.id);
          setFolderName(folder.name);
          setShowFolderModal(true);
        },
      },
      {
        text: 'Delete Folder',
        style: 'destructive',
        onPress: () => {
          const parentId = folder.parentId;
          const subtree = collectFolderSubtreeIds(folder.id, folders);
          Alert.alert(
            'Delete Folder',
            'Subfolders will be deleted and notes inside will move to parent folder.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  for (const note of notes) {
                    if (note.folderId && subtree.has(note.folderId)) {
                      moveToFolder(note.id, parentId);
                    }
                  }
                  deleteFolder(folder.id);
                  if (currentFolderId && subtree.has(currentFolderId)) {
                    setCurrentFolderId(parentId);
                  }
                },
              },
            ],
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSaveFolder = () => {
    if (!folderName.trim()) return;
    if (editingFolderId) {
      renameFolder(editingFolderId, folderName.trim());
    } else {
      createFolder(folderName.trim(), currentFolderId);
    }
    setShowFolderModal(false);
    setFolderName('');
    setEditingFolderId(null);
  };

  const handleDropHere = () => {
    if (!draggingNote) return;
    moveToFolder(draggingNote.id, currentFolderId);
    setDraggingNote(null);
  };

  const pinnedCount = displayedNotes.filter((n) => n.isPinned).length;
  const folderCountLabel = currentFolder
    ? `${childFolders.length} folder${childFolders.length === 1 ? '' : 's'} in ${currentFolder.name}`
    : `${childFolders.length} folder${childFolders.length === 1 ? '' : 's'} in ${ROOT_NAME}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.08)', 'rgba(99, 102, 241, 0.03)', 'transparent']}
        style={styles.gradient}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <Animated.View style={[styles.orb1, orbStyle1]} />
      <Animated.View style={[styles.orb2, orbStyle2]} />

      <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />
          <View>
            <Text style={styles.headerTitle}>GlassNotes</Text>
            <Text style={styles.headerSubtitle}>
              {displayedNotes.length} {displayedNotes.length === 1 ? 'note' : 'notes'}
              {pinnedCount > 0 ? `  \u2022  ${pinnedCount} pinned` : ''}
            </Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.drivePanel}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.breadcrumbRow}>
          <Pressable
            onPress={() => setCurrentFolderId(undefined)}
            style={[styles.breadcrumbChip, !currentFolderId && styles.breadcrumbChipActive]}
          >
            <MaterialIcons
              name="home"
              size={13}
              color={!currentFolderId ? GlassTheme.accentPrimary : GlassTheme.textTertiary}
            />
            <Text style={[styles.breadcrumbText, !currentFolderId && styles.breadcrumbTextActive]}>
              {ROOT_NAME}
            </Text>
          </Pressable>
          {pathFolders.map((folder) => (
            <Pressable
              key={folder.id}
              onPress={() => setCurrentFolderId(folder.id)}
              style={[styles.breadcrumbChip, currentFolderId === folder.id && styles.breadcrumbChipActive]}
            >
              <MaterialIcons
                name="chevron-right"
                size={12}
                color={currentFolderId === folder.id ? GlassTheme.accentPrimary : GlassTheme.textTertiary}
              />
              <Text style={[styles.breadcrumbText, currentFolderId === folder.id && styles.breadcrumbTextActive]}>
                {folder.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.folderHeader}>
          <Text style={styles.folderTitle}>Folders</Text>
          <Text style={styles.folderSubtitle}>{folderCountLabel}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.folderRow} style={styles.folderScroll}>
          {childFolders.map((folder) => (
            <Pressable
              key={folder.id}
              onPress={() => setCurrentFolderId(folder.id)}
              onLongPress={() => handleFolderLongPress(folder)}
              style={styles.folderChip}
            >
              <MaterialIcons name="folder" size={15} color={GlassTheme.textSecondary} />
              <Text style={styles.folderChipText} numberOfLines={1}>
                {folder.name}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              setEditingFolderId(null);
              setFolderName('');
              setShowFolderModal(true);
            }}
            style={styles.folderAddChip}
          >
            <MaterialIcons name="create-new-folder" size={16} color={GlassTheme.textSecondary} />
          </Pressable>
        </ScrollView>

        {draggingNote ? (
          <View style={styles.dragBar}>
            <Text style={styles.dragText} numberOfLines={1}>
              Dragging: {draggingNote.title}
            </Text>
            <View style={styles.dragActions}>
              <Pressable onPress={() => setDraggingNote(null)} style={styles.dragCancel}>
                <Text style={styles.dragCancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleDropHere} style={styles.dragDrop}>
                <Text style={styles.dragDropText}>Drop Here</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      <FlatList
        data={displayedNotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <NoteListItem
            note={item}
            index={index}
            onPress={() => handleNotePress(item.id)}
            onLongPress={() => handleNoteLongPress(item)}
          />
        )}
        contentContainerStyle={[styles.listContent, displayedNotes.length === 0 && styles.listEmpty]}
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadNotes} tintColor={GlassTheme.accentPrimary} />
        }
        showsVerticalScrollIndicator={false}
      />

      <AnimatedPressable
        onPress={handleCreateNote}
        onPressIn={() => {
          fabScale.value = withSpring(0.85, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          fabScale.value = withSpring(1, { damping: 10, stiffness: 200 });
        }}
        style={[styles.fab, { bottom: insets.bottom + TAB_BAR_HEIGHT + 6 }, fabStyle]}
      >
        <LinearGradient
          colors={[GlassTheme.accentPrimary, GlassTheme.accentSecondary]}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialIcons name="add" size={24} color="#FFFFFF" />
        </LinearGradient>
      </AnimatedPressable>

      <Modal visible={showFolderModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowFolderModal(false)} />
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>{editingFolderId ? 'Rename Folder' : 'New Folder'}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={currentFolder ? `Create in ${currentFolder.name}` : `Create in ${ROOT_NAME}`}
              placeholderTextColor={GlassTheme.textPlaceholder}
              value={folderName}
              onChangeText={setFolderName}
              selectionColor={GlassTheme.accentPrimary}
              autoFocus
              onSubmitEditing={handleSaveFolder}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowFolderModal(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSaveFolder} style={styles.modalSave}>
                <Text style={styles.modalSaveText}>{editingFolderId ? 'Rename' : 'Create'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GlassTheme.backgroundPrimary },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  orb1: {
    position: 'absolute',
    top: 60,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  orb2: {
    position: 'absolute',
    top: 160,
    left: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: GlassTheme.spacing.lg,
    paddingTop: GlassTheme.spacing.lg,
    paddingBottom: GlassTheme.spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: GlassTheme.spacing.sm },
  logo: { width: 40, height: 40, borderRadius: GlassTheme.radius.md },
  headerTitle: { fontSize: 28, fontWeight: '800', color: GlassTheme.textPrimary, letterSpacing: -0.8 },
  headerSubtitle: { fontSize: 13, color: GlassTheme.textTertiary, marginTop: 1 },
  drivePanel: {
    marginHorizontal: GlassTheme.spacing.md,
    marginBottom: GlassTheme.spacing.sm,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    borderRadius: GlassTheme.radius.lg,
    backgroundColor: 'rgba(10,10,14,0.48)',
    paddingVertical: GlassTheme.spacing.sm,
  },
  breadcrumbRow: { paddingHorizontal: GlassTheme.spacing.sm, gap: 6, paddingBottom: 8 },
  breadcrumbChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: GlassTheme.radius.full,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    backgroundColor: GlassTheme.glassBackground,
  },
  breadcrumbChipActive: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderColor: 'rgba(139,92,246,0.4)',
  },
  breadcrumbText: { fontSize: 12, color: GlassTheme.textTertiary, fontWeight: '600' },
  breadcrumbTextActive: { color: GlassTheme.accentPrimary },
  folderHeader: {
    paddingHorizontal: GlassTheme.spacing.md,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  folderTitle: { color: GlassTheme.textPrimary, fontSize: 13, fontWeight: '700' },
  folderSubtitle: { color: GlassTheme.textTertiary, fontSize: 12 },
  folderScroll: { flexGrow: 0 },
  folderRow: { paddingHorizontal: GlassTheme.spacing.md, gap: 8 },
  folderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: GlassTheme.radius.full,
    backgroundColor: GlassTheme.glassBackground,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    maxWidth: 180,
  },
  folderChipText: { fontSize: 12, fontWeight: '600', color: GlassTheme.textSecondary },
  folderAddChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: GlassTheme.glassBackground,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
  },
  dragBar: {
    marginTop: 10,
    marginHorizontal: GlassTheme.spacing.md,
    padding: GlassTheme.spacing.sm,
    borderRadius: GlassTheme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.5)',
    backgroundColor: 'rgba(96,165,250,0.14)',
    gap: 8,
  },
  dragText: { color: GlassTheme.textPrimary, fontSize: 12, fontWeight: '600' },
  dragActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  dragCancel: { paddingHorizontal: 10, paddingVertical: 6 },
  dragCancelText: { color: GlassTheme.textSecondary, fontSize: 12, fontWeight: '600' },
  dragDrop: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: GlassTheme.radius.md,
    backgroundColor: 'rgba(96,165,250,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.45)',
  },
  dragDropText: { color: '#93C5FD', fontSize: 12, fontWeight: '700' },
  listContent: { paddingBottom: 160, paddingTop: GlassTheme.spacing.xs },
  listEmpty: { flex: 1 },
  fab: {
    position: 'absolute',
    right: GlassTheme.spacing.lg,
    width: 50,
    height: 50,
    borderRadius: 25,
    ...GlassTheme.shadowPrimary,
  },
  fabGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    backgroundColor: GlassTheme.backgroundElevated,
    borderRadius: GlassTheme.radius.xl,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    padding: GlassTheme.spacing.lg,
    width: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GlassTheme.textPrimary,
    marginBottom: GlassTheme.spacing.md,
  },
  modalInput: {
    backgroundColor: GlassTheme.glassBackground,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    borderRadius: GlassTheme.radius.md,
    paddingHorizontal: GlassTheme.spacing.md,
    paddingVertical: GlassTheme.spacing.sm + 2,
    fontSize: 15,
    color: GlassTheme.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: GlassTheme.spacing.lg,
  },
  modalCancel: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: GlassTheme.radius.md },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: GlassTheme.textSecondary },
  modalSave: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: GlassTheme.radius.md,
    backgroundColor: GlassTheme.accentPrimary,
  },
  modalSaveText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
