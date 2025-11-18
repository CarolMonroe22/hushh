# Hushh - AI-Powered Personalized Audio Experiences

Hushh is an innovative web application that generates personalized 1-minute audio experiences for wellness, sleep, focus, and relaxation using AI technology.

## Project info

**URL**: https://lovable.dev/projects/9998cf32-2dd2-4880-8c79-cd1f6b36cdb8
**Live App**: https://hushh.lovable.app/

## Features

- 🎧 **Quick Preset Sessions**: Combine moods (relax, sleep, focus, gratitude, boost, stoic) with ambient sounds
- 🎨 **Creator Mode**: Describe your desired vibe and get custom AI-generated audio
- 🎯 **3D Binaural Experiences**: Immersive spatial audio (barbershop, spa, yoga, etc.)
- 🗣️ **Voice Journeys**: AI-generated spoken content with voice selection
- 📚 **Session Library**: Save, replay, and favorite your sessions
- 🔐 **User Authentication**: Email/password and Google OAuth support

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/9998cf32-2dd2-4880-8c79-cd1f6b36cdb8) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

### Frontend
- **Vite** - Build tool and dev server
- **TypeScript** - Type-safe development
- **React 18** - UI library
- **shadcn-ui** - Component library built on Radix UI
- **Tailwind CSS** - Utility-first styling
- **TanStack React Query** - Server state management
- **React Router v6** - Client-side routing

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (Email/Password + Google OAuth)
  - Row Level Security (RLS)
  - Edge Functions (Deno runtime)
  - Storage for audio files

### External APIs
- **ElevenLabs Music API** - AI music generation
- **ElevenLabs Voice API** - AI voice synthesis

## Environment Setup

1. Copy the example environment file:
```sh
cp .env.example .env
```

2. Fill in your Supabase credentials in `.env`:
```
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

3. Get your Supabase credentials from: https://app.supabase.com/project/_/settings/api

## Project Structure

```
src/
├── components/        # React components
│   ├── ui/           # shadcn-ui components
│   └── ...           # Feature components
├── hooks/            # Custom React hooks
├── integrations/     # Third-party integrations (Supabase)
├── lib/              # Utility functions
├── pages/            # Page components
└── main.tsx          # Application entry point

supabase/
├── functions/        # Supabase Edge Functions
└── migrations/       # Database migrations
```

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9998cf32-2dd2-4880-8c79-cd1f6b36cdb8) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
