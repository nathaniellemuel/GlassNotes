/**
 * useAIEditor Hook
 * Separates AI logic from component presentation
 * Makes AI features reusable and testable
 */

import { useState, useCallback } from 'react';
import { processWithAI, AIAction } from '@/utils/ai-client';

interface UseAIEditorState {
  isProcessing: boolean;
  currentAction: AIAction | null;
  error: string | null;
}

interface UseAIEditorReturn extends UseAIEditorState {
  processText: (text: string, action: AIAction) => Promise<string | null>;
  clearError: () => void;
}

/**
 * Hook for AI text processing
 * Handles loading states, errors, and API communication
 */
export function useAIEditor(): UseAIEditorReturn {
  const [state, setState] = useState<UseAIEditorState>({
    isProcessing: false,
    currentAction: null,
    error: null,
  });

  const processText = useCallback(
    async (text: string, action: AIAction): Promise<string | null> => {
      // Reset error state
      setState((prev) => ({ ...prev, error: null }));

      // Validate input
      if (!text.trim()) {
        setState((prev) => ({
          ...prev,
          error: 'Please write something before using AI features.',
        }));
        return null;
      }

      // Set loading state
      setState((prev) => ({
        ...prev,
        isProcessing: true,
        currentAction: action,
      }));

      try {
        // Call AI API
        const result = await processWithAI(text, action);

        if (result.success && result.data) {
          // Clear error and processing state
          setState((prev) => ({
            ...prev,
            isProcessing: false,
            currentAction: null,
          }));

          return result.data;
        } else {
          // Set error message
          setState((prev) => ({
            ...prev,
            isProcessing: false,
            currentAction: null,
            error: result.error || 'Failed to process request',
          }));

          return null;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          currentAction: null,
          error: `Error: ${errorMessage}`,
        }));

        return null;
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    processText,
    clearError,
  };
}
