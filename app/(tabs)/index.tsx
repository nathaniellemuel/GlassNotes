import { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
  Image,
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
  const fabRotation = useSharedValue(0);

  const orbFloat = useSharedValue(0);
  const orbFloat2 = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
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
    }, [loadNotes]),
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

  const handleCreateNote = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fabRotation.value = withSpring(90, { damping: 12, stiffness: 200 });
    setTimeout(() => {
      fabRotation.value = withSpring(0, { damping: 12, stiffness: 200 });
      router.push('/editor');
    }, 150);
  };

  const handleNotePress = (id: string) => {
    router.push({ pathname: '/editor', params: { id } });
  };

  const handleNoteLongPress = (note: NotePreview) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(note.title, undefined, [
      {
        text: note.isPinned ? 'Unpin' : 'Pin',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          togglePin(note.id);
        },
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
              onPress: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                deleteNote(note.id);
              },
            },
          ]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderItem = ({ item, index }: { item: NotePreview; index: number }) => (
    <NoteListItem
      note={item}
      index={index}
      onPress={() => handleNotePress(item.id)}
      onLongPress={() => handleNoteLongPress(item)}
    />
  );

  const pinnedCount = filteredNotes.filter((n) => n.isPinned).length;

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
              {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
              {pinnedCount > 0 ? `  \u2022  ${pinnedCount} pinned` : ''}
            </Text>
          </View>
        </View>
      </Animated.View>

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
          fabScale.value = withSpring(0.85, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          fabScale.value = withSpring(1, { damping: 10, stiffness: 200 });
        }}
        style={[styles.fab, fabStyle]}
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
    height: 300,
  },
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GlassTheme.spacing.sm,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: GlassTheme.radius.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: GlassTheme.textPrimary,
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: GlassTheme.textTertiary,
    marginTop: 1,
  },
  listContent: {
    paddingBottom: 90,
    paddingTop: GlassTheme.spacing.xs,
  },
  listEmpty: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: GlassTheme.spacing.lg,
    bottom: 80,
    width: 60,
    height: 60,
    borderRadius: 30,
    ...GlassTheme.shadowPrimary,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
