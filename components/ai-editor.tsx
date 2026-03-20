import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassTheme } from '@/constants/theme';

interface AIEditorProps {
  initialText?: string;
  onSave?: (text: string) => void;
  onClose?: () => void;
}

interface AIResponse {
  success: boolean;
  data?: string;
  error?: string;
}

const AI_ACTIONS = [
  { id: 'summarize', label: 'Summarize', icon: 'summarize' },
  { id: 'translate', label: 'Translate', icon: 'translate' },
  { id: 'grammar', label: 'Fix Grammar', icon: 'spellcheck' },
  { id: 'improve', label: 'Improve Writing', icon: 'auto-fix-high' },
] as const;

export function AIEditor({ initialText = '', onSave, onClose }: AIEditorProps) {
  const [text, setText] = useState(initialText);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleAIRequest = async (action: string) => {
    if (!text.trim()) {
      Alert.alert('Empty Text', 'Please write something before using AI features.');
      return;
    }

    setIsLoading(true);
    setSelectedAction(action);

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/ai/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          action,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result: AIResponse = await response.json();

      if (result.success && result.data) {
        setText(result.data);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      } else {
        Alert.alert('Error', result.error || 'Failed to process request');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Connection Error', `Unable to reach AI service: ${errorMessage}`);
      console.error('AI request failed:', error);
    } finally {
      setIsLoading(false);
      setSelectedAction(null);
    }
  };

  const handleSave = () => {
    if (text.trim()) {
      onSave?.(text);
    } else {
      Alert.alert('Empty Note', 'Cannot save an empty note.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <BlurView intensity={50} tint="dark" style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable onPress={onClose} hitSlop={8}>
            <MaterialIcons name="close" size={24} color={GlassTheme.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>AI Notes Editor</Text>
          <Pressable
            onPress={handleSave}
            hitSlop={8}
            disabled={!text.trim()}
            style={[styles.saveButton, !text.trim() && styles.saveButtonDisabled]}
          >
            <MaterialIcons
              name="check"
              size={24}
              color={text.trim() ? GlassTheme.accentPrimary : GlassTheme.textTertiary}
            />
          </Pressable>
        </View>
      </BlurView>

      {/* Editor */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.editorContainer}
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          style={styles.textInput}
          placeholder="Start writing or paste your text here..."
          placeholderTextColor={GlassTheme.textPlaceholder}
          value={text}
          onChangeText={setText}
          multiline
          editable={!isLoading}
          scrollEnabled={false}
        />

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={GlassTheme.accentPrimary} />
            <Text style={styles.loadingText}>Processing with AI...</Text>
          </View>
        )}
      </ScrollView>

      {/* AI Action Buttons */}
      {!isLoading && (
        <BlurView intensity={50} tint="dark" style={styles.actionsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.actionsScroll}
            contentContainerStyle={styles.actionsContent}
          >
            {AI_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => handleAIRequest(action.id)}
                style={styles.actionButton}
                disabled={!text.trim()}
              >
                <MaterialIcons
                  name={action.icon as any}
                  size={20}
                  color={
                    text.trim() ? GlassTheme.accentPrimary : GlassTheme.textTertiary
                  }
                />
                <Text
                  style={[
                    styles.actionLabel,
                    !text.trim() && styles.actionLabelDisabled,
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlassTheme.backgroundPrimary,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: GlassTheme.glassBorder,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: GlassTheme.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  editorContainer: {
    flex: 1,
    padding: 16,
  },
  textInput: {
    fontSize: 16,
    color: GlassTheme.textPrimary,
    padding: 16,
    backgroundColor: GlassTheme.glassBackground,
    borderRadius: GlassTheme.radius.md,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    minHeight: 300,
    textAlignVertical: 'top',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: GlassTheme.textSecondary,
  },
  actionsContainer: {
    borderTopWidth: 1,
    borderTopColor: GlassTheme.glassBorder,
    paddingVertical: 12,
  },
  actionsScroll: {
    maxHeight: 70,
  },
  actionsContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: GlassTheme.glassBackground,
    borderRadius: GlassTheme.radius.sm,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    minWidth: 90,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: GlassTheme.accentPrimary,
    marginTop: 4,
  },
  actionLabelDisabled: {
    color: GlassTheme.textTertiary,
  },
});
