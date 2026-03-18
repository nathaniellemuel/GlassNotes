import { useMemo, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  RefreshControl,
  Image,
  TextInput,
  Modal,
  ScrollView,
  useWindowDimensions,
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
import { GlassCard } from '@/components/glass-card';
import type { NotePreview } from '@/types/note';
import type { Folder } from '@/types/folder';
import type { LayoutRectangle } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const TAB_BAR_HEIGHT = 80;
const ROOT_NAME = 'My Drive';

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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
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
  const { folders, loadFolders, createFolder, renameFolder, deleteFolder, moveFolder } = useFolders();

  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [itemMenu, setItemMenu] = useState<
    | { type: 'note'; note: NotePreview }
    | { type: 'folder'; folder: Folder }
    | null
  >(null);
  const [confirmDelete, setConfirmDelete] = useState<
    | { type: 'note'; note: NotePreview }
    | { type: 'folder'; folder: Folder; noteMoveParentId?: string }
    | null
  >(null);
  const [draggingItem, setDraggingItem] = useState<
    | { type: 'note'; note: NotePreview; x: number; y: number; overFolderId?: string | null }
    | { type: 'folder'; folder: Folder; x: number; y: number; overFolderId?: string | null }
    | null
  >(null);
  const [scrollOffsetY, setScrollOffsetY] = useState(0);
  const [listTopY, setListTopY] = useState(0);
  const [listLeftX, setListLeftX] = useState(0);

  const fabScale = useSharedValue(1);
  const fabRotation = useSharedValue(0);
  const orbFloat = useSharedValue(0);
  const orbFloat2 = useSharedValue(0);
  const listFrameRef = useRef<View>(null);

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

  const displayedFolders = useMemo(() => {
    if (!searchQuery.trim()) return childFolders;
    const q = searchQuery.toLowerCase();
    return childFolders.filter((folder) => folder.name.toLowerCase().includes(q));
  }, [childFolders, searchQuery]);

  const displayedNotes = useMemo(
    () => filteredNotes.filter((note) => note.folderId === currentFolderId),
    [filteredNotes, currentFolderId],
  );

  const folderNoteCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const note of notes) {
      if (!note.folderId) continue;
      map.set(note.folderId, (map.get(note.folderId) ?? 0) + 1);
    }
    return map;
  }, [notes]);

  const folderChildCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const folder of folders) {
      if (!folder.parentId) continue;
      map.set(folder.parentId, (map.get(folder.parentId) ?? 0) + 1);
    }
    return map;
  }, [folders]);

  const folderLayouts = useMemo(() => new Map<string, LayoutRectangle>(), []);

  type ExplorerItem =
    | { type: 'folder'; folder: Folder }
    | { type: 'note'; note: NotePreview };

  const explorerItems = useMemo<ExplorerItem[]>(
    () => [
      ...displayedFolders.map((folder) => ({ type: 'folder' as const, folder })),
      ...displayedNotes.map((note) => ({ type: 'note' as const, note })),
    ],
    [displayedFolders, displayedNotes],
  );

  const currentPathLabel = useMemo(() => {
    if (pathFolders.length === 0) return ROOT_NAME;
    return `${ROOT_NAME} / ${pathFolders.map((folder) => folder.name).join(' / ')}`;
  }, [pathFolders]);

  const isFolderDescendant = useCallback(
    (folderId: string, potentialAncestorId: string): boolean => {
      let cursor = folderMap.get(folderId);
      const visited = new Set<string>();
      while (cursor && cursor.parentId && !visited.has(cursor.id)) {
        if (cursor.parentId === potentialAncestorId) return true;
        visited.add(cursor.id);
        cursor = folderMap.get(cursor.parentId);
      }
      return false;
    },
    [folderMap],
  );

  const resolveDropTarget = useCallback(
    (pageX: number, pageY: number): string | null => {
      for (const folder of displayedFolders) {
        const layout = folderLayouts.get(folder.id);
        if (!layout) continue;
        const y = listTopY + layout.y - scrollOffsetY;
        const x = listLeftX + layout.x;
        if (pageX >= x && pageX <= x + layout.width && pageY >= y && pageY <= y + layout.height) {
          return folder.id;
        }
      }
      return null;
    },
    [displayedFolders, folderLayouts, listTopY, scrollOffsetY, listLeftX],
  );

  const handleDragMove = useCallback(
    (pageX: number, pageY: number) => {
      const overFolderId = resolveDropTarget(pageX, pageY);
      setDraggingItem((prev) => (prev ? { ...prev, x: pageX, y: pageY, overFolderId } : prev));
    },
    [resolveDropTarget],
  );

  const finishDrag = useCallback(() => {
    setDraggingItem((prev) => {
      if (!prev) return prev;
      if (prev.overFolderId == null) return null;
      const targetFolderId = prev.overFolderId;
      if (prev.type === 'note') {
        moveToFolder(prev.note.id, targetFolderId);
      } else {
        const invalidSelfTarget = targetFolderId === prev.folder.id;
        const invalidDescendantTarget = targetFolderId
          ? isFolderDescendant(targetFolderId, prev.folder.id)
          : false;
        if (!invalidSelfTarget && !invalidDescendantTarget) {
          moveFolder(prev.folder.id, targetFolderId);
          if (currentFolderId === prev.folder.id) {
            setCurrentFolderId(targetFolderId);
          } else if (currentFolderId && isFolderDescendant(currentFolderId, prev.folder.id)) {
            setCurrentFolderId(targetFolderId);
          }
        }
      }
      return null;
    });
  }, [moveToFolder, moveFolder, isFolderDescendant, currentFolderId]);

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

  const handleNoteLongPress = (note: NotePreview, event: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { pageX, pageY } = event.nativeEvent;
    setDraggingItem({ type: 'note', note, x: pageX, y: pageY });
  };

  const handleFolderLongPress = (folder: Folder, event: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { pageX, pageY } = event.nativeEvent;
    setDraggingItem({ type: 'folder', folder, x: pageX, y: pageY });
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

  const handleOpenFolder = (folder: Folder) => {
    if (draggingItem) return;
    setCurrentFolderId(folder.id);
  };

  const handleGoUp = () => {
    if (!currentFolderId) return;
    setCurrentFolderId(currentFolder?.parentId);
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'note') {
      deleteNote(confirmDelete.note.id);
      setConfirmDelete(null);
      return;
    }

    const folder = confirmDelete.folder;
    const parentId = confirmDelete.noteMoveParentId;
    const subtree = collectFolderSubtreeIds(folder.id, folders);
    for (const note of notes) {
      if (note.folderId && subtree.has(note.folderId)) {
        moveToFolder(note.id, parentId);
      }
    }
    deleteFolder(folder.id);
    if (currentFolderId && subtree.has(currentFolderId)) {
      setCurrentFolderId(parentId);
    }
    setConfirmDelete(null);
  };

  const handleDropCurrent = () => {
    if (!draggingItem) return;
    if (draggingItem.type === 'note') {
      moveToFolder(draggingItem.note.id, currentFolderId);
      setDraggingItem(null);
      return;
    }
    if (draggingItem.folder.id === currentFolderId) {
      setDraggingItem(null);
      return;
    }
    if (currentFolderId && isFolderDescendant(currentFolderId, draggingItem.folder.id)) {
      setDraggingItem(null);
      return;
    }
    moveFolder(draggingItem.folder.id, currentFolderId);
    setDraggingItem(null);
  };

  const pinnedCount = displayedNotes.filter((n) => n.isPinned).length;
  const ghostLeft = draggingItem
    ? Math.min(Math.max(draggingItem.x - 90, 12), windowWidth - 192)
    : 0;
  const ghostTop = draggingItem
    ? Math.min(Math.max(draggingItem.y - 24, insets.top + 8), windowHeight - (insets.bottom + 64))
    : 0;

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
              {displayedFolders.length} {displayedFolders.length === 1 ? 'folder' : 'folders'}
              {'  •  '}
              {displayedNotes.length} {displayedNotes.length === 1 ? 'note' : 'notes'}
              {pinnedCount > 0 ? `  \u2022  ${pinnedCount} pinned` : ''}
            </Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.drivePanel}>
        <View
          style={[
            styles.directoryRow,
          ]}
        >
          <View style={styles.directoryInfo}>
            <MaterialIcons name="folder-open" size={16} color={GlassTheme.accentPrimary} />
            <Text style={styles.directoryPath} numberOfLines={1}>
              {currentPathLabel}
            </Text>
          </View>
          <View style={styles.directoryActions}>
            {currentFolderId ? (
              <Pressable onPress={handleGoUp} style={styles.directoryActionButton}>
                <MaterialIcons name="arrow-upward" size={16} color={GlassTheme.textSecondary} />
              </Pressable>
            ) : null}
            <Pressable onPress={() => setCurrentFolderId(undefined)} style={styles.directoryActionButton}>
              <MaterialIcons name="home" size={16} color={GlassTheme.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => {
                setEditingFolderId(null);
                setFolderName('');
                setShowFolderModal(true);
              }}
              style={styles.directoryActionButton}
            >
              <MaterialIcons name="create-new-folder" size={16} color={GlassTheme.textSecondary} />
            </Pressable>
          </View>
        </View>

        {draggingItem ? (
          <View style={styles.dragBar}>
            <Text style={styles.dragText} numberOfLines={1}>
              Dragging: {draggingItem.type === 'note' ? draggingItem.note.title : draggingItem.folder.name}
            </Text>
            <View style={styles.dragActions}>
              <Pressable onPress={() => setDraggingItem(null)} style={styles.dragCancel}>
                <Text style={styles.dragCancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleDropCurrent} style={styles.dragDrop}>
                <Text style={styles.dragDropText}>Drop Here</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      <View
        ref={listFrameRef}
        style={styles.listFrame}
        onTouchMove={(event) => {
          if (!draggingItem) return;
          handleDragMove(event.nativeEvent.pageX, event.nativeEvent.pageY);
        }}
        onTouchEnd={() => {
          if (!draggingItem) return;
          finishDrag();
        }}
        onLayout={() => {
          listFrameRef.current?.measureInWindow((x, y) => {
            setListLeftX(x);
            setListTopY(y);
          });
        }}
      >
        <FlatList
          data={explorerItems}
          keyExtractor={(item) => (item.type === 'folder' ? `folder_${item.folder.id}` : `note_${item.note.id}`)}
          renderItem={({ item, index }) => (
            item.type === 'folder' ? (
              <Pressable
                onPress={() => handleOpenFolder(item.folder)}
                onLongPress={(event) => handleFolderLongPress(item.folder, event)}
                onTouchMove={(event) => {
                  if (draggingItem?.type === 'folder' && draggingItem.folder.id === item.folder.id) {
                    handleDragMove(event.nativeEvent.pageX, event.nativeEvent.pageY);
                  }
                }}
                onTouchEnd={() => {
                  if (draggingItem?.type === 'folder' && draggingItem.folder.id === item.folder.id) {
                    finishDrag();
                  }
                }}
                style={[
                  styles.explorerFolderRow,
                  draggingItem?.type === 'folder' &&
                  draggingItem.folder.id === item.folder.id &&
                  styles.explorerRowDragging,
                  draggingItem?.overFolderId === item.folder.id && styles.explorerRowDropTarget,
                ]}
                onLayout={(event) => {
                  folderLayouts.set(item.folder.id, event.nativeEvent.layout);
                }}
              >
                <GlassCard accentColor={GlassTheme.accentPrimary}>
                  <View style={styles.explorerFolderInner}>
                    <View style={styles.explorerFolderLeft}>
                      <MaterialIcons name="folder" size={20} color={GlassTheme.accentPrimary} />
                      <View style={styles.explorerFolderTextWrap}>
                        <Text style={styles.explorerFolderName} numberOfLines={1}>
                          {item.folder.name}
                        </Text>
                        <Text style={styles.explorerFolderMeta}>
                          {folderChildCount.get(item.folder.id) ?? 0} subfolders • {folderNoteCount.get(item.folder.id) ?? 0} notes
                        </Text>
                      </View>
                    </View>
                    <View style={styles.folderRowActions}>
                      <Pressable
                        onPress={() => setItemMenu({ type: 'folder', folder: item.folder })}
                        hitSlop={8}
                      >
                        <MaterialIcons name="more-vert" size={18} color={GlassTheme.textTertiary} />
                      </Pressable>
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            ) : (
              <NoteListItem
                note={item.note}
                index={index}
                onPress={() => {
                  if (draggingItem) return;
                  handleNotePress(item.note.id);
                }}
                onLongPress={(event) => handleNoteLongPress(item.note, event)}
                onItemTouchMove={(event) => {
                  if (draggingItem?.type === 'note' && draggingItem.note.id === item.note.id) {
                    handleDragMove(event.nativeEvent.pageX, event.nativeEvent.pageY);
                  }
                }}
                onItemTouchEnd={() => {
                  if (draggingItem?.type === 'note' && draggingItem.note.id === item.note.id) {
                    finishDrag();
                  }
                }}
                onMenuPress={() => setItemMenu({ type: 'note', note: item.note })}
              />
            )
          )}
          contentContainerStyle={[styles.listContent, explorerItems.length === 0 && styles.listEmpty]}
          ListEmptyComponent={!isLoading ? <EmptyState /> : null}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadNotes} tintColor={GlassTheme.accentPrimary} />
          }
          showsVerticalScrollIndicator={false}
          onScroll={(event) => setScrollOffsetY(event.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
        />
      </View>

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
        <Pressable
          style={[
            styles.modalOverlay,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 },
          ]}
          onPress={() => setShowFolderModal(false)}
        >
          <View style={[styles.modalSheet, { maxHeight: '82%' }]} onStartShouldSetResponder={() => true}>
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
        </Pressable>
      </Modal>

      <Modal visible={!!itemMenu} transparent animationType="fade">
        <Pressable
          style={[
            styles.modalOverlay,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 },
          ]}
          onPress={() => setItemMenu(null)}
        >
          <View style={[styles.actionSheet, { maxHeight: '82%' }]} onStartShouldSetResponder={() => true}>
            <Text style={styles.actionSheetTitle}>
              {itemMenu?.type === 'note' ? itemMenu.note.title : itemMenu?.folder.name}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {itemMenu?.type === 'note' ? (
                <>
                <Pressable
                  style={styles.actionSheetButton}
                  onPress={() => {
                    togglePin(itemMenu.note.id);
                    setItemMenu(null);
                  }}
                >
                  <MaterialIcons name={itemMenu.note.isPinned ? 'push-pin' : 'push-pin'} size={16} color={GlassTheme.textSecondary} />
                  <Text style={styles.actionSheetText}>{itemMenu.note.isPinned ? 'Unpin note' : 'Pin note'}</Text>
                </Pressable>
                <Pressable
                  style={styles.actionSheetButton}
                  onPress={() => {
                    setDraggingItem({
                      type: 'note',
                      note: itemMenu.note,
                      x: listLeftX + 40,
                      y: listTopY + 40,
                    });
                    setItemMenu(null);
                  }}
                >
                  <MaterialIcons name="open-with" size={16} color={GlassTheme.textSecondary} />
                  <Text style={styles.actionSheetText}>Start dragging</Text>
                </Pressable>
                <Pressable
                  style={styles.actionSheetButton}
                  onPress={() => {
                    moveToFolder(itemMenu.note.id, currentFolderId);
                    setItemMenu(null);
                  }}
                >
                  <MaterialIcons name="drive-file-move" size={16} color={GlassTheme.textSecondary} />
                  <Text style={styles.actionSheetText}>Move to current folder</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionSheetButton, styles.actionSheetDanger]}
                  onPress={() => {
                    setConfirmDelete({ type: 'note', note: itemMenu.note });
                    setItemMenu(null);
                  }}
                >
                  <MaterialIcons name="delete-outline" size={16} color={GlassTheme.destructive} />
                  <Text style={[styles.actionSheetText, styles.actionSheetDangerText]}>Delete note</Text>
                </Pressable>
                </>
              ) : itemMenu?.type === 'folder' ? (
                <>
                <Pressable
                  style={styles.actionSheetButton}
                  onPress={() => {
                    setEditingFolderId(itemMenu.folder.id);
                    setFolderName(itemMenu.folder.name);
                    setShowFolderModal(true);
                    setItemMenu(null);
                  }}
                >
                  <MaterialIcons name="edit" size={16} color={GlassTheme.textSecondary} />
                  <Text style={styles.actionSheetText}>Rename folder</Text>
                </Pressable>
                <Pressable
                  style={styles.actionSheetButton}
                  onPress={() => {
                    setDraggingItem({
                      type: 'folder',
                      folder: itemMenu.folder,
                      x: listLeftX + 40,
                      y: listTopY + 40,
                    });
                    setItemMenu(null);
                  }}
                >
                  <MaterialIcons name="open-with" size={16} color={GlassTheme.textSecondary} />
                  <Text style={styles.actionSheetText}>Start dragging</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionSheetButton, styles.actionSheetDanger]}
                  onPress={() => {
                    setConfirmDelete({
                      type: 'folder',
                      folder: itemMenu.folder,
                      noteMoveParentId: itemMenu.folder.parentId,
                    });
                    setItemMenu(null);
                  }}
                >
                  <MaterialIcons name="delete-outline" size={16} color={GlassTheme.destructive} />
                  <Text style={[styles.actionSheetText, styles.actionSheetDangerText]}>Delete folder</Text>
                </Pressable>
                </>
              ) : null}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={!!confirmDelete} transparent animationType="fade">
        <Pressable
          style={[
            styles.modalOverlay,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 },
          ]}
          onPress={() => setConfirmDelete(null)}
        >
          <View style={[styles.confirmSheet, { maxHeight: '82%' }]} onStartShouldSetResponder={() => true}>
            <Text style={styles.confirmTitle}>Confirm delete</Text>
            <Text style={styles.confirmMessage}>
              {confirmDelete?.type === 'note'
                ? 'Delete this note permanently?'
                : 'Delete this folder and subfolders? Notes inside will move to parent.'}
            </Text>
            <View style={styles.confirmActions}>
              <Pressable style={styles.modalCancel} onPress={() => setConfirmDelete(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalDanger} onPress={handleConfirmDelete}>
                <Text style={styles.modalDangerText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {draggingItem ? (
        <View pointerEvents="none" style={[styles.dragGhost, { left: ghostLeft, top: ghostTop }]}>
          <MaterialIcons name={draggingItem.type === 'note' ? 'description' : 'folder'} size={16} color={GlassTheme.accentPrimary} />
          <Text style={styles.dragGhostText} numberOfLines={1}>
            {draggingItem.type === 'note' ? draggingItem.note.title : draggingItem.folder.name}
          </Text>
        </View>
      ) : null}
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
  directoryRow: {
    paddingHorizontal: GlassTheme.spacing.md,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  directoryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  directoryPath: {
    color: GlassTheme.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  directoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  directoryActionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: GlassTheme.glassBackground,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
  },
  listFrame: { flex: 1 },
  explorerFolderRow: {
    marginHorizontal: GlassTheme.spacing.md,
    marginVertical: 4,
    borderRadius: GlassTheme.radius.lg,
  },
  explorerFolderInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  folderRowActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  explorerFolderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  explorerFolderTextWrap: { flex: 1, minWidth: 0 },
  explorerFolderName: { color: GlassTheme.textPrimary, fontSize: 15, fontWeight: '700' },
  explorerFolderMeta: { color: GlassTheme.textTertiary, fontSize: 12, marginTop: 1 },
  explorerRowDragging: { opacity: 0.35 },
  explorerRowDropTarget: {
    borderColor: 'rgba(139, 92, 246, 0.7)',
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
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
  modalDanger: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: GlassTheme.radius.md,
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.45)',
  },
  modalDangerText: { fontSize: 14, fontWeight: '700', color: GlassTheme.destructive },
  actionSheet: {
    width: '88%',
    borderRadius: GlassTheme.radius.xl,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    backgroundColor: GlassTheme.backgroundElevated,
    padding: GlassTheme.spacing.md,
    gap: 4,
  },
  actionSheetTitle: {
    color: GlassTheme.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  actionSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: GlassTheme.radius.md,
    backgroundColor: GlassTheme.glassBackground,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    paddingHorizontal: GlassTheme.spacing.md,
    paddingVertical: GlassTheme.spacing.sm + 1,
    marginBottom: 8,
  },
  actionSheetText: {
    color: GlassTheme.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  actionSheetDanger: {
    borderColor: 'rgba(239,68,68,0.35)',
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  actionSheetDangerText: {
    color: GlassTheme.destructive,
  },
  confirmSheet: {
    width: '84%',
    borderRadius: GlassTheme.radius.xl,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    backgroundColor: GlassTheme.backgroundElevated,
    padding: GlassTheme.spacing.lg,
  },
  confirmTitle: {
    color: GlassTheme.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  confirmMessage: {
    color: GlassTheme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: GlassTheme.spacing.lg,
  },
  dragGhost: {
    position: 'absolute',
    width: 180,
    borderRadius: GlassTheme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.55)',
    backgroundColor: 'rgba(17,24,39,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dragGhostText: {
    color: GlassTheme.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
