import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Text,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassTheme } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { GlassToast } from '@/components/glass-toast';
import { AILoading } from '@/components/ai-loading';

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

const LANGUAGE_OPTIONS = [
  { id: 'english', label: 'English' },
  { id: 'spanish', label: 'Español' },
  { id: 'indonesian', label: 'Bahasa Indonesia' },
  { id: 'french', label: 'Français' },
  { id: 'german', label: 'Deutsch' },
  { id: 'japanese', label: '日本語' },
  { id: 'chinese', label: '中文' },
] as const;

// Clean markdown formatting from AI response
const cleanMarkdownResponse = (text: string): string => {
  // Remove **bold** markers
  return text
    .replace(/\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/###/g, '')
    .replace(/##/g, '')
    .replace(/#/g, '');
};

const CRUD_ACTIONS = [
  { id: 'append', label: 'Add to Note', icon: 'add-box' },
  { id: 'replace', label: 'Replace Note', icon: 'edit' },
  { id: 'prepend', label: 'Insert at Top', icon: 'vertical-align-top' },
] as const;

const AI_SYSTEM_PROMPT = `You are Glassy AI, a friendly writing assistant for a note-taking app. Help users with their note content.

ALLOWED:
- Summarize text
- Translate to other languages
- Fix grammar and spelling
- Improve writing clarity
- Reformat into bullet points
- Answer questions about note content

DO NOT:
- Generate images or code
- Answer general knowledge questions
- Go off-topic from the note
- Write harmful content

Always be concise. Respond in the user's language unless translating.`;

export function ChatBotAssistant({ onClose, onUpdateNote, currentNoteContent }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingIndex, setTypingIndex] = useState<{ [key: string]: number }>({});
  const [toast, setToast] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [pendingTranslateAction, setPendingTranslateAction] = useState<{ id: string } | null>(null);

  // Show welcome message on first load
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '0',
      role: 'assistant',
      content: `Hi! I'm Glassy AI, your friendly note-taking assistant! I can help you:
• Summarize your notes
• Translate to any language
• Fix grammar and spelling
• Improve writing and clarity
• Reformat into bullet points
• Answer questions about your content

Just describe what you need. After I respond, you can apply changes directly to your note using the buttons below!`,
      timestamp: Date.now(),
      isTyping: true,
      displayedContent: '',
    };
    setMessages([welcomeMessage]);
    setTypingIndex({ '0': 0 });
  }, []);

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
    }, 5);

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
    const capturedInput = input;
    const messageText = text || capturedInput.trim();

    if (!messageText) {
      setToast({ title: 'Empty Message', message: 'Please type something...', type: 'error' });
      return;
    }

    if (!currentNoteContent) {
      setToast({ title: 'No Note Content', message: 'Add text to your note first', type: 'error' });
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
        const cleanedResponse = cleanMarkdownResponse(result.data || 'No response');
        const assistantMessage: Message = {
          id: messageId,
          role: 'assistant',
          content: cleanedResponse,
          timestamp: Date.now(),
          isTyping: true,
          displayedContent: '',
        };
        setMessages(prev => [...prev, assistantMessage]);
        setTypingIndex(p => ({ ...p, [messageId]: 0 }));
      } else {
        const errorMsg = result.error || 'Something went wrong';
        setToast({
          title: 'Could not process',
          message: errorMsg === 'API key not configured' ? 'AI service unavailable' : errorMsg.substring(0, 60),
          type: 'error'
        });
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
      // Clean markdown before saving
      const cleanedContent = cleanMarkdownResponse(message.content);
      onUpdateNote?.(cleanedContent, action);
      const actionText = action === 'append' ? 'added' : action === 'replace' ? 'replaced' : 'inserted';
      setToast({ title: '✓ Saved', message: `Response ${actionText} to note!`, type: 'success' });
    }
  };

  const callAI = async (text: string, action?: string) => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

      if (!apiKey) {
        return { success: false, error: 'API key not configured' };
      }

      let systemPrompt = AI_SYSTEM_PROMPT;
      let userContent = text;

      // Add context for specific actions
      if (action === 'translate') {
        const lang = LANGUAGE_OPTIONS.find(l => l.id === selectedLanguage)?.label || 'English';
        systemPrompt = `Translate text to ${lang} ONLY. Output the translation and nothing else.`;
        userContent = `Translate to ${lang}:\n\n${currentNoteContent}`;
      } else if (action === 'summarize') {
        systemPrompt = `Summarize the text concisely. Output ONLY the summary, no extra text.`;
        userContent = `Summarize:\n\n${currentNoteContent}`;
      } else if (action === 'grammar') {
        systemPrompt = `Fix grammar and spelling. Output ONLY the corrected text, nothing else.`;
        userContent = `Fix grammar:\n\n${currentNoteContent}`;
      } else if (action === 'improve') {
        systemPrompt = `Improve clarity and tone. Make it engaging. Output ONLY the improved text.`;
        userContent = `Improve:\n\n${currentNoteContent}`;
      } else {
        // General chat with note context
        userContent = `My note: "${currentNoteContent}"\n\nMy question: ${text}`;
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://glassnotes.app',
          'X-Title': 'GlassNotes',
          'User-Agent': 'GlassNotes/1.0',
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.error || JSON.stringify(errorData);
        } catch (e) {
          const textError = await response.text();
          errorMessage = textError || errorMessage;
        }
        return { success: false, error: errorMessage };
      }

      const data = await response.json();

      if (!data.choices?.[0]?.message?.content) {
        return { success: false, error: 'Invalid response from AI' };
      }

      return { success: true, data: data.choices[0].message.content };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error';
      return {
        success: false,
        error: errorMsg.includes('abort') ? 'Request timeout. Please try again.' : errorMsg,
      };
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {toast && (
        <GlassToast
          title={toast.title}
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      <BlurView intensity={50} tint="dark" style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable onPress={onClose} hitSlop={8}>
            <MaterialIcons name="close" size={24} color={GlassTheme.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Glassy AI</Text>
          <View style={{ width: 24 }} />
        </View>
      </BlurView>

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
          const isTyping = msg.role === 'assistant' && msg.isTyping && (typingIndex[msg.id] ?? 0) < msg.content.length;
          const displayedText = isTyping
            ? msg.content.substring(0, (typingIndex[msg.id] ?? 0) + 1)
            : msg.content;
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

        {isLoading && <AILoading />}
      </ScrollView>

      {!isLoading && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.actionsContainer}
          contentContainerStyle={styles.actionsContent}
        >
          <Pressable
            style={styles.actionButton}
            onPress={() => sendMessage(undefined, 'summarize')}
          >
            <MaterialIcons name="summarize" size={16} color={GlassTheme.accentPrimary} />
            <Text style={styles.actionLabel}>Summarize</Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => setShowLanguagePicker(true)}
          >
            <MaterialIcons name="translate" size={16} color={GlassTheme.accentPrimary} />
            <Text style={styles.actionLabel}>Translate</Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => sendMessage(undefined, 'grammar')}
          >
            <MaterialIcons name="spellcheck" size={16} color={GlassTheme.accentPrimary} />
            <Text style={styles.actionLabel}>Fix Grammar</Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => sendMessage(undefined, 'improve')}
          >
            <MaterialIcons name="auto-fix-high" size={16} color={GlassTheme.accentPrimary} />
            <Text style={styles.actionLabel}>Improve</Text>
          </Pressable>
        </ScrollView>
      )}

      <BlurView intensity={50} tint="dark" style={[styles.inputContainer, { paddingBottom: keyboardHeight > 0 ? 12 : 16 }]}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything..."
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

      {/* Language Picker Modal */}
      <Modal visible={showLanguagePicker} transparent animationType="fade" onRequestClose={() => setShowLanguagePicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowLanguagePicker(false)}>
          <View style={styles.languageModal} onStartShouldSetResponder={() => true}>
            <Text style={styles.languageTitle}>Select Language</Text>
            {LANGUAGE_OPTIONS.map((lang) => (
              <Pressable
                key={lang.id}
                style={[styles.languageOption, selectedLanguage === lang.id && styles.languageOptionActive]}
                onPress={() => {
                  setSelectedLanguage(lang.id);
                  setShowLanguagePicker(false);
                  sendMessage(undefined, 'translate');
                }}
              >
                <Text style={[styles.languageOptionText, selectedLanguage === lang.id && styles.languageOptionTextActive]}>
                  {lang.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
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
  actionsContainer: {
    borderTopWidth: 1,
    borderTopColor: GlassTheme.glassBorder,
    maxHeight: 50,
  },
  actionsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  actionButton: {
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
  actionLabel: {
    fontSize: 11,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  languageModal: {
    backgroundColor: GlassTheme.glassBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    padding: 16,
    maxHeight: '80%',
    width: '100%',
  },
  languageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GlassTheme.textPrimary,
    marginBottom: 12,
  },
  languageOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: GlassTheme.backgroundPrimary,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
  },
  languageOptionActive: {
    backgroundColor: `${GlassTheme.accentPrimary}15`,
    borderColor: GlassTheme.accentPrimary,
  },
  languageOptionText: {
    fontSize: 14,
    color: GlassTheme.textSecondary,
  },
  languageOptionTextActive: {
    color: GlassTheme.accentPrimary,
    fontWeight: '600',
  },
});
