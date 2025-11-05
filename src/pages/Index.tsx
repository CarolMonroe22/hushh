import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type Mode = 'presets' | 'creator';
type Mood = 'relax' | 'sleep' | 'focus' | 'gratitude' | 'boost';
type Ambient = 'rain' | 'ocean' | 'forest' | 'fireplace' | 'white-noise';

const MOODS: { id: Mood; label: string; emoji: string }[] = [
  { id: 'relax', label: 'Relax', emoji: '😌' },
  { id: 'sleep', label: 'Sleep', emoji: '😴' },
  { id: 'focus', label: 'Focus', emoji: '🎯' },
  { id: 'gratitude', label: 'Gratitude', emoji: '💚' },
  { id: 'boost', label: 'Boost', emoji: '🚀' },
];

const AMBIENTS: { id: Ambient; label: string; emoji: string }[] = [
  { id: 'rain', label: 'Rain', emoji: '🌧️' },
  { id: 'ocean', label: 'Ocean', emoji: '🌊' },
  { id: 'forest', label: 'Forest', emoji: '🌲' },
  { id: 'fireplace', label: 'Fireplace', emoji: '🔥' },
  { id: 'white-noise', label: 'White Noise', emoji: '⚪' },
];

const VIBE_STARTERS = [
  {
    title: "Morning focus ritual",
    description: "I need to start my day with clarity and focus, ready to tackle my work with energy"
  },
  {
    title: "Night wind-down",
    description: "Help me release the day's stress and prepare for deep, restorative sleep"
  },
  {
    title: "Creative flow",
    description: "I want to unlock my creativity and get into a flow state for my project"
  },
  {
    title: "Confidence boost",
    description: "Give me a surge of confidence and self-belief before my big presentation"
  },
  {
    title: "Study session",
    description: "I need deep focus to absorb and understand complex information while studying"
  }
];

