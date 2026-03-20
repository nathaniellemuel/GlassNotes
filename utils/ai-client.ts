/**
 * AI Client Utility
 * Handles communication with backend AI API
 * API key is handled server-side only (NOT exposed in frontend)
 */

export interface AIProcessResult {
  success: boolean;
  data?: string;
  error?: string;
}

export type AIAction = 'summarize' | 'translate' | 'grammar' | 'improve';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Process text with AI assistant
 * @param text - Text to process
 * @param action - AI action to perform
 * @returns Promise with processed text or error
 */
export async function processWithAI(
  text: string,
  action: AIAction
): Promise<AIProcessResult> {
  try {
    if (!text.trim()) {
      return {
        success: false,
        error: 'Text cannot be empty',
      };
    }

    const response = await fetch(`${API_BASE_URL}/api/ai/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: API key is NOT sent from client
      },
      body: JSON.stringify({
        text: text.trim(),
        action,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Server error: ${response.status}`,
      };
    }

    const result: AIProcessResult = await response.json();
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Connection failed: ${errorMessage}`,
    };
  }
}

/**
 * Validate if text is suitable for AI processing
 */
export function validateAIInput(text: string): { valid: boolean; message?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, message: 'Text cannot be empty' };
  }

  if (text.trim().length < 5) {
    return { valid: false, message: 'Text must be at least 5 characters' };
  }

  if (text.length > 10000) {
    return { valid: false, message: 'Text exceeds maximum length (10,000 characters)' };
  }

  return { valid: true };
}
