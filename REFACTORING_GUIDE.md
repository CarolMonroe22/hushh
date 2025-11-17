# 🔨 Refactoring Guide - Hushh

## 📋 Overview

This document outlines the refactoring work done on the Hushh application to improve maintainability, testability, and code organization.

---

## ✅ Completed Refactoring (Phase 1)

### 1. **Constants Extracted** ✅

**File:** `src/lib/constants/session-constants.ts`

Extracted all constants from Index.tsx into a dedicated module:

- Type definitions (Mood, Ambient, BinauralExperience, VoiceJourney)
- MOODS array with emojis and labels
- AMBIENTS array with emojis and labels
- BINAURAL_EXPERIENCES with descriptions
- VOICE_JOURNEYS with voice IDs and descriptions
- JOURNEY_VOICE_SETTINGS configuration
- VIBE_STARTERS templates
- TITLE_ROTATIONS for hero animation

**Benefits:**
- Centralized configuration
- Easy to maintain and update
- Reusable across components
- Better TypeScript autocomplete

**Usage:**
```typescript
import { MOODS, AMBIENTS, type Mood, type Ambient } from '@/lib/constants/session-constants';
```

---

### 2. **AppHeader Component** ✅

**File:** `src/components/header/AppHeader.tsx`

Extracted header navigation with user menu into a reusable component.

**Props:**
```typescript
interface AppHeaderProps {
  user: any | null;
  onShowHistory: () => void;
  onNavigateToAccount: () => void;
  onSignOut: () => void;
  onSignUp: () => void;
}
```

**Features:**
- Conditional rendering (logged in vs. logged out)
- User avatar with initials
- Dropdown menu with account options
- History button with tooltip
- Responsive design

**Usage:**
```typescript
<AppHeader
  user={user}
  onShowHistory={() => setShowHistory(true)}
  onNavigateToAccount={() => navigate('/account')}
  onSignOut={handleSignOut}
  onSignUp={() => setShowAuthModal(true)}
/>
```

---

### 3. **RotatingHeroTitle Component** ✅

**File:** `src/components/landing/RotatingHeroTitle.tsx`

Extracted the animated hero title into a standalone component.

**Features:**
- Automatic title rotation every 5 seconds
- Smooth fade transitions
- Responsive text sizing
- Gradient text effect
- Self-contained state management

**Usage:**
```typescript
<RotatingHeroTitle />
```

---

## 🚧 Planned Refactoring (Phase 2)

### 4. **Session Creator Components** ⬜

**To be created:**

```
src/components/session-creators/
├── QuickPreset.tsx          # Mood + Ambient selector
├── CreatorMode.tsx          # Custom vibe with AI interpretation
├── BinauralExperience.tsx   # 3D binaural selector
├── VoiceJourney.tsx         # Voice journey selector
└── index.ts                 # Barrel export
```

**QuickPreset Component:**
```typescript
interface QuickPresetProps {
  selectedMood: Mood | null;
  selectedAmbient: Ambient | null;
  onMoodChange: (mood: Mood) => void;
  onAmbientChange: (ambient: Ambient) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}
```

**CreatorMode Component:**
```typescript
interface CreatorModeProps {
  vibeDescription: string;
  onDescriptionChange: (desc: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  vibeStarters: typeof VIBE_STARTERS;
}
```

---

### 5. **Audio Player Components** ⬜

**To be created:**

```
src/components/audio-player/
├── AudioPlayer.tsx          # Main player container
├── AudioControls.tsx        # Play/Pause/Stop buttons
├── AudioTimer.tsx           # Countdown timer display
├── AudioProgress.tsx        # Progress bar
├── SessionComplete.tsx      # Completion screen with feedback
└── index.ts                 # Barrel export
```

**AudioPlayer Component:**
```typescript
interface AudioPlayerProps {
  isPlaying: boolean;
  isPaused: boolean;
  timeLeft: number;
  totalDuration: number;
  loopEnabled: boolean;
  loopCount: number;
  generatedTitle: string;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onToggleLoop: () => void;
}
```

