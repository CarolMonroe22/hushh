import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

const PRESETS = {
  manifest: `[WHISPER] Close your eyes. Picture tomorrow unfolding softly.
[PAUSE 300ms]
You are not rushing. You are arriving.
[PAUSE 300ms]
Everything you've been asking for is already finding you.`,
  relax: `[WHISPER] Let your breath fall.
[PAUSE 400ms]
Unclench your hands.
Drop the shoulders.
[PAUSE 300ms]
There's nothing left to fix tonight.
Just breathe.`,
  gratitude: `[WHISPER] Think of one small thing that made today gentler.
[PAUSE 300ms]
A voice. A smell. A second of quiet.
[PAUSE 300ms]
Whisper a thank you.`,
  sleep: `[WHISPER] Counting down.
Five. Loosen the feet.
[PAUSE 200ms]
Four. The hands.
Three. The jaw.
[PAUSE 300ms]
Two. The thoughts.
[PAUSE 300ms]
One. Only silence now.`,
  facts: `[WHISPER] Did you know?
Whales can talk across oceans.
[PAUSE 300ms]
So can your thoughts, if you send them kindly.
[PAUSE 400ms]
Sound is just connection in slow motion.`,
  positive: `[WHISPER] You did enough today.
[PAUSE 300ms]
You are enough tonight.
[PAUSE 300ms]
Rest is progress, too.`,
};

const VOICES = {
  aimee: { id: "zA6D7RyKdc2EClouEMkP", name: "AImee - Soft Whisper" },
  natasha_gentle: { id: "Atp5cNFg1Wj5gyKD7HWV", name: "Natasha - Gentle" },
  natasha_sensual: { id: "PB6BdkFkZLbI39GHdnbQ", name: "Natasha - Sensual" },
  aria: { id: "9BWtsMINqrJLrRacOk9x", name: "Aria - Classic" },
};

const AMBIENT_TRACKS = {
  rain: "Soft rain sounds with distant thunder, peaceful and calming",
  ocean: "Gentle ocean waves lapping on shore, meditative atmosphere",
  forest: "Night forest ambience with crickets and wind through leaves",
  white_noise: "Pure white noise for deep relaxation and sleep",
  cosmic: "Cosmic ambient soundscape with ethereal drones",
};

const DURATIONS = [
  { value: "3", label: "3 min" },
  { value: "5", label: "5 min" },
  { value: "10", label: "10 min" },
];

