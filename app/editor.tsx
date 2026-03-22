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
  Image,
  AppState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { GlassTheme } from '@/constants/theme';
import { useNotes } from '@/hooks/use-notes';
import { useDebounce } from '@/hooks/use-debounce';
import { FormattingToolbar } from '@/components/formatting-toolbar';
import { ChecklistEditor } from '@/components/checklist-editor';
import { ColorPicker } from '@/components/color-picker';
import { TextColorPicker, TextColorId, TEXT_COLORS } from '@/components/text-color-picker';
import { toggleBold, toggleItalic, toggleUppercase, toggleBullet, stripFormatting, applyTextColor, COLOR_MARKERS, STYLE_MARKERS, toggleListType, type ListType } from '@/utils/formatting';
import { generateId } from '@/utils/id';
import { scheduleNotification, cancelNotification, requestPermissions } from '@/hooks/use-notifications';
import { NOTE_COLORS } from '@/types/note';
import { imageUriToBase64 } from '@/utils/image';
import { ChatBotAssistant } from '@/components/chatbot-assistant';
import { ListTypePicker } from '@/components/list-type-picker';
import type { Note, ChecklistItem, NoteColorId } from '@/types/note';

const renderColoredContent = (text: string) => {
  if (!text) return null;
  const parts = text.split(/([\u200B\u200C\u200D\uFEFF\u2060-\u206D\u206F])/g);
  const elements = [];
  let currentColor: string | undefined = undefined;
  let isBold = false;
  let isItalic = false;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    if (part === STYLE_MARKERS.bold.start) {
      isBold = true;
      elements.push(<Text key={i}>{part}</Text>);
      continue;
    }
    if (part === STYLE_MARKERS.bold.end) {
      isBold = false;
      elements.push(<Text key={i}>{part}</Text>);
      continue;
    }
    if (part === STYLE_MARKERS.italic.start) {
      isItalic = true;
      elements.push(<Text key={i}>{part}</Text>);
      continue;
    }
    if (part === STYLE_MARKERS.italic.end) {
      isItalic = false;
      elements.push(<Text key={i}>{part}</Text>);
      continue;
    }

    // Check if it's a start marker
    const markerEntry = Object.entries(COLOR_MARKERS).find(([, m]) => m.start === part);
    if (markerEntry) {
      const colorId = markerEntry[0];
      const colorHex = TEXT_COLORS.find(c => c.id === colorId)?.color;
      currentColor = colorHex;
      elements.push(<Text key={i}>{part}</Text>);
      continue;
    }

    // Check if it's an end marker (for any color)
    const endMarkerEntry = Object.entries(COLOR_MARKERS).find(([, m]) => m.end === part);
    if (endMarkerEntry) {
      currentColor = undefined;
      elements.push(<Text key={i}>{part}</Text>);
      continue;
    }

    const style: any = {};
    if (currentColor) style.color = currentColor;
    if (isBold) style.fontWeight = 'bold';
    if (isItalic) style.fontStyle = 'italic';

    elements.push(
      <Text key={i} style={Object.keys(style).length > 0 ? style : undefined}>
        {part}
      </Text>
    );
  }
  return elements;
};

