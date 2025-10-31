import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

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

const Index = () => {
  const [thought, setThought] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAttribution, setShowAttribution] = useState(false);
  const { toast } = useToast();

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

    setIsPlaying(true);

    try {
      // TODO: Call ElevenLabs API here
      // For now, simulate with a timeout
      await new Promise((resolve) => setTimeout(resolve, 5000));

      setShowAttribution(true);
      setTimeout(() => {
        setShowAttribution(false);
        setIsPlaying(false);
        setThought("");
      }, 5000);
    } catch (error) {
      toast({
        description: "whisper failed...",
        variant: "destructive",
      });
      setIsPlaying(false);
    }
  };

  if (isPlaying && !showAttribution) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center animate-fade-in">
        <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase animate-fade-in">
          listening...
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
      <div className="w-full max-w-xl space-y-8 animate-fade-in">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-light tracking-[0.2em] text-foreground uppercase animate-glow-pulse">
            murmur
          </h1>
          <p className="text-sm text-muted-foreground tracking-wide">
            before sleep, a whisper.
          </p>
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
