import { useState, useCallback } from 'react';
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const TAB_BAR_HEIGHT = 80;

export default function NotesListScreen() {
  const insets = useSafeAreaInsets();
  const {
    filteredNotes, isLoading, searchQuery, setSearchQuery,
    deleteNote, togglePin, moveToFolder, loadNotes,
  } = useNotes();
  const { folders, loadFolders, createFolder, renameFolder, deleteFolder } = useFolders();

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

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
        -1, true,
      );
      orbFloat2.value = withRepeat(
        withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        -1, true,
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

  const displayedNotes = selectedFolderId === null
    ? filteredNotes
    : filteredNotes.filter((n) =>
        selectedFolderId === '__unfiled' ? !n.folderId : n.folderId === selectedFolderId,
      );

  const handleCreateNote = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fabRotation.value = withSpring(90, { damping: 12, stiffness: 200 });
    setTimeout(() => {
      fabRotation.value = withSpring(0, { damping: 12, stiffness: 200 });
      if (selectedFolderId && selectedFolderId !== '__unfiled') {
        router.push({ pathname: '/editor', params: { folderId: selectedFolderId } });
      } else {
        router.push('/editor');
      }
    }, 150);
  };

  const handleNotePress = (id: string) => {
    router.push({ pathname: '/editor', params: { id } });
  };

  const handleNoteLongPress = (note: NotePreview) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const folderMoveOptions = folders.map((f) => ({
      text: f.name,
      onPress: () => moveToFolder(note.id, f.id),
    }));
    Alert.alert(note.title, undefined, [
      { text: note.isPinned ? 'Unpin' : 'Pin', onPress: () => togglePin(note.id) },
      ...(folders.length > 0
        ? [{
            text: 'Move to Folder',
            onPress: () => {
              Alert.alert('Move to Folder', undefined, [
                ...folderMoveOptions,
                { text: 'Remove from Folder', onPress: () => moveToFolder(note.id, undefined) },
                { text: 'Cancel', style: 'cancel' as const },
              ]);
            },
          }]
        : []),
      {
        text: 'Delete', style: 'destructive' as const,
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

  const handleFolderLongPress = (fId: string, fName: string) => {
    Alert.alert(fName, undefined, [
      {
        text: 'Rename',
        onPress: () => { setEditingFolderId(fId); setFolderName(fName); setShowFolderModal(true); },
      },
      {
        text: 'Delete Folder', style: 'destructive',
        onPress: () => {
          Alert.alert('Delete Folder', 'Notes inside will be unfiled.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteFolder(fId) },
          ]);
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
      createFolder(folderName.trim());
    }
    setShowFolderModal(false);
    setFolderName('');
    setEditingFolderId(null);
  };

  const pinnedCount = displayedNotes.filter((n) => n.isPinned).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.08)', 'rgba(99, 102, 241, 0.03)', 'transparent']}
        style={styles.gradient} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
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

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      {/* Folder chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.folderRow} style={styles.folderScroll}>
        <Pressable onPress={() => setSelectedFolderId(null)} style={[styles.folderChip, selectedFolderId === null && styles.folderChipActive]}>
          <MaterialIcons name="folder-open" size={14} color={selectedFolderId === null ? GlassTheme.accentPrimary : GlassTheme.textTertiary} />
          <Text style={[styles.folderChipText, selectedFolderId === null && styles.folderChipTextActive]}>All</Text>
        </Pressable>
        {folders.map((f) => (
          <Pressable key={f.id} onPress={() => setSelectedFolderId(f.id)} onLongPress={() => handleFolderLongPress(f.id, f.name)} style={[styles.folderChip, selectedFolderId === f.id && styles.folderChipActive]}>
            <MaterialIcons name="folder" size={14} color={selectedFolderId === f.id ? GlassTheme.accentPrimary : GlassTheme.textTertiary} />
            <Text style={[styles.folderChipText, selectedFolderId === f.id && styles.folderChipTextActive]} numberOfLines={1}>{f.name}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => { setEditingFolderId(null); setFolderName(''); setShowFolderModal(true); }} style={styles.folderAddChip}>
          <MaterialIcons name="create-new-folder" size={16} color={GlassTheme.textTertiary} />
        </Pressable>
      </ScrollView>

      <FlatList
        data={displayedNotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <NoteListItem note={item} index={index} onPress={() => handleNotePress(item.id)} onLongPress={() => handleNoteLongPress(item)} />
        )}
        contentContainerStyle={[styles.listContent, displayedNotes.length === 0 && styles.listEmpty]}
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadNotes} tintColor={GlassTheme.accentPrimary} />}
        showsVerticalScrollIndicator={false}
      />

      <AnimatedPressable
        onPress={handleCreateNote}
        onPressIn={() => { fabScale.value = withSpring(0.85, { damping: 15, stiffness: 400 }); }}
        onPressOut={() => { fabScale.value = withSpring(1, { damping: 10, stiffness: 200 }); }}
        style={[styles.fab, { bottom: insets.bottom + TAB_BAR_HEIGHT }, fabStyle]}
      >
        <LinearGradient colors={[GlassTheme.accentPrimary, GlassTheme.accentSecondary]} style={styles.fabGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <MaterialIcons name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </AnimatedPressable>

      <Modal visible={showFolderModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowFolderModal(false)}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>{editingFolderId ? 'Rename Folder' : 'New Folder'}</Text>
            <TextInput style={styles.modalInput} placeholder="Folder name" placeholderTextColor={GlassTheme.textPlaceholder} value={folderName} onChangeText={setFolderName} selectionColor={GlassTheme.accentPrimary} autoFocus onSubmitEditing={handleSaveFolder} />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowFolderModal(false)} style={styles.modalCancel}><Text style={styles.modalCancelText}>Cancel</Text></Pressable>
              <Pressable onPress={handleSaveFolder} style={styles.modalSave}><Text style={styles.modalSaveText}>{editingFolderId ? 'Rename' : 'Create'}</Text></Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GlassTheme.backgroundPrimary },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  orb1: { position: 'absolute', top: 60, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(139, 92, 246, 0.08)' },
  orb2: { position: 'absolute', top: 160, left: -40, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(99, 102, 241, 0.06)' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: GlassTheme.spacing.lg, paddingTop: GlassTheme.spacing.lg, paddingBottom: GlassTheme.spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: GlassTheme.spacing.sm },
  logo: { width: 40, height: 40, borderRadius: GlassTheme.radius.md },
  headerTitle: { fontSize: 28, fontWeight: '800', color: GlassTheme.textPrimary, letterSpacing: -0.8 },
  headerSubtitle: { fontSize: 13, color: GlassTheme.textTertiary, marginTop: 1 },
  folderScroll: { flexGrow: 0 },
  folderRow: { paddingHorizontal: GlassTheme.spacing.md, paddingBottom: GlassTheme.spacing.sm, gap: 8 },
  folderChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: GlassTheme.radius.full, backgroundColor: GlassTheme.glassBackground, borderWidth: 1, borderColor: GlassTheme.glassBorder },
  folderChipActive: { backgroundColor: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.4)' },
  folderChipText: { fontSize: 12, fontWeight: '600', color: GlassTheme.textTertiary, maxWidth: 100 },
  folderChipTextActive: { color: GlassTheme.accentPrimary },
  folderAddChip: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', backgroundColor: GlassTheme.glassBackground, borderWidth: 1, borderColor: GlassTheme.glassBorder },
  listContent: { paddingBottom: 160, paddingTop: GlassTheme.spacing.xs },
  listEmpty: { flex: 1 },
  fab: { position: 'absolute', right: GlassTheme.spacing.lg, width: 56, height: 56, borderRadius: 28, ...GlassTheme.shadowPrimary },
  fabGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalSheet: { backgroundColor: GlassTheme.backgroundElevated, borderRadius: GlassTheme.radius.xl, borderWidth: 1, borderColor: GlassTheme.glassBorder, padding: GlassTheme.spacing.lg, width: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: GlassTheme.textPrimary, marginBottom: GlassTheme.spacing.md },
  modalInput: { backgroundColor: GlassTheme.glassBackground, borderWidth: 1, borderColor: GlassTheme.glassBorder, borderRadius: GlassTheme.radius.md, paddingHorizontal: GlassTheme.spacing.md, paddingVertical: GlassTheme.spacing.sm + 2, fontSize: 15, color: GlassTheme.textPrimary },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: GlassTheme.spacing.lg },
  modalCancel: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: GlassTheme.radius.md },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: GlassTheme.textSecondary },
  modalSave: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: GlassTheme.radius.md, backgroundColor: GlassTheme.accentPrimary },
  modalSaveText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
