import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Mood = "calm" | "energized" | "focused" | "sleepy";
type Ambient = "rain" | "nature" | "city" | "ocean" | "cafe" | "silence";

const MOODS: { value: Mood; label: string; emoji: string }[] = [
  { value: "calm", label: "calm", emoji: "🌙" },
  { value: "energized", label: "energized", emoji: "⚡" },
  { value: "focused", label: "focused", emoji: "🎯" },
  { value: "sleepy", label: "sleepy", emoji: "😴" },
];

const AMBIENTS: { value: Ambient; label: string; emoji: string }[] = [
  { value: "rain", label: "rain", emoji: "🌧️" },
  { value: "nature", label: "nature", emoji: "🌲" },
  { value: "city", label: "city", emoji: "🏙️" },
  { value: "ocean", label: "ocean", emoji: "🌊" },
  { value: "cafe", label: "cafe", emoji: "☕" },
  { value: "silence", label: "silence", emoji: "🤫" },
];

const VIBE_STARTERS = [
  {
    title: "deep focus",
    description: "I need to concentrate deeply on complex work. Create a focused atmosphere with subtle background sounds that help me stay in the zone without any distractions.",
  },
  {
    title: "calm evening",
    description: "Help me wind down after a long day. I want gentle, soothing sounds that ease my mind and help me transition into a peaceful evening routine.",
  },
  {
    title: "creative flow",
    description: "I'm working on something creative and need sounds that inspire without overwhelming. Something that keeps my energy up while letting my imagination flow.",
  },
  {
    title: "peaceful sleep",
    description: "Guide me into deep, restful sleep with calming sounds that quiet my racing thoughts and create a cocoon of tranquility around me.",
  },
  {
    title: "manifestation",
    description: "Help me manifest my goals and dreams. I want powerful, affirming whispers that strengthen my belief in what I'm creating and fill me with confidence and clarity about my vision.",
  },
  {
    title: "prayer",
    description: "Create a sacred space for prayer and spiritual connection. I want gentle, reverent whispers that help me feel grounded, connected to something greater, and at peace in this moment of reflection.",
  },
];

const TITLE_ROTATIONS = [
  "ASMR",
  "Meditation", 
  "Focus",
  "Calm",
  "Flow",
  "Lullaby",
  "Reset",
  "Breathe",
  "Pray",
  "Pause",
  "Dream",
];

