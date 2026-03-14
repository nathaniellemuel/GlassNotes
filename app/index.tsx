import { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GlassTheme } from '@/constants/theme';
import { useNotes } from '@/hooks/use-notes';
import { SearchBar } from '@/components/search-bar';
import { NoteListItem } from '@/components/note-list-item';
import { EmptyState } from '@/components/empty-state';
import type { NotePreview } from '@/types/note';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function NotesListScreen() {
  const insets = useSafeAreaInsets();
  const { filteredNotes, isLoading, searchQuery, setSearchQuery, deleteNote, togglePin, loadNotes } =
    useNotes();

  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes]),
  );

  const handleCreateNote = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/editor');
  };

  const handleNotePress = (id: string) => {
    router.push({ pathname: '/editor', params: { id } });
  };

  const handleNoteLongPress = (note: NotePreview) => {
    Alert.alert(note.title, undefined, [
      {
        text: note.isPinned ? 'Unpin' : 'Pin',
        onPress: () => togglePin(note.id),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => deleteNote(note.id),
            },
          ]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderItem = ({ item }: { item: NotePreview }) => (
    <NoteListItem
      note={item}
      onPress={() => handleNotePress(item.id)}
      onLongPress={() => handleNoteLongPress(item)}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.06)', 'transparent']}
        style={styles.gradient}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>GlassNotes</Text>
        <Text style={styles.headerSubtitle}>
          {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
        </Text>
      </View>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          filteredNotes.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadNotes}
            tintColor={GlassTheme.accentPrimary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <AnimatedPressable
        onPress={handleCreateNote}
        onPressIn={() => {
          fabScale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          fabScale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        style={[styles.fab, { bottom: insets.bottom + 24 }, fabStyle]}
      >
        <LinearGradient
          colors={[GlassTheme.accentPrimary, GlassTheme.accentSecondary]}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialIcons name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </AnimatedPressable>
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
    paddingHorizontal: GlassTheme.spacing.md,
    paddingTop: GlassTheme.spacing.lg,
    paddingBottom: GlassTheme.spacing.md,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: GlassTheme.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: GlassTheme.textTertiary,
    marginTop: GlassTheme.spacing.xs,
  },
  listContent: {
    paddingBottom: 120,
  },
  listEmpty: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: GlassTheme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: GlassTheme.accentPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
