/**
 * ⚠️ WARNING: This implementation exposes API keys in frontend code.
 * For production, implement a proper backend proxy.
 * This is TEMPORARY - for development only.
 */

import Anthropic from '@anthropic-ai/sdk';

export interface AIProcessResult {
  success: boolean;
  data?: string;
  error?: string;
}

export type AIAction = 'summarize' | 'translate' | 'grammar' | 'improve';

const SYSTEM_PROMPTS: Record<AIAction, string> = {
  summarize: `You are a note-taking assistant. Your task is to summarize the provided text concisely while preserving key information.
Return only the summary without any additional explanation.`,

  translate: `You are a note-taking assistant. Your task is to translate the provided text to English.
If the text is already in English, provide a brief translation into Spanish.
Return only the translated text without any additional explanation.`,

  grammar: `You are a note-taking assistant. Your task is to correct grammar, spelling, and punctuation errors in the provided text.
Maintain the original meaning and tone.
Return only the corrected text without any additional explanation.`,

  improve: `You are a note-taking assistant. Your task is to improve the clarity, readability, and tone of the provided text.
Make it more engaging and professional while keeping the original meaning.
Return only the improved text without any additional explanation.`,
};

/**
 * Process text with Claude AI directly from frontend
 * ⚠️ API key is exposed in code - NOT for production
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

    const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'API key not configured. Add EXPO_PUBLIC_ANTHROPIC_API_KEY to .env',
      };
    }

    // Initialize Anthropic client with frontend key
    const client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    const message = await client.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 2048,
      system: SYSTEM_PROMPTS[action],
      messages: [
        {
          role: 'user',
          content: text.trim(),
        },
      ],
    });

    const responseContent = message.content[0];
    if (responseContent.type !== 'text') {
      return {
        success: false,
        error: 'Unexpected response format from AI service',
      };
    }

    return {
      success: true,
      data: responseContent.text.trim(),
    };
  } catch (error) {
    console.error('[AI Client] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to process: ${errorMessage}`,
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

