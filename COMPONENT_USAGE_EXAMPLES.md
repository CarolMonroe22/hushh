# 📚 Component Usage Examples - Phase 2 Refactoring

This document provides practical examples of how to use the newly extracted components from Phase 2 refactoring.

---

## 🎨 Session Creator Components

### 1. QuickPreset Component

Used for selecting mood + ambient combinations.

```typescript
import { useState } from 'react';
import { QuickPreset } from '@/components/session-creators';
import { type Mood, type Ambient } from '@/lib/constants/session-constants';

function MyComponent() {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [selectedAmbient, setSelectedAmbient] = useState<Ambient | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Your generation logic here
    // await generateSession(selectedMood, selectedAmbient);
    setIsGenerating(false);
  };

  return (
    <QuickPreset
      selectedMood={selectedMood}
      selectedAmbient={selectedAmbient}
      onMoodChange={setSelectedMood}
      onAmbientChange={setSelectedAmbient}
      onGenerate={handleGenerate}
      isGenerating={isGenerating}
    />
  );
}
```

---

### 2. CreatorMode Component

Used for custom vibe description with AI interpretation.

```typescript
import { useState } from 'react';
import { CreatorMode } from '@/components/session-creators';

function MyComponent() {
  const [vibeDescription, setVibeDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (vibeDescription.trim().length < 20) {
      alert('Please provide at least 20 characters');
      return;
    }

    setIsGenerating(true);
    // Your generation logic here
    // const interpretedData = await interpretVibe(vibeDescription);
    // const audioData = await generateCustomASMR(interpretedData.prompt);
    setIsGenerating(false);
  };

  return (
    <CreatorMode
      vibeDescription={vibeDescription}
      onDescriptionChange={setVibeDescription}
      onGenerate={handleGenerate}
      isGenerating={isGenerating}
    />
  );
}
```

---

### 3. BinauralExperience Component

Used for 3D binaural audio experiences.

```typescript
import { useState } from 'react';
import { BinauralExperience } from '@/components/session-creators';
import { type BinauralExperience as BinauralExperienceType } from '@/lib/constants/session-constants';

function MyComponent() {
  const [selectedExperience, setSelectedExperience] = useState<BinauralExperienceType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Your generation logic here
    // await generateBinauralExperience(selectedExperience);
    setIsGenerating(false);
  };

  return (
    <BinauralExperience
      selectedExperience={selectedExperience}
      onExperienceChange={setSelectedExperience}
      onGenerate={handleGenerate}
      isGenerating={isGenerating}
    />
  );
}
```

---

### 4. VoiceJourney Component

Used for guided voice journeys with optional ambient sounds.

```typescript
import { useState } from 'react';
import { VoiceJourney } from '@/components/session-creators';
import { type VoiceJourney as VoiceJourneyType, type Ambient } from '@/lib/constants/session-constants';

function MyComponent() {
  const [selectedJourney, setSelectedJourney] = useState<VoiceJourneyType | null>(null);
  const [voiceGender, setVoiceGender] = useState<"female" | "male">("female");
  const [withAmbient, setWithAmbient] = useState(false);
  const [ambientForJourney, setAmbientForJourney] = useState<Ambient | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Your generation logic here
    // await generateVoiceJourney(selectedJourney, voiceGender, withAmbient ? ambientForJourney : null);
    setIsGenerating(false);
  };

  return (
    <VoiceJourney
      selectedJourney={selectedJourney}
      voiceGender={voiceGender}
      withAmbient={withAmbient}
      ambientForJourney={ambientForJourney}
      onJourneyChange={setSelectedJourney}
      onVoiceGenderChange={setVoiceGender}
      onWithAmbientChange={setWithAmbient}
      onAmbientChange={setAmbientForJourney}
      onGenerate={handleGenerate}
      isGenerating={isGenerating}
    />
  );
}
```

---

## 🎵 Audio Player Components

### 5. useAudioPlayer Hook

Custom hook for managing audio playback.