export default function EditorScreen() {
  const insets = useSafeAreaInsets();
  const { id, folderId: paramFolderId } = useLocalSearchParams<{ id?: string; folderId?: string }>();
  const { getNote, saveNote, deleteNote } = useNotes();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeImageOptionIndex, setActiveImageOptionIndex] = useState<number | null>(null);
  const [colorId, setColorId] = useState<NoteColorId>('default');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [noteId] = useState(() => id ?? generateId());
  const [isLoaded, setIsLoaded] = useState(false);
  const [reminderAt, setReminderAt] = useState<number | undefined>();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [showReminderSheet, setShowReminderSheet] = useState(false);
  const [showPhotoSourceSheet, setShowPhotoSourceSheet] = useState(false);
  const [toastMessage, setToastMessage] = useState<{title: string; message: string; type?: 'success' | 'error'} | null>(null);
  const [listType, setListType] = useState<ListType>('bullet');
  const [showListTypePicker, setShowListTypePicker] = useState(false);
  const [showAIEditor, setShowAIEditor] = useState(false);

  const showToast = useCallback((title: string, message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ title, message, type });
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const contentRef = useRef<TextInput>(null);
  const selectionRef = useRef(selection);
  const debouncedTitle = useDebounce(title, 500);
  const debouncedContent = useDebounce(content, 500);
  const debouncedChecklist = useDebounce(checklist, 500);
  const debouncedImages = useDebounce(images, 500);

  useEffect(() => {
    if (id) {
      const existing = getNote(id);
      if (existing) {
        setTitle(existing.title);
        setContent(existing.content);
        setChecklist(existing.checklist ?? []);
        setImages(existing.images ?? []);
        setColorId(existing.colorId ?? 'default');
        setReminderAt(existing.reminderAt);
      }
    }
    setIsLoaded(true);
  }, [id, getNote]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!debouncedTitle && !debouncedContent && debouncedChecklist.length === 0 && debouncedImages.length === 0) return;

    const note: Note = {
      id: noteId,
      title: debouncedTitle,
      content: debouncedContent,
      checklist: debouncedChecklist,
      images: debouncedImages,
      colorId,
      folderId: id ? (getNote(id)?.folderId) : (paramFolderId || undefined),
      reminderAt,
      createdAt: id ? (getNote(id)?.createdAt ?? Date.now()) : Date.now(),
      updatedAt: Date.now(),
      isPinned: id ? (getNote(id)?.isPinned ?? false) : false,
    };
    saveNote(note);
  }, [debouncedTitle, debouncedContent, debouncedChecklist, debouncedImages, colorId, reminderAt, isLoaded]);

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

  // Reset keyboard height when app state changes to prevent toolbar hiding
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        // App backgrounded - reset keyboard state
        setKeyboardHeight(0);
        Keyboard.dismiss();
      }
    });

    return () => subscription.remove();
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

  const handleUppercase = useCallback(() => {
    const result = toggleUppercase(content, selectionRef.current);
    setContent(result.newText);
    selectionRef.current = result.newSelection;
    setSelection(result.newSelection);
    contentRef.current?.focus();
  }, [content]);

  const handleBullet = useCallback(() => {
    const result = toggleListType(content, selectionRef.current, listType);
    setContent(result.newText);
    selectionRef.current = result.newSelection;
    setSelection(result.newSelection);
    contentRef.current?.focus();
  }, [content, listType]);

  const handleChecklist = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChecklist((prev) => [...prev, { id: generateId(), text: '', checked: false }]);
  }, []);

  const processImageResult = useCallback(async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || result.assets.length === 0) return;

    try {
      const image = result.assets[0];
      console.log('[Editor] Processing image:', {
        uri: image.uri,
        fileName: image.fileName,
        width: image.width,
        height: image.height,
        fileSize: image.fileSize,
      });

      // Convert to base64 for reliable Android APK storage
      const base64Uri = await imageUriToBase64(image.uri);
      setImages(prev => [...prev, base64Uri]);
      showToast('Image Added', 'Photo has been added to your note.', 'success');
      console.log('[Editor] Image successfully added, total images:', images.length + 1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Editor] Image processing error:', errorMessage);
      console.error('[Editor] Full error:', error);

      showToast('Image Error', `Failed to add image: ${errorMessage}`, 'error');
    }
  }, [images.length, showToast]);

  const handleLaunchGallery = useCallback(async () => {
    setShowPhotoSourceSheet(false);
    try {
      console.log('[Editor] Requesting media library permissions...');
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('[Editor] Permission result:', permission);
      
      const hasAccess = permission.granted || permission.accessPrivileges === 'limited';
      if (!hasAccess) {
        showToast('Permission Required', 'Permissions are needed. Please enable them in settings.', 'error');
        return;
      }

      console.log('[Editor] Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsMultipleSelection: false,
        allowsEditing: false,
      });
      console.log('[Editor] Image picker result:', result.canceled ? 'Canceled' : 'Got image');
      await processImageResult(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Editor] Gallery error:', errorMessage);
      console.error('[Editor] Full error:', error);
      Alert.alert('Error', `Failed to open photo gallery: ${errorMessage}`);
    }
  }, [processImageResult]);

  const handleLaunchCamera = useCallback(async () => {
    setShowPhotoSourceSheet(false);
    try {
      console.log('[Editor] Requesting camera permissions...');
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      console.log('[Editor] Camera permission result:', permission);
      
      if (!permission.granted) {
        showToast('Permission Required', 'Permissions are needed. Please enable them in settings.', 'error');
        return;
      }

      console.log('[Editor] Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: false,
      });
      console.log('[Editor] Camera result:', result.canceled ? 'Canceled' : 'Got photo');
      await processImageResult(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Editor] Camera error:', errorMessage);
      console.error('[Editor] Full error:', error);
      Alert.alert('Error', `Failed to open camera: ${errorMessage}`);
    }
  }, [processImageResult]);

  const handleInsertPhoto = useCallback(() => {
    Keyboard.dismiss();
    setShowPhotoSourceSheet(true);
  }, []);

  const handleTextColor = useCallback(() => {
    Keyboard.dismiss();
    setShowTextColorPicker(prev => !prev);
  }, []);

  const handleApplyTextColor = useCallback((colorId: TextColorId) => {
    const result = applyTextColor(content, selectionRef.current, colorId);
    setContent(result.newText);
    selectionRef.current = result.newSelection;
    setSelection(result.newSelection);
    contentRef.current?.focus();
    setShowTextColorPicker(false);
  }, [content]);

  const handleRemoveImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setActiveImageOptionIndex(null);
  }, []);

  const handleListTypeChange = useCallback((type: ListType) => {
    setListType(type);
  }, []);

  const handleAIUpdateNote = useCallback((text: string, action: 'append' | 'replace' | 'prepend') => {
    if (action === 'replace') {
      setContent(text);
    } else if (action === 'append') {
      setContent(prev => prev + '\n\n' + text);
    } else if (action === 'prepend') {
      setContent(prev => text + '\n\n' + prev);
    }
  }, []);

  const handleRotateImage = useCallback(async (index: number) => {
    setActiveImageOptionIndex(null);
    try {
      const imgTarget = images[index];
      const manipResult = await ImageManipulator.manipulateAsync(
        imgTarget,
        [{ rotate: 90 }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      const newBase64 = await imageUriToBase64(manipResult.uri);
      setImages(prev => {
        const newImgs = [...prev];
        newImgs[index] = newBase64;
        return newImgs;
      });
      showToast('Image Rotated', 'Image updated successfully.', 'success');
    } catch (e) {
      showToast('Edit Error', 'Failed to rotate image.', 'error');
    }
  }, [images, showToast]);

  const handleMoveImage = useCallback((index: number, direction: 'up' | 'down' | 'left' | 'right') => {
    setActiveImageOptionIndex(null);
    setImages(prev => {
      const newImgs = [...prev];
      if (direction === 'left' && index > 0) {
        [newImgs[index - 1], newImgs[index]] = [newImgs[index], newImgs[index - 1]];
      } else if (direction === 'right' && index < newImgs.length - 1) {
        [newImgs[index + 1], newImgs[index]] = [newImgs[index], newImgs[index + 1]];
      }
      return newImgs;
    });
  }, []);

  const getImageSize = useCallback((uri: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => resolve({ width, height }),
        (error) => reject(error)
      );
    });
  }, []);

  const handleCropImage = useCallback(async (index: number) => {
    setActiveImageOptionIndex(null);
    try {
      const imgTarget = images[index];
      const { width, height } = await getImageSize(imgTarget);
      const targetAspect = 16 / 9;

      let cropWidth = width;
      let cropHeight = height;
      let originX = 0;
      let originY = 0;

      if (width / height > targetAspect) {
        cropWidth = height * targetAspect;
        originX = (width - cropWidth) / 2;
      } else {
        cropHeight = width / targetAspect;
        originY = (height - cropHeight) / 2;
      }

      const manipResult = await ImageManipulator.manipulateAsync(
        imgTarget,
        [{
          crop: {
            originX: Math.max(0, Math.floor(originX)),
            originY: Math.max(0, Math.floor(originY)),
            width: Math.max(1, Math.floor(cropWidth)),
            height: Math.max(1, Math.floor(cropHeight)),
          },
        }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      const croppedBase64 = await imageUriToBase64(manipResult.uri);
      setImages(prev => {
        const newImgs = [...prev];
        newImgs[index] = croppedBase64;
        return newImgs;
      });
      showToast('Image Cropped', 'Image has been cropped successfully.', 'success');
    } catch (e) {
      showToast('Crop Error', 'Failed to crop image.', 'error');
    }
  }, [getImageSize, images, showToast]);

  const handleMirrorImage = useCallback(async (index: number) => {
    setActiveImageOptionIndex(null);
    try {
      const imgTarget = images[index];
      const manipResult = await ImageManipulator.manipulateAsync(
        imgTarget,
        [{ flip: ImageManipulator.FlipType.Horizontal }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      const mirroredBase64 = await imageUriToBase64(manipResult.uri);
      setImages(prev => {
        const newImgs = [...prev];
        newImgs[index] = mirroredBase64;
        return newImgs;
      });
      showToast('Image Mirrored', 'Image updated successfully.', 'success');
    } catch (e) {
      showToast('Edit Error', 'Failed to mirror image.', 'error');
    }
  }, [images, showToast]);

  const noteColor = NOTE_COLORS.find((c) => c.id === colorId) ?? NOTE_COLORS[0];
  const isDefaultColor = noteColor.id === 'default';
  const activeAccent = isDefaultColor ? GlassTheme.accentPrimary : noteColor.accent;

  const strippedContent = stripFormatting(content);
  const wordCount = strippedContent.trim().split(/\s+/).filter(Boolean).length;
  const charCount = strippedContent.length;
  const isKeyboardOpen = keyboardHeight > 0;
  
  // Extra space when keyboard is open to prevent sticking to prediction bars
  const extraPadding = Platform.OS === 'ios' && isKeyboardOpen ? 16 : 0;
  const toolbarPaddingBottom = Math.max(insets.bottom, GlassTheme.spacing.md) + extraPadding;

  return (
    <View style={styles.screenContainer}>
      {/* Header with proper top inset */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 12) + GlassTheme.spacing.sm }
        ]}
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
            <View style={[styles.colorDot, { backgroundColor: activeAccent }]} />
          </Pressable>

          {(id || title || content || checklist.length > 0) && (
            <Pressable onPress={handleDelete} style={styles.headerButton} hitSlop={8}>
              <MaterialIcons name="delete-outline" size={22} color={GlassTheme.destructive} />
            </Pressable>
          )}
        </View>
      </Animated.View>

      {/* Toast Notification */}
      {toastMessage && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[
            styles.toastContainer,
            { top: Math.max(insets.top, 12) + 60 }
          ]}
        >
          <View style={[
            styles.toastContent,
            toastMessage.type === 'error' && styles.toastError
          ]}>
            <MaterialIcons
              name={toastMessage.type === 'error' ? 'error-outline' : 'check-circle'}
              size={24}
              color={toastMessage.type === 'error' ? GlassTheme.destructive : GlassTheme.success}
            />
            <View style={styles.toastTextContainer}>
              <Text style={styles.toastTitle}>{toastMessage.title}</Text>
              <Text style={styles.toastMessage}>{toastMessage.message}</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Color picker */}
      {showColorPicker && (
        <ColorPicker selected={colorId} onSelect={(id) => { setColorId(id); setShowColorPicker(false); }} />
      )}

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Editor content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 100 + Math.max(insets.bottom, 12) }
          ]}
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

            {images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalImageContainer}>
                {images.map((img, i) => (
                  <View key={i} style={styles.imageItemContainer} onStartShouldSetResponder={() => true}>
                    <View style={styles.largeImageWrapper}>
                      <Pressable onPress={() => setPreviewImage(img)} style={{ flex: 1 }}>
                        <Image
                          source={{ uri: img }}
                          style={styles.largeImage}
                          resizeMode="cover"
                          onError={(error) => {
                            console.error(`Error loading image ${i}:`, error);
                            showToast('Image Load Error', 'Failed to load image. It may be corrupted.', 'error');
                          }}
                        />
                      </Pressable>

                      {/* Remove Button */}
                      <Pressable onPress={() => handleRemoveImage(i)} style={[styles.imageActionBtn, { right: 8, top: 8 }]}>
                        <MaterialIcons name="close" size={24} color="#FFF" />
                      </Pressable>
                    </View>

                    <View style={styles.imageReorderRow}>
                      <Pressable disabled={i === 0} onPress={() => handleMoveImage(i, 'left')}>
                        <Text style={[styles.imageReorderText, i === 0 && styles.imageReorderTextDisabled]}>Left</Text>
                      </Pressable>
                      <Pressable disabled={i === images.length - 1} onPress={() => handleMoveImage(i, 'right')}>
                        <Text style={[styles.imageReorderText, i === images.length - 1 && styles.imageReorderTextDisabled]}>Right</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.divider} />

            {/* Content editor container with overlay */}
            <View style={styles.contentEditorContainer}>
              {/* Colored text display overlay */}
              {content.trim() && (
                <Pressable
                  onPress={() => contentRef.current?.focus()}
                  style={styles.coloredTextDisplay}
                  pointerEvents="box-none"
                >
                  <Text style={styles.contentInput}>
                    {renderColoredContent(content)}
                  </Text>
                </Pressable>
              )}

              <TextInput
                ref={contentRef}
                value={content}
                style={[styles.contentInput, { color: content.trim() ? 'transparent' : GlassTheme.textPlaceholder }]}
                placeholder="Start writing..."
                placeholderTextColor={GlassTheme.textPlaceholder}
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
            </View>

            <ChecklistEditor items={checklist} onChange={setChecklist} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toolbar - Fixed at bottom */}
      <View style={[
        styles.toolbarContainer,
        { paddingBottom: Math.max(insets.bottom, 12) }
      ]}>
        {/* List Type Picker - popover above toolbar */}
        <ListTypePicker
          visible={showListTypePicker}
          currentType={listType}
          onSelect={handleListTypeChange}
          onClose={() => setShowListTypePicker(false)}
        />

        {showTextColorPicker && (
          <View style={{ paddingHorizontal: GlassTheme.spacing.md }}>
            <TextColorPicker
              onSelect={handleApplyTextColor}
              onClose={() => setShowTextColorPicker(false)}
            />
          </View>
        )}
        <FormattingToolbar
          onBold={handleBold}
          onItalic={handleItalic}
          onUppercase={handleUppercase}
          onBullet={handleBullet}
          onBulletLongPress={() => setShowListTypePicker(true)}
          onChecklist={handleChecklist}
          onPhoto={handleInsertPhoto}
          onTextColor={handleTextColor}
          onAI={() => setShowAIEditor(true)}
        />
      </View>

      {/* Modals */}
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

        <Modal visible={showPhotoSourceSheet} transparent animationType="fade">
          <Pressable
            style={[
              styles.modalOverlay,
              { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 },
            ]}
            onPress={() => setShowPhotoSourceSheet(false)}
          >
            <View style={[styles.reminderSheet, { maxHeight: '82%' }]} onStartShouldSetResponder={() => true}>
              <Text style={styles.reminderTitle}>Insert Photo</Text>
              <Text style={styles.reminderSubtitle}>Choose a source to add an image</Text>

              <Pressable style={styles.reminderOption} onPress={handleLaunchCamera}>
                <MaterialIcons name="photo-camera" size={16} color={GlassTheme.textSecondary} />
                <Text style={styles.reminderOptionText}>Take a Photo</Text>
              </Pressable>

              <Pressable style={styles.reminderOption} onPress={handleLaunchGallery}>
                <MaterialIcons name="photo-library" size={16} color={GlassTheme.textSecondary} />
                <Text style={styles.reminderOptionText}>Choose from Gallery</Text>
              </Pressable>

              <Pressable style={styles.reminderCancel} onPress={() => setShowPhotoSourceSheet(false)}>
                <Text style={styles.reminderCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {previewImage !== null && (
          <Modal visible={true} transparent={true} animationType="fade" onRequestClose={() => setPreviewImage(null)}>
            <View style={styles.previewContainer}>
              <Pressable onPress={() => setPreviewImage(null)} style={styles.previewBackdrop} />
              <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />
              <Pressable onPress={() => setPreviewImage(null)} style={styles.previewCloseBtn}>
                <MaterialIcons name="close" size={24} color="#FFF" />
              </Pressable>
            </View>
          </Modal>
        )}

        {/* AI Chatbot Modal */}
        {showAIEditor && (
          <Modal visible={true} transparent={false} animationType="slide">
            <ChatBotAssistant
              currentNoteContent={content}
              onUpdateNote={handleAIUpdateNote}
              onClose={() => setShowAIEditor(false)}
            />
          </Modal>
        )}
      </View>
    );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: GlassTheme.backgroundPrimary,
  },
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: GlassTheme.backgroundPrimary,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GlassTheme.spacing.md,
    paddingBottom: GlassTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: GlassTheme.glassBorder,
    zIndex: 100,
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
  toastContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 1000,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    backgroundColor: GlassTheme.glassBackground,
  },
  toastError: {
    borderLeftWidth: 4,
    borderLeftColor: GlassTheme.destructive,
  },
  toastTextContainer: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: GlassTheme.textPrimary,
  },
  toastMessage: {
    fontSize: 12,
    color: GlassTheme.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: GlassTheme.spacing.lg,
    paddingTop: GlassTheme.spacing.md,
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '700',
    color: GlassTheme.textPrimary,
    paddingVertical: GlassTheme.spacing.sm,
    letterSpacing: -0.3,
  },
  horizontalImageContainer: {
    marginVertical: GlassTheme.spacing.md,
  },
  imageItemContainer: {
    marginRight: GlassTheme.spacing.md,
  },
  largeImageWrapper: {
    position: 'relative',
    width: 200,
    height: 140,
    borderRadius: GlassTheme.radius.lg,
    overflow: 'hidden',
    backgroundColor: GlassTheme.backgroundElevated,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
  },
  largeImage: {
    width: '100%',
    height: '100%',
  },
  imageActionBtn: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageReorderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  imageReorderText: {
    fontSize: 12,
    color: GlassTheme.accentPrimary,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageReorderTextDisabled: {
    color: GlassTheme.textTertiary,
    opacity: 0.4,
  },
  divider: {
    height: 1,
    backgroundColor: GlassTheme.glassBorder,
    marginVertical: GlassTheme.spacing.sm,
  },
  contentEditorContainer: {
    position: 'relative',
    minHeight: 200,
  },
  coloredTextDisplay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    pointerEvents: 'none',
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 26,
    color: GlassTheme.textPrimary,
    minHeight: 200,
    paddingTop: GlassTheme.spacing.sm,
    paddingLeft: 0,
    paddingRight: 0,
  },
  toolbarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: GlassTheme.backgroundPrimary,
    borderTopWidth: 1,
    borderTopColor: GlassTheme.glassBorder,
    zIndex: 50,
    elevation: 10,
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
    borderRadius: GlassTheme.radius.md,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    paddingHorizontal: GlassTheme.spacing.md,
    paddingVertical: GlassTheme.spacing.sm + 4,
    alignItems: 'center',
    marginTop: GlassTheme.spacing.sm,
    backgroundColor: GlassTheme.backgroundElevated,
  },
  reminderCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: GlassTheme.textSecondary,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  previewImage: {
    width: '90%',
    height: '80%',
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

