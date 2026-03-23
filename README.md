# GlassNotes

A modern note-taking app built with Expo + React Native, with a glassmorphism interface and AI-assisted writing tools.

![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-0a0a0a)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-1b1b1b)
![React Native](https://img.shields.io/badge/React%20Native-0.81-20232a)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)

## Overview

GlassNotes helps you capture thoughts quickly, organize notes, manage todos, and edit content with AI support.

Core tabs:
- Notes explorer with folders
- Rich editor
- Todo manager
- Calendar view
- Settings

## Features

- Beautiful glass-style UI with smooth animations
- Rich text editing (bold, italic, list styles, text color)
- Checklist support inside notes
- Image insert and editing tools (rotate, crop, mirror, reorder)
- Folder-based organization with optional password lock
- Reminder notifications
- AI assistant for editing, summarizing, improving writing
- Todo generation with AI
- Local-first storage

## Tech Stack

- Expo SDK 54
- React Native 0.81
- Expo Router
- TypeScript
- Reanimated
- AsyncStorage
- Expo Notifications
- Expo Image Picker + Image Manipulator

## Project Structure

```text
app/                Routes and screens
components/         Reusable UI components
hooks/              App hooks (notes, todos, settings, notifications)
utils/              Helpers (storage, id, formatting, ai client)
types/              Type definitions
assets/             Static assets and screenshots
android/            Native Android project (prebuild)
```

## Screenshots Template

Add your screenshots to this folder:
- assets/screenshots

Use these filenames:
- home.png
- editor.png
- todos.png
- calendar.png
- settings.png
- ai-assistant.png

Gallery block (auto-works after you add files):

| Home | Editor |
| --- | --- |
| ![Home](assets/screenshots/home.png) | ![Editor](assets/screenshots/editor.png) |

| Todos | Calendar |
| --- | --- |
| ![Todos](assets/screenshots/todos.png) | ![Calendar](assets/screenshots/calendar.png) |

| Settings | AI Assistant |
| --- | --- |
| ![Settings](assets/screenshots/settings.png) | ![AI Assistant](assets/screenshots/ai-assistant.png) |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a .env file in the project root:

```env
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

Important:
- Do not commit real API keys
- Use env secrets for CI/CD and build servers

### 3. Run in development

```bash
npm run start
```

Then choose platform:

```bash
npm run android
npm run ios
npm run web
```

## Android Build (EAS)

```bash
eas build --platform android --profile preview
```

## Permissions

Android permissions used:
- Camera
- Media/images access
- Internet
- Notification-related capabilities

Configured in app.json and Android manifest.

## Security Notes

- Keep API keys out of source control
- If a key is exposed, rotate it immediately
- Consider using a backend proxy for production AI calls

## Roadmap Ideas

- Cloud sync and account system
- Shared notes/collaboration
- Markdown export
- End-to-end encryption for private notes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

## License

Add your preferred license here (MIT, Apache-2.0, etc.).