**SessionComplete Component:**
```typescript
interface SessionCompleteProps {
  sessionTitle: string;
  loopCount: number;
  onReplay: () => void;
  onNewSession: () => void;
  onFeedback: (type: 'loved' | 'liked') => void;
  onJoinWaitlist: (email: string) => void;
}
```

---

### 6. **Custom Hooks** ⬜

**To be created:**

```
src/hooks/
├── useAudioPlayer.ts        # Audio playback logic
├── useBinauralAudio.ts      # 3D audio with Web Audio API
├── useSessionGeneration.ts  # Session generation logic
├── useTimer.ts              # Countdown timer logic
└── useLoopControl.ts        # Loop functionality
```

**useAudioPlayer Hook:**
```typescript
interface UseAudioPlayerOptions {
  audioUrl?: string;
  duration: number;
  loopEnabled: boolean;
  onComplete?: () => void;
  onTimeUpdate?: (timeLeft: number) => void;
}

export const useAudioPlayer = (options: UseAudioPlayerOptions) => {
  // Returns:
  // - play()
  // - pause()
  // - stop()
  // - resume()
  // - isPlaying
  // - isPaused
  // - timeLeft
};
```

**useBinauralAudio Hook:**
```typescript
export const useBinauralAudio = () => {
  // Returns:
  // - setupBinaural(audioRef: HTMLAudioElement)
  // - startAnimation()
  // - stopAnimation()
  // - cleanup()
};
```

---

## 📁 Proposed File Structure

```
src/
├── components/
│   ├── header/
│   │   ├── AppHeader.tsx ✅
│   │   └── index.ts
│   ├── landing/
│   │   ├── RotatingHeroTitle.tsx ✅
│   │   └── index.ts
│   ├── session-creators/
│   │   ├── QuickPreset.tsx ⬜
│   │   ├── CreatorMode.tsx ⬜
│   │   ├── BinauralExperience.tsx ⬜
│   │   ├── VoiceJourney.tsx ⬜
│   │   └── index.ts
│   ├── audio-player/
│   │   ├── AudioPlayer.tsx ⬜
│   │   ├── AudioControls.tsx ⬜
│   │   ├── AudioTimer.tsx ⬜
│   │   ├── SessionComplete.tsx ⬜
│   │   └── index.ts
│   ├── SessionHistory.tsx ✅ (existing)
│   ├── AuthModal.tsx ✅ (existing)
│   └── AmbientBackground.tsx ✅ (existing)
├── hooks/
│   ├── useAuth.tsx ✅ (existing)
│   ├── useUserSessions.ts ✅ (existing)
│   ├── useConnectivity.ts ✅ (existing)
│   ├── useAudioPlayer.ts ⬜
│   ├── useBinauralAudio.ts ⬜
│   ├── useSessionGeneration.ts ⬜
│   ├── useTimer.ts ⬜
│   └── useLoopControl.ts ⬜
├── lib/
│   ├── constants/
│   │   └── session-constants.ts ✅
│   ├── utils.ts ✅ (existing)
│   └── audio-utils.ts ⬜ (to be created)
└── pages/
    └── Index.tsx (simplified, <300 lines target)
```

---

## 🎯 Refactoring Strategy

### Phase 1: Foundation ✅ (COMPLETED)
- [x] Extract constants
- [x] Create AppHeader component
- [x] Create RotatingHeroTitle component
- [x] Setup testing infrastructure
- [x] Document refactoring plan

### Phase 2: Session Creators (Next)
- [ ] Extract QuickPreset component
- [ ] Extract CreatorMode component
- [ ] Extract BinauralExperience component
- [ ] Extract VoiceJourney component
- [ ] Add tests for each component

