import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import cors from 'cors';

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

// Initialize Anthropic client
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

function isValidScope(action: string, text: string): { valid: boolean; message?: string } {
  const validActions = ['summarize', 'translate', 'grammar', 'improve'];

  if (!validActions.includes(action)) {
    return {
      valid: false,
      message: 'The requested action is not supported for note-taking.',
    };
  }

  if (text.trim().length < 5) {
    return {
      valid: false,
      message: 'Please provide at least 5 characters of text to process.',
    };
  }

  return { valid: true };
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/ai/process', async (req, res) => {
  try {
    const { text, action } = req.body as AIProcessRequest;

    if (!text || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: text and action',
      });
    }

    const scopeCheck = isValidScope(action, text);
    if (!scopeCheck.valid) {
      return res.status(400).json({
        success: false,
        error: scopeCheck.message || 'Invalid request scope',
      });
    }

    const systemPrompt = SYSTEM_PROMPTS[action];
    if (!systemPrompt) {
      return res.status(400).json({
        success: false,
        error: 'Unknown action',
      });
    }

    const message = await client.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: text,
        },
      ],
    });

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

    return res.status(500).json({
      success: false,
      error: 'Failed to process request. Please try again later.',
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