const Index = () => {
  const [mode, setMode] = useState<Mode>('presets');
  const [selectedMood, setSelectedMood] = useState<Mood>('relax');
  const [selectedAmbient, setSelectedAmbient] = useState<Ambient>('rain');
  const [vibeDescription, setVibeDescription] = useState('');
  const [vibeTitle, setVibeTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [playTime, setPlayTime] = useState(0);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const startSession = async () => {
    setIsGenerating(true);
    setPlayTime(0);

    try {
      const { data, error } = await supabase.functions.invoke('generate-asmr-session', {
        body: { 
          mood: selectedMood,
          ambient: selectedAmbient 
        }
      });

      if (error) {
        console.error('Generation error:', error);
        throw error;
      }

      if (!data.audioContent) {
        throw new Error("No audio returned");
      }

      const audioBlob = base64ToBlob(data.audioContent, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.volume = 0.85;

      audioRef.current.onerror = (e) => {
        console.error("Audio playback error:", e);
        toast({
          description: "audio playback failed, try again...",
          variant: "destructive",
        });
        setIsPlaying(false);
        setIsGenerating(false);
        URL.revokeObjectURL(audioUrl);
      };

      audioRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsPlaying(false);
        setSessionCompleted(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      await audioRef.current.play();
      setIsGenerating(false);
      setIsPlaying(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setPlayTime(prev => prev + 1);
      }, 1000);

      if (data.cached) {
        toast({
          description: "loaded from cache ⚡",
        });
      }

    } catch (error) {
      console.error("ASMR generation error:", error);
      
      let errorDescription = "failed to generate session...";
      if (error instanceof Error) {
        if (error.message.includes("quota exceeded") || error.message.includes("ElevenLabs quota")) {
          errorDescription = "elevenlabs quota exceeded. please add credits.";
        } else if (error.message.includes("ElevenLabs")) {
          errorDescription = "elevenlabs error. check api key.";
        }
      }
      
      toast({
        description: errorDescription,
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  const startCreatorSession = async () => {
    setIsGenerating(true);
    setPlayTime(0);

    try {
      // Step 1: Interpret user's description into professional prompt
      toast({
        description: "✨ interpreting your vibe...",
      });

      const { data: interpretData, error: interpretError } = await supabase.functions.invoke('interpret-vibe-prompt', {
        body: { 
          description: vibeDescription,
          title: vibeTitle || 'Custom Vibe'
        }
      });

      if (interpretError) throw interpretError;
      if (!interpretData.prompt) throw new Error("Failed to interpret vibe");

      console.log("Interpreted prompt:", interpretData.prompt);

      // Step 2: Generate audio with interpreted prompt
      toast({
        description: "🎵 generating your audio...",
      });

      const { data: audioData, error: audioError } = await supabase.functions.invoke('generate-custom-asmr', {
        body: { 
          prompt: interpretData.prompt,
          title: interpretData.title
        }
      });

      if (audioError) throw audioError;
      if (!audioData.audioContent) throw new Error("No audio returned");

      // Play audio
      const audioBlob = base64ToBlob(audioData.audioContent, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.volume = 0.85;

      audioRef.current.onerror = (e) => {
        console.error("Audio playback error:", e);
        toast({
          description: "audio playback failed, try again...",
          variant: "destructive",
        });
        setIsPlaying(false);
        setIsGenerating(false);
        URL.revokeObjectURL(audioUrl);
      };

      audioRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsPlaying(false);
        setSessionCompleted(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      await audioRef.current.play();
      setIsGenerating(false);
      setIsPlaying(true);

      timerRef.current = setInterval(() => {
        setPlayTime(prev => prev + 1);
      }, 1000);

      toast({
        description: `✨ ${audioData.title} created!`,
      });

    } catch (error) {
      console.error("Creator session error:", error);
      toast({
        description: "failed to create vibe...",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Playing screen
  if (isPlaying) {
    const displayEmoji = mode === 'creator' ? '✨' : MOODS.find(m => m.id === selectedMood)?.emoji;
    const displayInfo = mode === 'creator' ? vibeTitle || 'Custom Vibe' : AMBIENTS.find(a => a.id === selectedAmbient)?.label;
    
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center animate-fade-in p-6">
        <div className="text-center space-y-6">
          <div className="text-6xl animate-pulse">
            {displayEmoji}
          </div>
          <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase">
            listening...
          </p>
          <p className="text-foreground/60 text-lg font-mono">
            {formatTime(playTime)} / 1:00
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{displayInfo}</span>
          </div>
        </div>
      </div>
    );
  }

  // Session complete screen
  if (sessionCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 animate-fade-in">
        <div className="max-w-md mx-auto space-y-8 text-center">
          <div className="space-y-4">
            <p className="text-4xl">✨</p>
            <p className="text-xl text-foreground tracking-wide">
              session complete
            </p>
            <p className="text-sm text-muted-foreground">
              1 minute of peace
            </p>
            <div className="flex items-center justify-center gap-3 text-sm">
              <span>{MOODS.find(m => m.id === selectedMood)?.emoji}</span>
              <span className="text-muted-foreground lowercase">
                {MOODS.find(m => m.id === selectedMood)?.label}
              </span>
              <span className="text-muted-foreground">+</span>
              <span>{AMBIENTS.find(a => a.id === selectedAmbient)?.emoji}</span>
              <span className="text-muted-foreground lowercase">
                {AMBIENTS.find(a => a.id === selectedAmbient)?.label}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => {
                setSessionCompleted(false);
                setPlayTime(0);
                startSession();
              }}
              className="w-full lowercase tracking-wide"
              size="lg"
            >
              🔁 listen again
            </Button>
            <Button
              onClick={() => {
                setSessionCompleted(false);
                setPlayTime(0);
              }}
              variant="outline"
              className="w-full lowercase tracking-wide"
            >
              start another session
            </Button>
            <p className="text-xs text-muted-foreground/60">
              created at 3:23 AM by{" "}
              <a
                href="https://x.com/carolmonroe"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                @carolmonroe
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main selection screen
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 animate-fade-in">
      <div className="max-w-lg w-full mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-light tracking-wider text-foreground">
            1-Minute ASMR
          </h1>
          <p className="text-sm text-muted-foreground tracking-wide">
            build beautiful feelings, in sound
          </p>
          
          {/* Mode Toggle */}
          <div className="inline-flex rounded-lg border border-border p-1 bg-card">
            <button
              onClick={() => setMode('presets')}
              className={`px-6 py-2 rounded-md text-sm transition-all lowercase tracking-wide ${
                mode === 'presets' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              quick presets
            </button>
            <button
              onClick={() => setMode('creator')}
              className={`px-6 py-2 rounded-md text-sm transition-all lowercase tracking-wide ${
                mode === 'creator' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              vibe creator
            </button>
          </div>
        </div>

        {mode === 'creator' ? (
          // CREATOR MODE
          <div className="space-y-6">
            {/* Vibe Title */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground uppercase tracking-wider">
                Name Your Vibe
              </Label>
              <Input
                placeholder="e.g., Morning power-up"
                value={vibeTitle}
                onChange={(e) => setVibeTitle(e.target.value)}
                className="text-base lowercase"
              />
            </div>

            {/* Vibe Description */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground uppercase tracking-wider">
                Describe Your Feeling
              </Label>
              <Textarea
                placeholder="tell me what you need... (e.g., 'I need to focus deeply for my exam with calming rain sounds')"
                value={vibeDescription}
                onChange={(e) => setVibeDescription(e.target.value)}
                className="min-h-[100px] resize-none text-base"
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground/60">
                ✨ just describe how you want to feel - we'll handle the rest
              </p>
            </div>

            {/* Starter Templates */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground uppercase tracking-wider">
                Or Start From These
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {VIBE_STARTERS.slice(0, 3).map((starter) => (
                  <button
                    key={starter.title}
                    onClick={() => {
                      setVibeTitle(starter.title);
                      setVibeDescription(starter.description);
                    }}
                    className="text-left p-3 rounded-lg border border-border bg-card hover:bg-accent transition-all"
                  >
                    <p className="text-sm font-medium lowercase tracking-wide">{starter.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{starter.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={startCreatorSession}
              disabled={isGenerating || !vibeDescription.trim() || vibeDescription.trim().length < 20}
              className="w-full py-6 text-base lowercase tracking-wide"
              size="lg"
            >
              {isGenerating ? "building your vibe..." : "✨ create my vibe"}
            </Button>
          </div>
        ) : (
          // PRESETS MODE
          <>
            {/* Mood Selection */}
            <div className="space-y-4">
              <Label className="text-sm text-muted-foreground uppercase tracking-wider">
                Choose Your Mood
              </Label>
              <RadioGroup 
                value={selectedMood} 
                onValueChange={(value) => setSelectedMood(value as Mood)}
                className="grid grid-cols-2 gap-3"
              >
                {MOODS.map((mood) => (
                  <div key={mood.id} className="relative">
                    <RadioGroupItem
                      value={mood.id}
                      id={mood.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={mood.id}
                      className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-border bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                    >
                      <span className="text-3xl">{mood.emoji}</span>
                      <span className="text-sm lowercase tracking-wide">{mood.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Ambient Selection */}
            <div className="space-y-4">
              <Label className="text-sm text-muted-foreground uppercase tracking-wider">
                Choose Ambient Sound
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {AMBIENTS.map((ambient) => (
                  <button
                    key={ambient.id}
                    onClick={() => setSelectedAmbient(ambient.id)}
                    className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all hover:bg-accent ${
                      selectedAmbient === ambient.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card'
                    }`}
                  >
                    <span className="text-2xl">{ambient.emoji}</span>
                    <span className="text-xs lowercase tracking-wide text-foreground/80">
                      {ambient.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <Button
              onClick={startSession}
              disabled={isGenerating}
              className="w-full py-6 text-base lowercase tracking-wide"
              size="lg"
            >
              {isGenerating ? "creating your session..." : "▶️  start session"}
            </Button>

            {/* Info */}
            <p className="text-xs text-center text-muted-foreground/60">
              AI-generated ASMR meditation • 60 seconds
            </p>
          </>
        )}
      </div>

      {/* Generation Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="text-center space-y-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="text-sm text-muted-foreground tracking-wide">
              generating your ASMR session...
            </p>
            <p className="text-xs text-muted-foreground/60">
              this may take 15-20 seconds
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
