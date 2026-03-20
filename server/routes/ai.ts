import express, { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();

// Initialize Anthropic client with API key from environment
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface AIProcessRequest {
  text: string;
  action: 'summarize' | 'translate' | 'grammar' | 'improve';
}

interface AIResponse {
  success: boolean;
  data?: string;
  error?: string;
}

// System prompts for different AI actions
const SYSTEM_PROMPTS: Record<string, string> = {
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

// Validation: Check if request is within scope
function isValidScope(action: string, text: string): { valid: boolean; message?: string } {
  const validActions = ['summarize', 'translate', 'grammar', 'improve'];

  if (!validActions.includes(action)) {
    return {
      valid: false,
      message: 'The requested action is not supported for note-taking.',
    };
  }

  // Basic check: reject extremely short inputs
  if (text.trim().length < 5) {
    return {
      valid: false,
      message: 'Please provide at least 5 characters of text to process.',
    };
  }

  return { valid: true };
}

/**
 * POST /api/ai/process
 * Process text with AI assistant for note-taking assistance
 *
 * Request body:
 * {
 *   "text": "string - the text to process",
 *   "action": "summarize | translate | grammar | improve"
 * }
 *
 * Response:
 * {
 *   "success": boolean,
 *   "data": "string - processed text",
 *   "error": "string - error message if failed"
 * }
 */
router.post('/process', async (req: Request, res: Response<AIResponse>) => {
  try {
    const { text, action } = req.body as AIProcessRequest;

    // Validate input
    if (!text || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: text and action',
      });
    }

    // Check scope
    const scopeCheck = isValidScope(action, text);
    if (!scopeCheck.valid) {
      return res.status(400).json({
        success: false,
        error: scopeCheck.message || 'Invalid request scope',
      });
    }

    // Get appropriate system prompt
    const systemPrompt = SYSTEM_PROMPTS[action];
    if (!systemPrompt) {
      return res.status(400).json({
        success: false,
        error: 'Unknown action',
      });
    }

    // Call Claude AI API with strict constraints
    const message = await client.messages.create({
      model: 'claude-opus-4-1', // Trinity Large Preview or latest available
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: text,
        },
      ],
    });

    // Extract text response
    const responseContent = message.content[0];
    if (responseContent.type !== 'text') {
      return res.status(500).json({
        success: false,
        error: 'Unexpected response format from AI service',
      });
    }

    return res.json({
      success: true,
      data: responseContent.text.trim(),
    });
  } catch (error) {
    console.error('AI processing error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    // Return user-friendly error message
    return res.status(500).json({
      success: false,
      error: 'Failed to process request. Please try again later.',
    });
  }
});

export default router;
