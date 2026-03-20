# AI-Powered Notes Editor

Production-ready template for integrating Claude AI into your GlassNotes editor.

## Features

✅ **Allowed Capabilities**
- Summarization
- Translation
- Grammar correction
- Text improvement (clarity, tone, rewriting)
- Answering general factual questions about notes
- Reference suggestions (links only, no image generation)

🚫 **Restricted**
- Image generation
- Off-topic/inappropriate requests
- Unrelated content processing

## Architecture

```
┌─────────────────────────────────────────┐
│       React Native Frontend (Expo)       │
│  ┌─────────────────────────────────┐     │
│  │  AIEditor Component             │     │
│  │  - Text input                   │     │
│  │  - AI action buttons            │     │
│  │  - Response display             │     │
│  └─────────────────────────────────┘     │
└──────────────────┬──────────────────────┘
                   │ HTTP(S)
                   ▼
┌─────────────────────────────────────────┐
│        Express Backend Server            │
│  ┌─────────────────────────────────┐     │
│  │  POST /api/ai/process           │     │
│  │  - Validates request            │     │
│  │  - Checks scope                 │     │
│  │  - Calls Claude API             │     │
│  │  - Returns processed text       │     │
│  └─────────────────────────────────┘     │
└──────────────────┬──────────────────────┘
                   │ API Key (server-side only)
                   ▼
        ┌──────────────────────┐
        │  Anthropic Claude    │
        │  API (Trinity Large) │
        └──────────────────────┘
```

## Setup

### 1. Backend Configuration

```bash
# Install server dependencies
cd server
npm install

# Create .env file in server directory
cp ../.env.example .env

# Edit .env and add your Anthropic API key
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 2. Frontend Configuration

Add to your Expo app's `.env` file:

```
EXPO_PUBLIC_API_URL=http://your-backend-url:3000
```

Or for local development (Android emulator):
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

### 3. Start the Backend Server

```bash
cd server

# Development with hot reload
npm run dev

# Production build
npm run build
npm start
```

## Usage

### Import and Use the Component

```tsx
import { AIEditor } from '@/components/ai-editor';

export function MyScreen() {
  const [showEditor, setShowEditor] = useState(false);

  const handleSave = (text: string) => {
    // Save processed text
    console.log('Saved:', text);
    setShowEditor(false);
  };

  return (
    <>
      <Button title="Open AI Editor" onPress={() => setShowEditor(true)} />

      {showEditor && (
        <AIEditor
          initialText="Your initial text here"
          onSave={handleSave}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
}
```

### Or Use the AI Client Directly

```tsx
import { processWithAI } from '@/utils/ai-client';

const result = await processWithAI(text, 'summarize');
if (result.success) {
  console.log(result.data); // Processed text
} else {
  console.error(result.error);
}
```

## API Endpoints

### POST /api/ai/process

Process text with AI assistant.

**Request:**
```json
{
  "text": "Your note text here...",
  "action": "summarize|translate|grammar|improve"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": "Processed text here..."
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Security

✅ **API Key Protection**
- API key stored in server `.env` only
- Never exposed to frontend
- All AI requests validated server-side

✅ **Input Validation**
- Text length limits (5-10,000 characters)
- Action scope validation
- Rate limiting ready (implement as needed)

✅ **Scope Enforcement**
- System prompts restrict AI to note-taking assistance
- Invalid requests rejected with clear messages
- Error responses don't leak system information

## Troubleshooting

**"Connection Error"**
- Ensure backend server is running
- Check `EXPO_PUBLIC_API_URL` is correct
- Use `http://10.0.2.2:3000` for Android emulator

**"API error: 401"**
- Verify `ANTHROPIC_API_KEY` is set in server `.env`
- Check API key is valid at https://console.anthropic.com/

**Empty response**
- Verify text input is at least 5 characters
- Check server logs for processing errors

## File Structure

```
GlassNotes/
├── components/
│   └── ai-editor.tsx              # AI editor component
├── utils/
│   └── ai-client.ts               # Frontend API client
├── server/
│   ├── index.ts                   # Express server
│   ├── routes/
│   │   └── ai.ts                  # AI API routes
│   ├── package.json               # Server dependencies
│   ├── tsconfig.json              # TypeScript config
│   └── dist/                       # Compiled JavaScript (after build)
└── .env.example                   # Environment template
```

## Next Steps

- [ ] Implement rate limiting (express-rate-limit)
- [ ] Add request logging and monitoring
- [ ] Deploy backend to production (Heroku, Railway, Fly.io)
- [ ] Add analytics for AI usage
- [ ] Implement caching for repeated requests
- [ ] Add unit tests for API routes
- [ ] Set up error tracking (Sentry, Rollbar)
