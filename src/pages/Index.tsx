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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CATEGORIES = [
  { id: "manifest", label: "manifest" },
  { id: "relax", label: "relax" },
  { id: "gratitude", label: "gratitude" },
];

const VOICES = {
  aimee: { id: "zA6D7RyKdc2EClouEMkP", name: "AImee - Soft Whisper" },
  natasha_gentle: { id: "Atp5cNFg1Wj5gyKD7HWV", name: "Natasha - Gentle" },
  natasha_sensual: { id: "PB6BdkFkZLbI39GHdnbQ", name: "Natasha - Sensual" },
  aria: { id: "9BWtsMINqrJLrRacOk9x", name: "Aria - Classic" },
};


const Index = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAttribution, setShowAttribution] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("aimee");
  const [showCustomText, setShowCustomText] = useState(false);
  const [customText, setCustomText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const getCategoryWelcomeMessage = (category: string) => {
    const messages: Record<string, string> = {
      manifest: "initiating your manifestation journey... close your eyes and breathe",
      relax: "beginning your relaxation process... you can close your eyes now",
      gratitude: "starting your gratitude meditation... take a deep breath and close your eyes"
    };
    return messages[category] || "preparing your experience...";
  };

  const playWhisper = async (text: string) => {
    setIsPlaying(true);

    try {
      // Generate whisper audio
      const { data, error } = await supabase.functions.invoke('whisper-text', {
        body: { 
          text,
          voiceId: VOICES[selectedVoice as keyof typeof VOICES].id,
          stability: 0.2,
          similarity: 0.85
        }
      });

      if (error) throw error;

      if (!data.audioContent) {
        throw new Error("No audio returned");
      }

      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setSessionCompleted(true);
      };

      await audioRef.current.play();
      setIsGenerating(false);
    } catch (error) {
      console.error("Whisper error:", error);
      
      let errorDescription = "whisper failed...";
      if (error instanceof Error) {
        if (error.message.includes("quota exceeded") || error.message.includes("ElevenLabs quota")) {
          errorDescription = "elevenlabs quota exceeded. please add credits to your account.";
        } else if (error.message.includes("ElevenLabs")) {
          errorDescription = "elevenlabs error. check your api key.";
        }
      }
      
      toast({
        description: errorDescription,
        variant: "destructive",
      });
      setIsPlaying(false);
      setIsGenerating(false);
    }
  };

  const handleCategorySelect = async (category: string) => {
    setSelectedCategory(category);
    setIsGenerating(true);

    try {
      const { data: contentData, error: contentError } = 
        await supabase.functions.invoke('generate-whisper-content', {
          body: { category }
        });
      
      if (contentError) {
        if (contentError.message?.includes('429')) {
          toast({
            description: "rate limit exceeded, please try again later...",
            variant: "destructive",
          });
        } else if (contentError.message?.includes('402')) {
          toast({
            description: "please add credits to continue...",
            variant: "destructive",
          });
        } else {
          throw contentError;
        }
        setIsGenerating(false);
        return;
      }

      const generatedText = contentData.text;
      
      if (!generatedText) {
        throw new Error("No content generated");
      }

      await playWhisper(generatedText);
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        description: "failed to generate whisper...",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  const handleCustomText = async () => {
    if (!customText.trim()) {
      toast({
        description: "write something first...",
        variant: "destructive",
      });
      return;
    }

    if (customText.length > 5000) {
      toast({
        description: "text too long, max 5000 characters...",
        variant: "destructive",
      });
      return;
    }

    setShowCustomText(false);
    setIsGenerating(true);
    await playWhisper(customText);
    setCustomText("");
  };

  const handleVote = async (vote: 'yes' | 'no') => {
    try {
      // Generate or retrieve session_id
      const sessionId = localStorage.getItem('session_id') || crypto.randomUUID();
      localStorage.setItem('session_id', sessionId);
      
      // Save vote to database (no select to avoid RLS read policy)
      const { error: voteError } = await supabase
        .from('votes')
        .insert({
          vote,
          feature: '1hour_ambient',
          session_id: sessionId,
          user_agent: navigator.userAgent
        });

      if (voteError) {
        console.error('Vote error details:', voteError);
        throw voteError;
      }

      // If voted "yes", show email capture
      if (vote === 'yes') {
        setShowEmailCapture(true);
        toast({
          description: "thanks! want early access? leave your email below 🎵",
        });
      } else {
        // If voted "no", just thank them
        setVoteSubmitted(true);
        toast({
          description: "noted! we'll focus on other improvements 🌙",
        });
        setTimeout(() => setVoteSubmitted(false), 3000);
      }

    } catch (error) {
      console.error("Vote error:", error);
      toast({
        description: "couldn't save vote, please try again",
        variant: "destructive"
      });
    }
  };

  const handleEmailSubmit = async () => {
    if (!userEmail || !userEmail.includes('@')) {
      toast({
        description: "please enter a valid email",
        variant: "destructive"
      });
      return;
    }

    setEmailSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('early_access_emails')
        .insert({
          email: userEmail.toLowerCase().trim(),
          feature: '1hour_ambient'
        });

      if (error) {
        // If email already exists, that's ok
        if (error.code === '23505') {
          toast({
            description: "you're already on the list! we'll notify you 🌙",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          description: "perfect! we'll email you when it's ready 🎵",
        });
      }

      // Reset and show confirmation
      setUserEmail("");
      setShowEmailCapture(false);
      setVoteSubmitted(true);
      setTimeout(() => setVoteSubmitted(false), 3000);

    } catch (error) {
      console.error("Email submit error:", error);
      toast({
        description: "couldn't save email, please try again",
        variant: "destructive"
      });
    } finally {
      setEmailSubmitting(false);
    }
  };

  if (isPlaying && !showAttribution) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center animate-fade-in">
        <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase animate-fade-in">
          {isGenerating ? "preparing..." : "listening..."}
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

  // Session Complete Screen
  if (sessionCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 animate-fade-in">
        <div className="max-w-md mx-auto space-y-8">
          {/* Carol's Story */}
          <div className="text-center space-y-4 animate-fade-in">
            <p className="text-lg text-muted-foreground tracking-wide leading-relaxed">
              Carol couldn't sleep one day at 3:23 AM and decided to create this...
            </p>
          </div>

          {/* Vote Section */}
          <div className="border border-border/50 rounded-lg p-6 space-y-4 bg-card/50 animate-fade-in">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground tracking-wide">
                would you use 1-hour versions with ambient music?
              </p>
              <p className="text-xs text-muted-foreground/60">
                help us prioritize what to build next
              </p>
            </div>
            
            {!showEmailCapture && !voteSubmitted ? (
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVote('yes')}
                  className="lowercase tracking-wide hover:bg-green-500/10 hover:border-green-500/50 hover:text-green-400 transition-colors"
                >
                  yes, i'd use it
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVote('no')}
                  className="lowercase tracking-wide hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-colors"
                >
                  no, 1 min is enough
                </Button>
              </div>
            ) : null}
            
            {/* Email Capture Form */}
            {showEmailCapture && !voteSubmitted ? (
              <div className="space-y-3 animate-fade-in">
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                    className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary lowercase"
                  />
                  <Button
                    onClick={handleEmailSubmit}
                    disabled={emailSubmitting}
                    size="sm"
                    className="lowercase tracking-wide"
                  >
                    {emailSubmitting ? "..." : "notify me"}
                  </Button>
                </div>
                <button
                  onClick={() => {
                    setShowEmailCapture(false);
                    setVoteSubmitted(true);
                    setTimeout(() => setVoteSubmitted(false), 3000);
                  }}
                  className="text-xs text-muted-foreground/60 hover:text-muted-foreground underline w-full text-center"
                >
                  skip, just save my vote
                </button>
              </div>
            ) : null}
            
            {/* Confirmation Message */}
            {voteSubmitted && (
              <p className="text-xs text-center text-green-400/80 animate-fade-in">
                thanks for your feedback 🌙
              </p>
            )}
          </div>

          {/* Start Another Session Button */}
          <div className="text-center animate-fade-in">
            <Button
              variant="ghost"
              onClick={() => {
                setSessionCompleted(false);
                setVoteSubmitted(false);
                setShowEmailCapture(false);
                setUserEmail("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground lowercase tracking-wide"
            >
              start another session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6 relative">
      {/* Generating Overlay */}
      {isGenerating && selectedCategory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="text-center space-y-6 px-4">
            {/* Animated circle indicator */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-primary/30 flex items-center justify-center animate-breathe">
                <div className="w-8 h-8 rounded-full bg-primary/50 animate-float" />
              </div>
            </div>
            
            {/* Messages */}
            <div className="space-y-2">
              <p className="text-2xl text-white/90 font-light tracking-wide animate-fade-in">
                {getCategoryWelcomeMessage(selectedCategory)}
              </p>
              <div className="text-white/60 text-sm tracking-wide space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <span>preparing your whisper</span>
                  <span className="inline-block w-8 text-left animate-pulse">...</span>
                </div>
                <p className="text-white/40 text-xs animate-fade-in">
                  (this may take a few seconds while we craft your unique session)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Listening Indicator - shown when audio is playing */}
      {isPlaying && !isGenerating && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top">
          <div className="bg-card/90 backdrop-blur-sm border border-border rounded-full px-6 py-3 flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-primary rounded-full animate-breathe" style={{ animationDelay: '0s' }} />
              <div className="w-1 h-4 bg-primary rounded-full animate-breathe" style={{ animationDelay: '0.2s' }} />
              <div className="w-1 h-4 bg-primary rounded-full animate-breathe" style={{ animationDelay: '0.4s' }} />
            </div>
            <span className="text-sm text-foreground/80 tracking-wide">listening...</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl space-y-6 animate-fade-in">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-light tracking-[0.2em] text-foreground animate-glow-pulse">
            3:23
          </h1>
          <p className="text-sm text-muted-foreground tracking-wide">
            before sleep, a whisper.
          </p>
        </div>

        {/* Voice & Ambient Settings */}
        <div className="grid grid-cols-1 gap-4">
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
              ambient sound <span className="normal-case text-muted-foreground/60">(very soon)</span>
            </Label>
            <Select disabled value="coming-soon">
              <SelectTrigger className="bg-card border-border opacity-60">
                <SelectValue placeholder="rain, ocean, fire..." />
              </SelectTrigger>
            </Select>
          </div>
        </div>

        {/* Category Buttons */}
        <div className="space-y-3">
          {CATEGORIES.map((category) => (
            <Button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              disabled={isPlaying || isGenerating}
              size="lg"
              className="w-full py-8 text-lg lowercase tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
            >
              {category.label}
              <span className="text-xs ml-2 opacity-70">(1 min)</span>
            </Button>
          ))}
        </div>

        {/* Custom Text Option */}
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCustomText(true)}
            disabled={isPlaying || isGenerating}
            className="text-muted-foreground hover:text-foreground lowercase tracking-wide text-xs"
          >
            or paste your own text
          </Button>
        </div>

        {/* Vote Section */}
        <div className="border border-border/50 rounded-lg p-6 space-y-4 bg-card/50">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground tracking-wide">
              would you use 1-hour versions with ambient music?
            </p>
            <p className="text-xs text-muted-foreground/60">
              help us prioritize what to build next
            </p>
          </div>
          
          {!showEmailCapture && !voteSubmitted ? (
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleVote('yes')}
                className="lowercase tracking-wide hover:bg-green-500/10 hover:border-green-500/50 hover:text-green-400 transition-colors"
              >
                yes, i'd use it
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleVote('no')}
                className="lowercase tracking-wide hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-colors"
              >
                no, 1 min is enough
              </Button>
            </div>
          ) : null}
          
          {/* Email Capture Form (solo para "YES" votes) */}
          {showEmailCapture && !voteSubmitted ? (
            <div className="space-y-3 animate-fade-in">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary lowercase"
                />
                <Button
                  onClick={handleEmailSubmit}
                  disabled={emailSubmitting}
                  size="sm"
                  className="lowercase tracking-wide"
                >
                  {emailSubmitting ? "..." : "notify me"}
                </Button>
              </div>
              <button
                onClick={() => {
                  setShowEmailCapture(false);
                  setVoteSubmitted(true);
                  setTimeout(() => setVoteSubmitted(false), 3000);
                }}
                className="text-xs text-muted-foreground/60 hover:text-muted-foreground underline w-full text-center"
              >
                skip, just save my vote
              </button>
            </div>
          ) : null}
          
          {/* Confirmation Message */}
          {voteSubmitted && (
            <p className="text-xs text-center text-green-400/80 animate-fade-in">
              thanks for your feedback 🌙
            </p>
          )}
        </div>

        {/* Custom Text Dialog */}
        <Dialog open={showCustomText} onOpenChange={setShowCustomText}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="lowercase tracking-wide">custom whisper</DialogTitle>
              <DialogDescription className="text-xs">
                paste your text (max 5,000 characters)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="paste your text here..."
                maxLength={5000}
                className="min-h-[300px] bg-card border-border text-foreground resize-none"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  {customText.length} / 5,000
                </p>
                <Button
                  onClick={handleCustomText}
                  disabled={!customText.trim()}
                  className="lowercase tracking-wide"
                >
                  generate whisper
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-muted-foreground tracking-wide">
          made at 3:23 am because i couldn't sleep · by{" "}
          <a href="https://x.com/carolmonroe" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors underline">
            carol monroe
          </a>
        </p>
      </footer>
    </main>
  );
};

export default Index;