```typescript
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

function MyComponent() {
  const audioPlayer = useAudioPlayer({
    initialDuration: 60,
    loopEnabled: false,
    onComplete: () => {
      console.log('Session completed!');
      setIsComplete(true);
    },
    onLoopComplete: () => {
      console.log('Loop completed!');
    },
  });

  const handlePlay = async (audioUrl: string) => {
    try {
      await audioPlayer.play(audioUrl, 60);
      toast({ title: "Playing..." });
    } catch (error) {
      toast({ title: "Error playing audio", variant: "destructive" });
    }
  };

  return (
    <div>
      <button onClick={() => handlePlay('https://example.com/audio.mp3')}>
        Play
      </button>
      <button onClick={audioPlayer.pause}>Pause</button>
      <button onClick={audioPlayer.resume}>Resume</button>
      <button onClick={audioPlayer.stop}>Stop</button>
      <button onClick={audioPlayer.replay}>Replay</button>

      <div>Time left: {audioPlayer.timeLeft}s</div>
      <div>Playing: {audioPlayer.isPlaying ? 'Yes' : 'No'}</div>
      <div>Paused: {audioPlayer.isPaused ? 'Yes' : 'No'}</div>
      <div>Loop count: {audioPlayer.loopCount}</div>
    </div>
  );
}
```

---

### 6. AudioControls Component

Displays playback controls with timer.

```typescript
import { AudioControls } from '@/components/audio-player';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

function MyComponent() {
  const [loopEnabled, setLoopEnabled] = useState(false);
  const audioPlayer = useAudioPlayer({ loopEnabled });

  return (
    <AudioControls
      isPlaying={audioPlayer.isPlaying}
      isPaused={audioPlayer.isPaused}
      loopEnabled={loopEnabled}
      loopCount={audioPlayer.loopCount}
      timeLeft={audioPlayer.timeLeft}
      generatedTitle="Deep Focus Session"
      needsManualPlay={false}
      onPauseResume={audioPlayer.isPaused ? audioPlayer.resume : audioPlayer.pause}
      onStop={audioPlayer.stop}
      onToggleLoop={() => setLoopEnabled(!loopEnabled)}
    />
  );
}
```

---

### 7. SessionComplete Component

Displays completion screen with feedback and replay options.

```typescript
import { SessionComplete } from '@/components/audio-player';

function MyComponent() {
  const [loopCount, setLoopCount] = useState(0);

  const handleReplay = () => {
    // Restart the audio
    audioPlayer.replay();
  };

  const handleNewSession = () => {
    // Reset state and show session creators
    setIsComplete(false);
    setSelectedMood(null);
    setSelectedAmbient(null);
  };

  const handleFeedback = (type: 'loved' | 'liked') => {
    console.log('User feedback:', type);
    // Send feedback to backend
  };

  const handleWaitlist = (email: string) => {
    console.log('Waitlist email:', email);
    // Add to waitlist
  };

  return (
    <SessionComplete
      sessionTitle="Deep Focus with Rain"
      loopCount={loopCount}
      onReplay={handleReplay}
      onNewSession={handleNewSession}
      onFeedback={handleFeedback}
      onJoinWaitlist={handleWaitlist}
    />
  );
}
```

---

## 🏗️ Complete Integration Example

Here's how all components work together in a typical flow:

```typescript
import { useState } from 'react';
import { QuickPreset, CreatorMode } from '@/components/session-creators';
import { AudioControls, SessionComplete } from '@/components/audio-player';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { type Mood, type Ambient } from '@/lib/constants/session-constants';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

function SessionCreatorPage() {
  // Session type state
  const [sessionMode, setSessionMode] = useState<'preset' | 'creator' | null>(null);

  // Preset state
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [selectedAmbient, setSelectedAmbient] = useState<Ambient | null>(null);

  // Creator state
  const [vibeDescription, setVibeDescription] = useState('');

  // Session state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [loopEnabled, setLoopEnabled] = useState(false);

  // Audio player
  const audioPlayer = useAudioPlayer({
    loopEnabled,
    onComplete: () => setIsComplete(true),
  });

  const handlePresetGenerate = async () => {
    setIsGenerating(true);
    setSessionMode('preset');

    try {
      // Call your Supabase function
      const response = await supabase.functions.invoke('generate-asmr-session', {
        body: { mood: selectedMood, ambient: selectedAmbient },
      });

      if (response.data?.audioContent) {
        // Convert base64 to blob
        const audioBlob = base64ToBlob(response.data.audioContent);
        const audioUrl = URL.createObjectURL(audioBlob);

        // Play audio
        await audioPlayer.play(audioUrl, 60);
        setGeneratedTitle(`${selectedMood} with ${selectedAmbient}`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreatorGenerate = async () => {
    setIsGenerating(true);
    setSessionMode('creator');

    try {
      // Step 1: Interpret vibe
      const interpretResponse = await supabase.functions.invoke('interpret-vibe-prompt', {
        body: { description: vibeDescription },
      });

      // Step 2: Generate ASMR
      const asmrResponse = await supabase.functions.invoke('generate-custom-asmr', {
        body: { prompt: interpretResponse.data.prompt },
      });

      if (asmrResponse.data?.audioContent) {
        const audioBlob = base64ToBlob(asmrResponse.data.audioContent);
        const audioUrl = URL.createObjectURL(audioBlob);

        await audioPlayer.play(audioUrl, 60);
        setGeneratedTitle(interpretResponse.data.title || 'Custom Vibe');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewSession = () => {
    setIsComplete(false);
    setSessionMode(null);
    setSelectedMood(null);
    setSelectedAmbient(null);
    setVibeDescription('');
    setGeneratedTitle('');
    audioPlayer.stop();
  };

  // Show session complete screen
  if (isComplete) {
    return (
      <SessionComplete
        sessionTitle={generatedTitle}
        loopCount={audioPlayer.loopCount}
        onReplay={audioPlayer.replay}
        onNewSession={handleNewSession}
        onFeedback={(type) => console.log('Feedback:', type)}
        onJoinWaitlist={(email) => console.log('Waitlist:', email)}
      />
    );
  }

  // Show audio controls during playback
  if (audioPlayer.isPlaying || audioPlayer.isPaused) {
    return (
      <AudioControls
        isPlaying={audioPlayer.isPlaying}
        isPaused={audioPlayer.isPaused}
        loopEnabled={loopEnabled}
        loopCount={audioPlayer.loopCount}
        timeLeft={audioPlayer.timeLeft}
        generatedTitle={generatedTitle}
        onPauseResume={audioPlayer.isPaused ? audioPlayer.resume : audioPlayer.pause}
        onStop={audioPlayer.stop}
        onToggleLoop={() => setLoopEnabled(!loopEnabled)}
      />
    );
  }

  // Show session creators
  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="preset">
          <AccordionTrigger>Quick Preset</AccordionTrigger>
          <AccordionContent>
            <QuickPreset
              selectedMood={selectedMood}
              selectedAmbient={selectedAmbient}
              onMoodChange={setSelectedMood}
              onAmbientChange={setSelectedAmbient}
              onGenerate={handlePresetGenerate}
              isGenerating={isGenerating}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="creator">
          <AccordionTrigger>Custom Vibe Creator</AccordionTrigger>
          <AccordionContent>
            <CreatorMode
              vibeDescription={vibeDescription}
              onDescriptionChange={setVibeDescription}
              onGenerate={handleCreatorGenerate}
              isGenerating={isGenerating}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
```

---

## 🧪 Testing Examples

### Testing QuickPreset Component

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickPreset } from '@/components/session-creators';

describe('QuickPreset', () => {
  it('should render all mood options', () => {
    render(
      <QuickPreset
        selectedMood={null}
        selectedAmbient={null}
        onMoodChange={() => {}}
        onAmbientChange={() => {}}
        onGenerate={() => {}}
        isGenerating={false}
      />
    );

    expect(screen.getByText('relax')).toBeInTheDocument();
    expect(screen.getByText('sleep')).toBeInTheDocument();
    expect(screen.getByText('focus')).toBeInTheDocument();
  });

  it('should call onMoodChange when mood is selected', async () => {
    const handleMoodChange = vi.fn();
    const user = userEvent.setup();

    render(
      <QuickPreset
        selectedMood={null}
        selectedAmbient={null}
        onMoodChange={handleMoodChange}
        onAmbientChange={() => {}}
        onGenerate={() => {}}
        isGenerating={false}
      />
    );

    await user.click(screen.getByText('relax'));
    expect(handleMoodChange).toHaveBeenCalledWith('relax');
  });

  it('should disable generate button when mood or ambient not selected', () => {
    render(
      <QuickPreset
        selectedMood="relax"
        selectedAmbient={null}
        onMoodChange={() => {}}
        onAmbientChange={() => {}}
        onGenerate={() => {}}
        isGenerating={false}
      />
    );

    const generateButton = screen.getByText('Generate Session');
    expect(generateButton).toBeDisabled();
  });
});
```

---

## 📚 Next Steps

1. **Integrate into Index.tsx:** Replace inline code with these components
2. **Add tests:** Write comprehensive tests for each component
3. **Performance optimization:** Add memoization where needed
4. **Accessibility:** Ensure keyboard navigation works perfectly

---

**Last Updated:** 2025-11-17
**Phase:** 2 - Component Extraction Complete