const Index = () => {
  const [thought, setThought] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAttribution, setShowAttribution] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("aimee");
  const [selectedAmbient, setSelectedAmbient] = useState<string | null>(null);
  const [duration, setDuration] = useState("5");
  const [stability, setStability] = useState([0.2]);
  const [similarity, setSimilarity] = useState([0.85]);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ambientRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (ambientRef.current) {
        ambientRef.current.pause();
        ambientRef.current = null;
      }
    };
  }, []);

  const handlePreset = (key: keyof typeof PRESETS) => {
    setThought(PRESETS[key]);
  };

  const handleWhisper = async () => {
    if (!thought.trim()) {
      toast({
        description: "write something first...",
        variant: "destructive",
      });
      return;
    }

    if (thought.length > 280) {
      toast({
        description: "keep it short, under 280 characters...",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setIsPlaying(true);

    try {
      // Start ambient music if selected
      if (selectedAmbient) {
        const { data: ambientData, error: ambientError } = await supabase.functions.invoke('generate-ambient', {
          body: { 
            prompt: AMBIENT_TRACKS[selectedAmbient as keyof typeof AMBIENT_TRACKS],
            duration: parseInt(duration) * 60 // Convert to seconds
          }
        });

        if (!ambientError && ambientData?.audioContent) {
          const ambientBlob = new Blob(
            [Uint8Array.from(atob(ambientData.audioContent), c => c.charCodeAt(0))],
            { type: 'audio/mpeg' }
          );
          const ambientUrl = URL.createObjectURL(ambientBlob);
          ambientRef.current = new Audio(ambientUrl);
          ambientRef.current.loop = true;
          ambientRef.current.volume = 0.3;
          await ambientRef.current.play();
        }
      }

      // Call edge function to generate whisper
      const { data, error } = await supabase.functions.invoke('whisper-text', {
        body: { 
          text: thought,
          voiceId: VOICES[selectedVoice as keyof typeof VOICES].id,
          stability: stability[0],
          similarity: similarity[0]
        }
      });

      if (error) throw error;

      if (!data.audioContent) {
        throw new Error("No audio returned");
      }

      // Convert base64 to blob and play
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onended = () => {
        // Fade out ambient
        if (ambientRef.current) {
          const fadeOut = setInterval(() => {
            if (ambientRef.current && ambientRef.current.volume > 0.05) {
              ambientRef.current.volume -= 0.05;
            } else {
              if (ambientRef.current) {
                ambientRef.current.pause();
                ambientRef.current = null;
              }
              clearInterval(fadeOut);
            }
          }, 100);
        }

        setShowAttribution(true);
        setTimeout(() => {
          setShowAttribution(false);
          setIsPlaying(false);
          setThought("");
        }, 5000);
      };

      await audioRef.current.play();
      setIsLoading(false);
    } catch (error) {
      console.error("Whisper error:", error);
      toast({
        description: "whisper failed...",
        variant: "destructive",
      });
      setIsPlaying(false);
      setIsLoading(false);
      
      // Stop ambient on error
      if (ambientRef.current) {
        ambientRef.current.pause();
        ambientRef.current = null;
      }
    }
  };

  if (isPlaying && !showAttribution) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center animate-fade-in">
        <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase animate-fade-in">
          {isLoading ? "preparing..." : "listening..."}
        </p>
      </div>
    );
  }

  if (showAttribution) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center animate-fade-in">
        <div className="text-center space-y-2 animate-fade-in">
          <p className="text-foreground/80 text-sm tracking-wide">
            created by{" "}
            <a
              href="https://x.com/carolmonroe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              @carolmonroe
            </a>
          </p>
          <p className="text-muted-foreground text-xs">
            one night she couldn't sleep at 3 : 23 am
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6 animate-fade-in">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-light tracking-[0.2em] text-foreground uppercase animate-glow-pulse">
            murmur
          </h1>
          <p className="text-sm text-muted-foreground tracking-wide">
            before sleep, a whisper.
          </p>
        </div>

        {/* Voice & Ambient Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              voice
            </Label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(VOICES).map(([key, voice]) => (
                  <SelectItem key={key} value={key}>
                    {voice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              ambient sound
            </Label>
            <Select value={selectedAmbient || "none"} onValueChange={(v) => setSelectedAmbient(v === "none" ? null : v)}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="none" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">none</SelectItem>
                <SelectItem value="rain">rain</SelectItem>
                <SelectItem value="ocean">ocean waves</SelectItem>
                <SelectItem value="forest">night forest</SelectItem>
                <SelectItem value="white_noise">white noise</SelectItem>
                <SelectItem value="cosmic">cosmic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Duration Selector (only shown if ambient selected) */}
        {selectedAmbient && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              ambient duration
            </Label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <Button
                  key={d.value}
                  variant={duration === d.value ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setDuration(d.value)}
                  className="flex-1"
                >
                  {d.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Voice Settings */}
        <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                stability
              </Label>
              <span className="text-xs text-foreground">{stability[0].toFixed(2)}</span>
            </div>
            <Slider
              value={stability}
              onValueChange={setStability}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                clarity
              </Label>
              <span className="text-xs text-foreground">{similarity[0].toFixed(2)}</span>
            </div>
            <Slider
              value={similarity}
              onValueChange={setSimilarity}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
          </div>
        </div>

        {/* Text Area */}
        <Textarea
          value={thought}
          onChange={(e) => setThought(e.target.value)}
          placeholder="write a thought to whisper..."
          maxLength={280}
          className="min-h-[120px] bg-card border-border text-foreground placeholder:text-muted-foreground resize-none focus-visible:ring-primary"
        />

        {/* Character Count */}
        <p className="text-xs text-muted-foreground text-right">
          {thought.length} / 280
        </p>

        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-2 justify-center">
          {Object.keys(PRESETS).map((key) => (
            <Button
              key={key}
              variant="secondary"
              size="sm"
              onClick={() => handlePreset(key as keyof typeof PRESETS)}
              className="lowercase tracking-wide hover:text-primary hover:border-primary transition-all"
            >
              {key}
            </Button>
          ))}
        </div>

        {/* Main Action Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleWhisper}
            disabled={isPlaying}
            className="px-8 py-6 text-base tracking-wide lowercase bg-primary hover:bg-primary/90 text-primary-foreground animate-glow-pulse disabled:animate-none"
          >
            whisper it
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Index;
