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
}

interface ChatBotProps {
  onClose?: () => void;
  initialText?: string;
}

const SUGGESTION_ACTIONS = [
  { id: 'summarize', label: 'Summarize', icon: 'summarize' },
  { id: 'translate', label: 'Translate', icon: 'translate' },
  { id: 'grammar', label: 'Fix Grammar', icon: 'spellcheck' },
  { id: 'improve', label: 'Improve', icon: 'auto-fix-high' },
] as const;

export function ChatBotAssistant({ onClose, initialText }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
      Alert.alert('Empty Message', 'Please type something first');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Add user message
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
      // Call AI
      const result = await callClaude(messageText, action);

      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.data || 'No response',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        Alert.alert('Error', result.error || 'Failed to get response');
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const callClaude = async (text: string, action?: string) => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
      console.log('[ChatBot] API Key exists:', !!apiKey);
      console.log('[ChatBot] API Key format:', apiKey?.substring(0, 10) + '...');

      if (!apiKey) {
        console.error('[ChatBot] API key not found in environment');
        return {
          success: false,
          error: 'API key not configured. Check .env file.',
        };
      }

      let systemPrompt = 'You are a helpful assistant for note-taking. Be concise and friendly.';

      if (action === 'summarize') {
        systemPrompt = 'You are a note-taking assistant. Summarize the provided text concisely while preserving key information. Return only the summary.';
      } else if (action === 'translate') {
        systemPrompt = 'You are a note-taking assistant. Translate the text to English. If already in English, translate to Spanish. Return only the translated text.';
      } else if (action === 'grammar') {
        systemPrompt = 'You are a note-taking assistant. Correct grammar, spelling, and punctuation errors. Maintain original meaning and tone. Return only the corrected text.';
      } else if (action === 'improve') {
        systemPrompt = 'You are a note-taking assistant. Improve clarity, readability, and tone of the text. Make it more engaging. Return only the improved text.';
      }

      console.log('[ChatBot] ====== Calling Open Router API ======');
      console.log('[ChatBot] Endpoint:', 'https://openrouter.ai/api/v1/chat/completions');
      console.log('[ChatBot] Method:', 'POST');
      console.log('[ChatBot] Action:', action || 'chat');
      console.log('[ChatBot] Text length:', text.length);

      const requestBody = {
        model: 'arcee-ai/trinity-large-preview:free',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        max_tokens: 2048,
      };

      console.log('[ChatBot] Request body:', JSON.stringify({
        ...requestBody,
        messages: [
          { role: 'system', content: systemPrompt.substring(0, 50) + '...' },
          { role: 'user', content: text.substring(0, 50) + '...' },
        ],
      }));

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://glassnotes.app',
          'X-Title': 'GlassNotes',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[ChatBot] Response status:', response.status, response.statusText);
      console.log('[ChatBot] Response headers:', {
        'content-type': response.headers.get('content-type'),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          console.log('[ChatBot] Error response body:', errorData);
          errorMessage = errorData.error?.message || JSON.stringify(errorData) || errorMessage;
        } catch (e) {
          const text = await response.text();
          console.log('[ChatBot] Error response text:', text);
          errorMessage = text || errorMessage;
        }
        return {
          success: false,
          error: `API Error: ${errorMessage}`,
        };
      }

      const data = await response.json();
      console.log('[ChatBot] Success! Response:', data);

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('[ChatBot] Invalid response structure:', data);
        return {
          success: false,
          error: 'Invalid response format from API',
        };
      }

      return {
        success: true,
        data: data.choices[0].message.content,
      };
    } catch (error) {
      console.error('[ChatBot] ====== CATCH ERROR ======');
      console.error('[ChatBot] Error type:', error?.constructor?.name);
      console.error('[ChatBot] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[ChatBot] Full error:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Connection Error: ${errorMessage}`,
      };
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
            <Text style={styles.emptySubtext}>Chat with AI or use suggestions</Text>
          </View>
        )}

        {messages.map((msg) => (
          <View key={msg.id} style={[styles.messageRow, msg.role === 'user' && styles.userRow]}>
            <View style={[styles.messageBubble, msg.role === 'assistant' && styles.assistantBubble]}>
              <Text style={[styles.messageText, msg.role === 'user' && styles.userText]}>
                {msg.content}
              </Text>
            </View>
          </View>
        ))}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={GlassTheme.accentPrimary} />
            <Text style={styles.loadingText}>Thinking...</Text>
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
          {SUGGESTION_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              style={styles.suggestionButton}
              onPress={() => {
                const lastMessage = messages[messages.length - 1];
                if (lastMessage.role === 'user') {
                  sendMessage(lastMessage.content, action.id);
                }
              }}
            >
              <MaterialIcons name={action.icon as any} size={16} color={GlassTheme.accentPrimary} />
              <Text style={styles.suggestionLabel}>{action.label}</Text>
            </Pressable>
          ))}
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
    paddingBottom: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: GlassTheme.textPrimary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: GlassTheme.textSecondary,
    marginTop: 4,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: GlassTheme.glassBackground,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
  },
  assistantBubble: {
    backgroundColor: `${GlassTheme.accentPrimary}15`,
    borderColor: GlassTheme.accentPrimary,
  },
  messageText: {
    fontSize: 14,
    color: GlassTheme.textPrimary,
    lineHeight: 20,
  },
  userText: {
    color: GlassTheme.textPrimary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: GlassTheme.textSecondary,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    gap: 6,
  },
  suggestionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: GlassTheme.accentPrimary,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: GlassTheme.glassBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    color: GlassTheme.textPrimary,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
