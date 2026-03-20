/**
 * INTEGRATION GUIDE: Adding AI Editor to Existing Notes Editor
 *
 * This file shows how to integrate the AIEditor component
 * into your existing app/editor.tsx screen.
 */

// ============================================================================
// SIMPLE INTEGRATION (Recommended)
// ============================================================================
// Replace your current editor with the AIEditor when the user taps the AI button

import React from 'react';
import { View, Pressable } from 'react-native';
import { AIEditor } from '@/components/ai-editor';
import { Note } from '@/types/note';
import { MaterialIcons } from '@expo/vector-icons';

interface IntegrationExampleProps {
  note: Note;
  onSave: (note: Note) => void;
  onClose: () => void;
}

export function IntegrationExample({ note, onSave, onClose }: IntegrationExampleProps) {
  const [showAIEditor, setShowAIEditor] = React.useState(false);

  const handleAISave = (processedText: string) => {
    // Update note with processed text
    const updatedNote: Note = {
      ...note,
      content: processedText,
      updatedAt: new Date().getTime(),
    };

    onSave(updatedNote);
    setShowAIEditor(false);
  };

  if (showAIEditor) {
    return (
      <AIEditor
        initialText={note.content}
        onSave={handleAISave}
        onClose={() => setShowAIEditor(false)}
      />
    );
  }

  return (
    <View>
      {/* Your existing editor UI */}
      {/* ... */}

      {/* AI Button in toolbar */}
      <Pressable onPress={() => setShowAIEditor(true)}>
        <MaterialIcons name="auto-fix-high" size={24} color="#8B5CF6" />
      </Pressable>
    </View>
  );
}

// ============================================================================
// ADVANCED INTEGRATION (With Custom UI)
// ============================================================================
// Use the useAIEditor hook for more control over the UI

import { useAIEditor } from '@/hooks/use-ai-editor';
import { Alert } from 'react-native';

interface AdvancedEditorProps {
  initialText: string;
}

export function AdvancedEditorExample({ initialText }: AdvancedEditorProps) {
  const [text, setText] = React.useState(initialText);
  const { isProcessing, error, clearError, processText } = useAIEditor();

  const handleAIAction = async (action: 'summarize' | 'translate' | 'grammar' | 'improve') => {
    const result = await processText(text, action);

    if (result) {
      setText(result);
      Alert.alert('Success', 'Text has been processed');
    } else if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  };

  return (
    <View>
      {/* Your editor */}
      <TextInput
        value={text}
        onChangeText={setText}
        editable={!isProcessing}
        placeholder="Your note..."
      />

      {/* AI Buttons */}
      <Pressable
        onPress={() => handleAIAction('summarize')}
        disabled={isProcessing}
      >
        <Text>Summarize</Text>
      </Pressable>

      <Pressable
        onPress={() => handleAIAction('grammar')}
        disabled={isProcessing}
      >
        <Text>Fix Grammar</Text>
      </Pressable>

      {/* Display error */}
      {error && (
        <View>
          <Text style={{ color: 'red' }}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// MINIMAL SETUP STEPS
// ============================================================================
/*

1. Update your app's .env file:
   EXPO_PUBLIC_API_URL=http://your-backend-url:3000

2. Start the backend server:
   cd server
   npm run dev

3. Import AIEditor in your editor screen:
   import { AIEditor } from '@/components/ai-editor';

4. Show it when user taps AI button:
   <AIEditor
     initialText={noteText}
     onSave={handleSave}
     onClose={handleClose}
   />

5. That's it! The component handles all AI logic.

*/

// ============================================================================
// API RESPONSE TYPES (For TypeScript integration)
// ============================================================================

interface AIProcessResponse {
  success: boolean;
  data?: string;
  error?: string;
}

// You can also extend the AIEditor component:
/*
<AIEditor
  initialText={note.content}
  onSave={(text) => {
    // Update note in your storage
    const updated = { ...note, content: text };
    saveNote(updated);
  }}
  onClose={closeEditor}
/>
*/
