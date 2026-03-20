import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Text,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassTheme } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isTyping?: boolean;
  displayedContent?: string;
}

interface ChatBotProps {
  onClose?: () => void;
  onUpdateNote?: (text: string, action: 'append' | 'replace' | 'prepend') => void;
  currentNoteContent?: string;
}

const SUGGESTION_ACTIONS = [
  { id: 'summarize', label: 'Summarize', icon: 'summarize' },
  { id: 'translate', label: 'Translate', icon: 'translate' },
  { id: 'grammar', label: 'Fix Grammar', icon: 'spellcheck' },
  { id: 'improve', label: 'Improve', icon: 'auto-fix-high' },
] as const;

const CRUD_ACTIONS = [
  { id: 'append', label: 'Add to Note', icon: 'add-box' },
  { id: 'replace', label: 'Replace Note', icon: 'edit' },
  { id: 'prepend', label: 'Insert at Top', icon: 'vertical-align-top' },
] as const;

export function ChatBotAssistant({ onClose, onUpdateNote, currentNoteContent }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingIndex, setTypingIndex] = useState<{ [key: string]: number }>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Typing animation interval
  useEffect(() => {
    const typingIds = Object.keys(typingIndex);
    if (typingIds.length === 0) return;

    const interval = setInterval(() => {
      setMessages(prev => {
        let updated = false;
        const newMessages = prev.map(msg => {
          const currentIndex = typingIndex[msg.id] ?? -1;
          if (msg.isTyping && currentIndex < msg.content.length) {
            updated = true;
            return msg;
          }
          return msg;
        });

        if (updated) {
          setTypingIndex(p => {
            const newIndex = { ...p };
            Object.keys(newIndex).forEach(id => {
              if (newIndex[id] < (messages.find(m => m.id === id)?.content.length ?? 0)) {
                newIndex[id]++;
              }
            });
            return newIndex;
          });
        }

        return newMessages;
      });
    }, 15);

    return () => clearInterval(interval);
  }, [typingIndex, messages]);

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

  const sendMessage = async (text?: string, action?: string) => {
    const messageText = text || input;

    if (!messageText.trim()) {
      Alert.alert('Empty Message', 'Please type something');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await callAI(messageText, action);

      if (result.success) {
        const messageId = (Date.now() + 1).toString();
        const assistantMessage: Message = {
          id: messageId,
          role: 'assistant',
          content: result.data || 'No response',
          timestamp: Date.now(),
          isTyping: true,
          displayedContent: '',
        };
        setMessages(prev => [...prev, assistantMessage]);
        setTypingIndex(p => ({ ...p, [messageId]: 0 }));
      } else {
        Alert.alert('Error', result.error || 'Failed');
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const saveToNote = (messageId: string, action: 'append' | 'replace' | 'prepend') => {
    const message = messages.find(m => m.id === messageId);
    if (message?.role === 'assistant') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUpdateNote?.(message.content, action);
      Alert.alert('✓ Saved', `Response ${action === 'append' ? 'added' : action === 'replace' ? 'replaced' : 'inserted'} to note!`);
    }
  };

  const callAI = async (text: string, action?: string) => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

      if (!apiKey) {
        return { success: false, error: 'API key not configured' };
      }

      let systemPrompt = 'You are a helpful note-taking assistant. Be concise.';

      if (action === 'summarize') {
        systemPrompt = 'Summarize the text concisely. Return only summary.';
      } else if (action === 'translate') {
        systemPrompt = 'Translate to English. If already English, translate to Spanish. Return only translated text.';
      } else if (action === 'grammar') {
        systemPrompt = 'Fix grammar and spelling. Return only corrected text.';
      } else if (action === 'improve') {
        systemPrompt = 'Improve clarity and tone. Make engaging. Return only improved text.';
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://glassnotes.app',
          'X-Title': 'GlassNotes',
        },
        body: JSON.stringify({
          model: 'arcee-ai/trinity-large-preview:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
          ],
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          errorMessage = await response.text();
        }
        return { success: false, error: errorMessage };
      }

      const data = await response.json();

      if (!data.choices?.[0]?.message?.content) {
        return { success: false, error: 'Invalid response' };
      }

      return { success: true, data: data.choices[0].message.content };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error',
      };
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <BlurView intensity={50} tint="dark" style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable onPress={onClose} hitSlop={8}>
            <MaterialIcons name="close" size={24} color={GlassTheme.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <View style={{ width: 24 }} />
        </View>
      </BlurView>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="smart-toy" size={48} color={GlassTheme.textTertiary} />
            <Text style={styles.emptyText}>Start a conversation</Text>
          </View>
        )}

        {messages.map((msg) => {
          const isTyping = msg.isTyping && (typingIndex[msg.id] ?? 0) < msg.content.length;
          const displayedText = msg.content.substring(0, (typingIndex[msg.id] ?? 0) + 1);
          const showCursor = isTyping;

          return (
            <View key={msg.id}>
              <View style={[styles.messageRow, msg.role === 'user' && styles.userRow]}>
                <View style={[styles.messageBubble, msg.role === 'assistant' && styles.assistantBubble]}>
                  <Text style={[styles.messageText, msg.role === 'user' && styles.userText]}>
                    {displayedText}
                    {showCursor && <Text style={styles.cursor}>▌</Text>}
                  </Text>
                </View>
              </View>

              {/* CRUD Buttons for Assistant Messages */}
              {msg.role === 'assistant' && !isTyping && (
                <View style={styles.crudContainer}>
                  {CRUD_ACTIONS.map(action => (
                    <Pressable
                      key={action.id}
                      style={styles.crudButton}
                      onPress={() => saveToNote(msg.id, action.id as any)}
                    >
                      <MaterialIcons name={action.icon as any} size={14} color={GlassTheme.accentPrimary} />
                      <Text style={styles.crudLabel}>{action.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={GlassTheme.accentPrimary} />
          </View>
        )}
      </ScrollView>

      {/* Suggestions */}
      {messages.length > 0 && !isLoading && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsContainer}
          contentContainerStyle={styles.suggestionsContent}
        >
          {SUGGESTION_ACTIONS.map((action) => {
            const lastMsg = messages[messages.length - 1];
            const isDisabled = !lastMsg || lastMsg.role !== 'user';

            return (
              <Pressable
                key={action.id}
                style={[styles.suggestionButton, isDisabled && styles.suggestionButtonDisabled]}
                onPress={() => {
                  if (!isDisabled) {
                    sendMessage(lastMsg.content, action.id);
                  }
                }}
                disabled={isDisabled}
              >
                <MaterialIcons name={action.icon as any} size={16} color={isDisabled ? GlassTheme.textTertiary : GlassTheme.accentPrimary} />
                <Text style={[styles.suggestionLabel, isDisabled && styles.suggestionLabelDisabled]}>{action.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Input */}
      <BlurView intensity={50} tint="dark" style={[styles.inputContainer, { paddingBottom: keyboardHeight > 0 ? 12 : 16 }]}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor={GlassTheme.textPlaceholder}
            value={input}
            onChangeText={setInput}
            editable={!isLoading}
            multiline
            maxLength={1000}
          />
          <Pressable
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || isLoading}
          >
            <MaterialIcons
              name="send"
              size={20}
              color={input.trim() && !isLoading ? GlassTheme.accentPrimary : GlassTheme.textTertiary}
            />
          </Pressable>
        </View>
      </BlurView>
    </KeyboardAvoidingView>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GlassTheme.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: GlassTheme.textSecondary,
    marginTop: 8,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: GlassTheme.glassBackground,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
  },
  assistantBubble: {
    backgroundColor: `${GlassTheme.accentPrimary}15`,
    borderColor: GlassTheme.accentPrimary,
  },
  messageText: {
    fontSize: 13,
    color: GlassTheme.textPrimary,
    lineHeight: 18,
  },
  userText: {
    color: GlassTheme.textPrimary,
  },
  cursor: {
    color: GlassTheme.accentPrimary,
  },
  crudContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    paddingLeft: 16,
    flexWrap: 'wrap',
  },
  crudButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: `${GlassTheme.accentPrimary}10`,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GlassTheme.accentPrimary,
    gap: 4,
  },
  crudLabel: {
    fontSize: 11,
    color: GlassTheme.accentPrimary,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  suggestionsContainer: {
    borderTopWidth: 1,
    borderTopColor: GlassTheme.glassBorder,
    maxHeight: 50,
  },
  suggestionsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: GlassTheme.glassBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    gap: 5,
  },
  suggestionButtonDisabled: {
    opacity: 0.5,
  },
  suggestionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: GlassTheme.accentPrimary,
  },
  suggestionLabelDisabled: {
    color: GlassTheme.textTertiary,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: GlassTheme.glassBorder,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: GlassTheme.glassBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    color: GlassTheme.textPrimary,
    fontSize: 13,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: GlassTheme.glassBackground,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