const Index = () => {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [selectedAmbient, setSelectedAmbient] = useState<Ambient | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isComplete, setIsComplete] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [vibeDescription, setVibeDescription] = useState("");
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [titleFade, setTitleFade] = useState(true);
  const [sessionFeedback, setSessionFeedback] = useState<'loved' | 'liked' | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Title rotation effect
  useEffect(() => {
    const titleInterval = setInterval(() => {
      // Fade out
      setTitleFade(false);
      
      // Change word after fade out
      setTimeout(() => {
        setCurrentTitleIndex((prevIndex) => 
          (prevIndex + 1) % TITLE_ROTATIONS.length
        );
        // Fade in
        setTitleFade(true);
      }, 600); // 600ms for smooth fade out
    }, 5000); // Change every 5 seconds for more contemplative feel

    return () => clearInterval(titleInterval);
  }, []);

  const base64ToBlob = (base64: string, type: string = "audio/mpeg") => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
  };

  const startSession = async () => {
    if (!selectedMood || !selectedAmbient) {
      toast({
        title: "Selection Required",
        description: "Please select both a mood and an ambient sound",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-asmr-session", {
        body: { mood: selectedMood, ambient: selectedAmbient },
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audioBlob = base64ToBlob(data.audioContent);
        const audioUrl = URL.createObjectURL(audioBlob);

        audioRef.current = new Audio(audioUrl);
        audioRef.current.play();

        setIsPlaying(true);
        setTimeLeft(60);

        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              setIsPlaying(false);
              setIsComplete(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        if (audioRef.current) {
          audioRef.current.onended = () => {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsPlaying(false);
            setIsComplete(true);
          };
        }
      }
    } catch (error) {
      console.error("Session generation error:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate ASMR session",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const startCreatorSession = async () => {
    if (!vibeDescription.trim() || vibeDescription.trim().length < 20) {
      toast({
        title: "Description Required",
        description: "Please describe your desired vibe (at least 20 characters)",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      console.log("Step 1: Interpreting vibe prompt...");
      const { data: interpretData, error: interpretError } = await supabase.functions.invoke(
        "interpret-vibe-prompt",
        {
          body: {
            description: vibeDescription,
          },
        }
      );

      if (interpretError) {
        console.error("Interpretation error:", interpretError);
        throw interpretError;
      }

      if (!interpretData?.prompt) {
        throw new Error("No prompt received from interpreter");
      }

      console.log("Step 2: Generating ASMR audio...");
      setGeneratedTitle(interpretData.title || "your vibe");
      
      const { data: asmrData, error: asmrError } = await supabase.functions.invoke(
        "generate-custom-asmr",
        {
          body: {
            prompt: interpretData.prompt,
            title: interpretData.title || "your vibe",
          },
        }
      );

      if (asmrError) {
        console.error("ASMR generation error:", asmrError);
        throw asmrError;
      }

      if (asmrData?.audioContent) {
        console.log("Step 3: Playing audio...");
        const audioBlob = base64ToBlob(asmrData.audioContent);
        const audioUrl = URL.createObjectURL(audioBlob);

        audioRef.current = new Audio(audioUrl);
        audioRef.current.play();

        setIsPlaying(true);
        setTimeLeft(60);

        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              setIsPlaying(false);
              setIsComplete(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        if (audioRef.current) {
          audioRef.current.onended = () => {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsPlaying(false);
            setIsComplete(true);
          };
        }
      }
    } catch (error) {
      console.error("Creator session error:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to create your vibe",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsComplete(false);
      setIsPlaying(true);
      setTimeLeft(60);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsPlaying(false);
            setIsComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleWaitlistSubmit = async () => {
    if (!waitlistEmail.trim() || !waitlistEmail.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setEmailSubmitted(true);
    toast({
      title: "You're on the list! 🎉",
      description: "We'll let you know when extended sessions are ready",
    });
  };

  const handleNewSession = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsComplete(false);
    setIsPlaying(false);
    setTimeLeft(60);
    setSelectedMood(null);
    setSelectedAmbient(null);
    setGeneratedTitle("");
    setVibeDescription("");
    setSessionFeedback(null);
    setWaitlistEmail("");
    setEmailSubmitted(false);
  };

  if (isPlaying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-light lowercase tracking-wider text-foreground">
            {generatedTitle || `${selectedMood} + ${selectedAmbient}`}
          </h2>

          <div className="relative w-48 h-48 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/30" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl font-light">{timeLeft}</div>
                <div className="text-sm text-muted-foreground lowercase tracking-wide">seconds</div>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground lowercase tracking-wide">
            breathe deep, let go
          </p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-lg w-full px-4">
          {/* Header */}
          <div className="space-y-2">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-3xl font-light lowercase tracking-wide">session complete</h2>
          </div>

          {/* Feedback Section */}
          <div className="space-y-4 py-6 border-y border-border/30">
            <p className="text-muted-foreground text-sm">how was your experience?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setSessionFeedback('loved')}
                className={`px-6 py-3 rounded-lg border transition-all ${
                  sessionFeedback === 'loved'
                    ? 'border-primary bg-primary/10 scale-105'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-2xl">❤️</span>
                <p className="text-xs mt-1 lowercase">loved it</p>
              </button>
              <button
                onClick={() => setSessionFeedback('liked')}
                className={`px-6 py-3 rounded-lg border transition-all ${
                  sessionFeedback === 'liked'
                    ? 'border-primary bg-primary/10 scale-105'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-2xl">👍</span>
                <p className="text-xs mt-1 lowercase">it was good</p>
              </button>
            </div>
          </div>

          {/* Extended Sessions Teaser + Waitlist */}
          {sessionFeedback && (
            <div className="space-y-4 py-6 bg-card/30 rounded-lg px-6">
              <div className="space-y-2">
                <p className="text-sm font-medium lowercase">
                  ✨ want longer sessions?
                </p>
                <p className="text-xs text-muted-foreground">
                  join the waitlist for extended 5, 10, and 30-minute experiences
                </p>
              </div>

              {!emailSubmitted ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="email"
                    placeholder="your email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    className="lowercase"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleWaitlistSubmit();
                    }}
                  />
                  <Button
                    onClick={handleWaitlistSubmit}
                    size="sm"
                    className="lowercase tracking-wide whitespace-nowrap"
                  >
                    join waitlist
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-primary lowercase flex items-center justify-center gap-2">
                  <span>✓</span> you're on the list!
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button
              onClick={handleReplay}
              variant="outline"
              size="lg"
              className="lowercase tracking-wide"
            >
              <span className="mr-2">🔄</span>
              replay this session
            </Button>
            <Button
              onClick={handleNewSession}
              size="lg"
              className="lowercase tracking-wide"
            >
              create new session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-5xl md:text-7xl font-light tracking-wider text-foreground">
            <span>1-Minute </span>
            <span 
              className={`inline-block transition-all duration-600 ease-in-out ${
                titleFade 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 -translate-y-2'
              }`}
              style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)' }}
            >
              {TITLE_ROTATIONS[currentTitleIndex]}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground tracking-wide">
            build beautiful feelings, in sound
          </p>
        </div>

        {/* Main Input Area - Creator Mode */}
        <div className="max-w-2xl mx-auto space-y-6 mb-12">
          {/* Large Textarea - Main Focus */}
          <div className="space-y-3">
            <Textarea
              placeholder="describe how you want to feel... (e.g., 'I need deep focus for studying with calming rain')"
              value={vibeDescription}
              onChange={(e) => setVibeDescription(e.target.value)}
              className="min-h-[140px] resize-none text-base py-4 bg-card/50 border-border/50 focus:bg-card transition-all"
              maxLength={300}
            />
            <div className="flex justify-between items-center px-1">
              <p className="text-xs text-muted-foreground/60">
                ✨ we'll interpret your vibe into the perfect audio
              </p>
              <p className="text-xs text-muted-foreground/60">
                {vibeDescription.length}/300
              </p>
            </div>
          </div>

          {/* Generate Button - Prominent */}
          <Button
            onClick={startCreatorSession}
            disabled={isGenerating || !vibeDescription.trim() || vibeDescription.trim().length < 20}
            className="w-full py-6 text-lg lowercase tracking-wide bg-primary hover:bg-primary/90 transition-all"
            size="lg"
          >
            {isGenerating ? "creating your vibe..." : "✨ create my vibe"}
          </Button>
        </div>

        {/* Vibe Starters - Quick Inspiration */}
        <div className="max-w-2xl mx-auto space-y-4 mb-12">
          <p className="text-sm text-muted-foreground text-center">
            or start from these →
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {VIBE_STARTERS.map((starter) => (
              <button
                key={starter.title}
                onClick={() => {
                  setVibeDescription(starter.description);
                }}
                className="px-4 py-2 rounded-full border border-border bg-card hover:bg-accent transition-all text-sm lowercase"
              >
                {starter.title}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Presets - Accordion */}
        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="border-t border-border/50">
            <AccordionItem value="presets" className="border-b-0">
              <AccordionTrigger className="py-6 hover:no-underline">
                <span className="text-sm text-muted-foreground lowercase tracking-wide">
                  or choose a quick preset →
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-6 space-y-6">
                {/* Mood Selection */}
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    mood
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {MOODS.map((mood) => (
                      <button
                        key={mood.value}
                        onClick={() => setSelectedMood(mood.value)}
                        className={`p-4 rounded-lg border transition-all text-left ${
                          selectedMood === mood.value
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card hover:bg-accent"
                        }`}
                      >
                        <div className="text-2xl mb-1">{mood.emoji}</div>
                        <div className="text-sm lowercase">{mood.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ambient Selection */}
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    ambient
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AMBIENTS.map((ambient) => (
                      <button
                        key={ambient.value}
                        onClick={() => setSelectedAmbient(ambient.value)}
                        className={`p-4 rounded-lg border transition-all text-left ${
                          selectedAmbient === ambient.value
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card hover:bg-accent"
                        }`}
                      >
                        <div className="text-2xl mb-1">{ambient.emoji}</div>
                        <div className="text-sm lowercase">{ambient.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Preset Button */}
                <Button
                  onClick={startSession}
                  disabled={isGenerating || !selectedMood || !selectedAmbient}
                  className="w-full py-6 text-base lowercase tracking-wide"
                  size="lg"
                >
                  {isGenerating ? "creating..." : "generate preset"}
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* About/Story Section */}
        <div className="max-w-2xl mx-auto mt-20 mb-12 px-4">
          <div className="text-center space-y-6 py-12 border-t border-border/30">
            {/* Title */}
            <h2 className="text-3xl md:text-4xl font-light lowercase tracking-wide">
              🌙 hushh
            </h2>
            
            {/* Credit with link */}
            <p className="text-sm text-muted-foreground">
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

            {/* Story */}
            <div className="max-w-lg mx-auto space-y-4 text-muted-foreground text-sm leading-relaxed">
              <p>
                My mom used to tell me to relax before bed —<br />
                to fall asleep to the sound of rain.<br />
                We had those ambient CDs, soft music, slow rhythms...<br />
                and I'd rest my head on her lap as she whispered songs.
              </p>
              
              <p>
                That feeling of calm, safety, and sound —<br />
                I brought it here.
              </p>
            </div>

            {/* Waitlist CTA with Dialog */}
            <div className="pt-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="lowercase tracking-wide"
                  >
                    ✨ join the waitlist →
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="lowercase text-2xl tracking-wide">
                      join the waitlist
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                      be the first to know when extended sessions (5, 10, and 30 minutes) are available
                    </p>
                    
                    {!emailSubmitted ? (
                      <div className="flex flex-col gap-3">
                        <Input
                          type="email"
                          placeholder="your email"
                          value={waitlistEmail}
                          onChange={(e) => setWaitlistEmail(e.target.value)}
                          className="lowercase"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleWaitlistSubmit();
                          }}
                        />
                        <Button
                          onClick={handleWaitlistSubmit}
                          className="lowercase tracking-wide w-full"
                        >
                          join waitlist
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="text-primary lowercase flex items-center justify-center gap-2 text-lg">
                          <span>✓</span> you're on the list!
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto">
              <div className="w-full h-full border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground lowercase tracking-wide">
              building your vibe...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
