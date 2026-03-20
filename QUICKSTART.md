# AI Notes Editor - Quick Start Guide

## 📋 Pre-requisites

- [Anthropic API Key](https://console.anthropic.com/) - Free tier available
- Node.js 18+ installed
- npm installed

## 🚀 Quick Setup (5 minutes)

### Step 1: Get API Key
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Copy your API key (starts with `sk-ant-`)

### Step 2: Configure Backend

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file with your API key
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env
echo "PORT=3000" >> .env
echo "NODE_ENV=development" >> .env
echo "CLIENT_URL=http://localhost" >> .env
```

### Step 3: Start Backend Server

```bash
# From server/ directory
npm run dev
```

You should see:
```
AI Notes Server running on port 3000
Environment: development
```

### Step 4: Configure Frontend

Add to your Expo app's `.env` file:

```
# For local development (Android emulator)
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000

# For physical device or iOS simulator
EXPO_PUBLIC_API_URL=http://your-machine-ip:3000
```

### Step 5: Use the Component

In your editor screen:

```tsx
import { AIEditor } from '@/components/ai-editor';

export function EditorScreen() {
  const [showAI, setShowAI] = useState(false);

  return showAI ? (
    <AIEditor
      initialText="Your note here"
      onSave={(text) => {
        // Save your note
        setShowAI(false);
      }}
      onClose={() => setShowAI(false)}
    />
  ) : (
    // Your regular editor
    <View>
      <Button title="Open AI Editor" onPress={() => setShowAI(true)} />
    </View>
  );
}
```

## 🧪 Test It

1. **Start backend**: `cd server && npm run dev`
2. **Start app**: `npx expo start --android`
3. **Tap "Open AI Editor"** button
4. **Type something**: "hello worlld and fix this"
5. **Tap "Fix Grammar"**: Should return corrected text

## 📁 What You Got

```
GlassNotes/
├── components/
│   └── ai-editor.tsx              ← React Native component
├── utils/
│   └── ai-client.ts               ← API communication
├── hooks/
│   └── use-ai-editor.ts           ← React hook for AI logic
├── server/
│   ├── index.ts                   ← Express server
│   ├── routes/ai.ts               ← API endpoint
│   └── package.json               ← Dependencies
├── .env.example                   ← Template (copy to .env)
├── AI_EDITOR_README.md            ← Full documentation
├── API_EXAMPLES.ts                ← Request/response examples
└── INTEGRATION_GUIDE.tsx          ← Integration patterns
```

## 🎯 Features Included

| Feature | Button | What It Does |
|---------|--------|-------------|
| **Summarize** | Summarize | Condense long text to key points |
| **Translate** | Translate | Translate between English & Spanish |
| **Fix Grammar** | Fix Grammar | Correct grammar, spelling, punctuation |
| **Improve Writing** | Improve Writing | Make text clearer and more professional |

## ⚙️ Configuration

### Backend Environment Variables

```env
# Required
ANTHROPIC_API_KEY=sk-ant-your-key           # Your Claude API key
PORT=3000                                    # Server port

# Optional
NODE_ENV=development                         # Environment
CLIENT_URL=http://localhost                  # CORS origin
```

### Frontend Environment Variables

```env
# In your Expo .env file
EXPO_PUBLIC_API_URL=http://localhost:3000    # Backend URL
```

## 🔍 Debugging

### Backend won't start?
```bash
# Check port is free
lsof -i :3000

# Check API key is set
echo $ANTHROPIC_API_KEY

# Check Node version
node --version  # Should be 18+
```

### Frontend can't reach backend?
- Android emulator: Use `10.0.2.2:3000`
- Physical device: Use your machine's IP (find with `ipconfig`)
- iOS simulator: Use `localhost:3000`

### AI returns errors?
- Check text is at least 5 characters
- Verify action is one of: `summarize`, `translate`, `grammar`, `improve`
- Check server logs for details

## 📚 Learn More

- **Full README**: See `AI_EDITOR_README.md`
- **Integration Guide**: See `INTEGRATION_GUIDE.tsx`
- **API Examples**: See `API_EXAMPLES.ts`
- **Claude Docs**: https://docs.anthropic.com/

## 🛠️ Production Deployment

### Backend (Recommended Platforms)

**Option 1: Railway.app** (1-click deploy)
```bash
# 1. Push to GitHub
# 2. Connect repo at railway.app
# 3. Add ANTHROPIC_API_KEY in Variables
# 4. Deploy
```

**Option 2: Heroku** (Classic)
```bash
git push heroku main
# Set ANTHROPIC_API_KEY in Config Vars
```

**Option 3: Fly.io**
```bash
fly deploy
# Set secrets: fly secrets set ANTHROPIC_API_KEY=...
```

### Frontend (Expo EAS)

```bash
# Update EXPO_PUBLIC_API_URL to production URL
# Then build
eas build --platform android --auto-submit
```

## ❓ FAQ

**Q: Is my API key safe?**
A: Yes! It's stored server-side in `.env` and never sent to the client.

**Q: Can users see my API key?**
A: No. The key stays on your server. Clients only communicate via HTTP.

**Q: What's the rate limit?**
A: Claude's default limits apply. Ready to add custom limits in code.

**Q: Can I use other AI models?**
A: Yes, modify `server/routes/ai.ts` to use any Anthropic model.

**Q: What about costs?**
A: Check https://www.anthropic.com/pricing - Free tier available for testing.

## 📞 Support

- **API Issues**: https://console.anthropic.com/help
- **Component Issues**: Check `AI_EDITOR_README.md` troubleshooting
- **Integration Help**: See `INTEGRATION_GUIDE.tsx`

---

You're ready to go! 🎉

```bash
cd server && npm run dev
```

Then tap "Open AI Editor" in your app.