### Phase 3: Audio Player
- [ ] Create useAudioPlayer hook
- [ ] Create useBinauralAudio hook
- [ ] Extract AudioPlayer component
- [ ] Extract SessionComplete component
- [ ] Add audio player tests

### Phase 4: Integration
- [ ] Refactor Index.tsx to use new components
- [ ] Ensure all functionality works
- [ ] Add integration tests
- [ ] Performance optimization

### Phase 5: Polish
- [ ] Code review
- [ ] Documentation updates
- [ ] Accessibility improvements
- [ ] Final testing

---

## 🔧 How to Use Extracted Components

### Current Usage (Before Full Refactor)

You can start using the extracted components immediately:

```typescript
// src/pages/Index.tsx
import { AppHeader } from "@/components/header/AppHeader";
import { RotatingHeroTitle } from "@/components/landing/RotatingHeroTitle";
import {
  MOODS,
  AMBIENTS,
  BINAURAL_EXPERIENCES,
  VOICE_JOURNEYS,
  type Mood,
  type Ambient,
} from "@/lib/constants/session-constants";

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="relative min-h-screen">
      <AppHeader
        user={user}
        onShowHistory={() => setShowHistory(true)}
        onNavigateToAccount={() => navigate('/account')}
        onSignOut={handleSignOut}
        onSignUp={() => setShowAuthModal(true)}
      />

      <div className="container mx-auto px-4 py-16">
        <RotatingHeroTitle />

        {/* Rest of your session creators... */}
      </div>
    </div>
  );
};
```

---

## 📊 Metrics Comparison

### Before Refactoring
```
Index.tsx: 2,267 lines
- 50+ state variables
- 30+ functions
- 5+ useEffect hooks
- 0 tests
```

### After Phase 1 Refactoring
```
Index.tsx: 2,267 lines (still)
session-constants.ts: 250 lines (extracted)
AppHeader.tsx: 110 lines (extracted)
RotatingHeroTitle.tsx: 40 lines (extracted)

Tests added:
- useAuth.test.tsx
- utils.test.ts
- Test infrastructure setup
```

### Target (After All Phases)
```
Index.tsx: <300 lines
Components: 15+ small, focused files
Hooks: 8+ reusable hooks
Test coverage: >80%
```

---

## ⚠️ Important Notes

### Breaking Changes
- None yet! All changes are additive.
- Existing code continues to work.

### Migration Strategy
1. **Incremental:** Refactor one component at a time
2. **Test-driven:** Add tests before refactoring
3. **Non-breaking:** Keep old code working until new is tested
4. **Review:** Each phase goes through code review

### Rollback Plan
If issues arise:
1. Git history preserved for each phase
2. Can revert individual commits
3. Feature flags for new components (if needed)

---

## 🧪 Testing Strategy

Each new component should have:

1. **Unit Tests:**
   - Component renders correctly
   - Props are handled properly
   - Events are emitted correctly

2. **Integration Tests:**
   - Component works with parent
   - State management flows correctly
   - User interactions work end-to-end

3. **Accessibility Tests:**
   - Keyboard navigation
   - Screen reader support
   - ARIA labels

---

## 📚 References

- **Original File:** `src/pages/Index.tsx` (2,267 lines)
- **Review Document:** `REVIEW_HUSHH.md`
- **Testing Guide:** `TESTING.md`
- **Environment Setup:** `ENVIRONMENT_SETUP.md`

---

## 🚀 Next Steps

**Immediate (This Week):**
1. Review this refactoring guide
2. Test extracted components
3. Plan Phase 2 work

**Short-term (Next 2 Weeks):**
4. Extract session creator components
5. Add tests for each
6. Update Index.tsx to use them

**Medium-term (Next Month):**
7. Extract audio player components
8. Create custom hooks
9. Achieve >80% test coverage

---

**Last Updated:** 2025-11-17
**Status:** Phase 1 Complete ✅
**Next Phase:** Session Creator Components
