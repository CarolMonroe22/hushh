import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AmbientBackground from "@/components/AmbientBackground";

type Mood = "relax" | "sleep" | "focus" | "gratitude" | "boost" | "stoic";
type Ambient = "rain" | "ocean" | "forest" | "fireplace" | "whitenoise" | "city";
type BinauralExperience = "barbershop" | "spa" | "ear-cleaning" | "bedtime" | "art-studio" | "yoga";
type VoiceJourney = "story" | "prayer" | "stoic" | "manifestation" | "motivational" | "brainwash" | "fullattention";

const MOODS: { value: Mood; label: string; emoji: string }[] = [
  { value: "relax", label: "relax", emoji: "🌙" },
  { value: "sleep", label: "sleep", emoji: "😴" },
  { value: "focus", label: "focus", emoji: "🎯" },
  { value: "gratitude", label: "gratitude", emoji: "🙏" },
  { value: "boost", label: "boost", emoji: "⚡" },
  { value: "stoic", label: "stoic", emoji: "🗿" },
];

const AMBIENTS: { value: Ambient; label: string; emoji: string }[] = [
  { value: "rain", label: "rain", emoji: "🌧️" },
  { value: "ocean", label: "ocean", emoji: "🌊" },
  { value: "forest", label: "forest", emoji: "🌲" },
  { value: "fireplace", label: "fireplace", emoji: "🔥" },
  { value: "whitenoise", label: "white noise", emoji: "📻" },
  { value: "city", label: "city", emoji: "🏙️" },
];

const BINAURAL_EXPERIENCES: { 
  value: BinauralExperience; 
  label: string; 
  emoji: string;
  shortDesc: string;
}[] = [
  { 
    value: "barbershop", 
    label: "Barbershop Visit", 
    emoji: "💈",
    shortDesc: "scissors, clippers, personal attention"
  },
  { 
    value: "spa", 
    label: "Spa & Massage", 
    emoji: "🧖",
    shortDesc: "soft whispers, gentle touches, oils"
  },
  { 
    value: "ear-cleaning", 
    label: "Ear Cleaning", 
    emoji: "👂",
    shortDesc: "close proximity, gentle sounds"
  },
  { 
    value: "bedtime", 
    label: "Bedtime Attention", 
    emoji: "🌙",
    shortDesc: "tucking in, soft whispers, goodnight"
  },
  { 
    value: "art-studio", 
    label: "Art Studio", 
    emoji: "🎨",
    shortDesc: "sketching, painting, creative energy"
  },
  { 
    value: "yoga", 
    label: "Yoga Session", 
    emoji: "🧘",
    shortDesc: "guided breathing, gentle movement"
  },
];

const VOICE_JOURNEYS: {
  value: VoiceJourney;
  label: string;
  emoji: string;
  voices: {
    female: string;
    male: string;
  };
  shortDesc: string;
}[] = [
  {
    value: "story",
    label: "Story",
    emoji: "📖",
    voices: {
      female: "pjcYQlDFKMbcOUp6F5GD", // Brittney - Meditation
      male: "Mu5jxyqZOLIGltFpfalg"    // Jameson - Meditation
    },
    shortDesc: "immersive bedtime tale"
  },
  {
    value: "prayer",
    label: "Prayer",
    emoji: "🙏",
    voices: {
      female: "pjcYQlDFKMbcOUp6F5GD", // Brittney - Meditation
      male: "Mu5jxyqZOLIGltFpfalg"    // Jameson - Meditation
    },
    shortDesc: "guided peaceful prayer"
  },
  {
    value: "stoic",
    label: "Stoic",
    emoji: "🏛️",
    voices: {
      female: "pjcYQlDFKMbcOUp6F5GD", // Brittney - Meditation
      male: "Mu5jxyqZOLIGltFpfalg"    // Jameson - Meditation
    },
    shortDesc: "wisdom & inner strength"
  },
  {
    value: "manifestation",
    label: "Manifest",
    emoji: "✨",
    voices: {
      female: "pjcYQlDFKMbcOUp6F5GD", // Brittney - Meditation
      male: "Mu5jxyqZOLIGltFpfalg"    // Jameson - Meditation
    },
    shortDesc: "abundance affirmations"
  },
  {
    value: "motivational",
    label: "Motivate",
    emoji: "🔥",
    voices: {
      female: "pjcYQlDFKMbcOUp6F5GD", // Brittney - Meditation
      male: "Mu5jxyqZOLIGltFpfalg"    // Jameson - Meditation
    },
    shortDesc: "powerful encouragement"
  },
  {
    value: "brainwash",
    label: "Brain Wash",
    emoji: "🧠",
    voices: {
      female: "pjcYQlDFKMbcOUp6F5GD", // Brittney - Meditation
      male: "Mu5jxyqZOLIGltFpfalg"    // Jameson - Meditation
    },
    shortDesc: "mental cleanse & reset"
  },
  {
    value: "fullattention",
    label: "Full Attention",
    emoji: "🎯",
    voices: {
      female: "pjcYQlDFKMbcOUp6F5GD", // Brittney - Meditation
      male: "Mu5jxyqZOLIGltFpfalg"    // Jameson - Meditation
    },
    shortDesc: "deep focus activation"
  },
];

const JOURNEY_VOICE_SETTINGS: Record<VoiceJourney, {
  stability: number;
  similarity: number;
  style: number;
  use_speaker_boost: boolean;
}> = {
  story: { 
    stability: 1.0,
    similarity: 0.85,
    style: 0.0,
    use_speaker_boost: true 
  },
  prayer: { 
    stability: 1.0,
    similarity: 0.85,
    style: 0.0,
    use_speaker_boost: true 
  },
  stoic: { 
    stability: 1.0,
    similarity: 0.85,
    style: 0.0,
    use_speaker_boost: true 
  },
  manifestation: { 
    stability: 1.0,
    similarity: 0.85,
    style: 0.0,
    use_speaker_boost: true 
  },
  motivational: { 
    stability: 1.0,
    similarity: 0.85,
    style: 0.0,
    use_speaker_boost: true 
  },
  brainwash: { 
    stability: 1.0,
    similarity: 0.85,
    style: 0.0,
    use_speaker_boost: true 
  },
  fullattention: { 
    stability: 1.0,
    similarity: 0.85,
    style: 0.0,
    use_speaker_boost: true 
  }
};

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
  {
    title: "stoic",
    description: "I need strength and clarity rooted in ancient wisdom. Create a grounded atmosphere that reminds me to focus on what I can control, accept what I cannot change, and act with virtue and reason regardless of external circumstances.",
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
  const navigate = useNavigate();
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
  const [needsManualPlay, setNeedsManualPlay] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<BinauralExperience | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<VoiceJourney | null>(null);
  const [withAmbient, setWithAmbient] = useState(false);
  const [ambientForJourney, setAmbientForJourney] = useState<Ambient | null>(null);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopCount, setLoopCount] = useState(0);
  const [voiceGender, setVoiceGender] = useState<"female" | "male">("female");
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const pannerRef = useRef<PannerNode | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) clearInterval(animationRef.current);
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

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('AudioContext initialized for mobile');
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
      console.log('AudioContext resumed');
    }
  };

  const setupNormalAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    return audio;
  };

  const setup3DAudio = (audioUrl: string) => {
    if (!audioContextRef.current) return null;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    // Create Web Audio API nodes
    const source = audioContextRef.current.createMediaElementSource(audio);
    const panner = audioContextRef.current.createPanner();
    
    // Configure panner for 3D binaural effect
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 10;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 0;
    panner.coneOuterGain = 0;
    
    // Connect: source -> panner -> destination
    source.connect(panner);
    panner.connect(audioContextRef.current.destination);
    
    pannerRef.current = panner;

    // Start circular animation
    let angle = 0;
    const radius = 2; // Distance from listener
    const speed = 0.02; // Rotation speed (radians per frame)
    
    animationRef.current = setInterval(() => {
      if (pannerRef.current) {
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(angle * 2) * 0.5; // Add vertical movement
        
        pannerRef.current.setPosition(x, y, z);
        angle += speed;
        
        if (angle > Math.PI * 2) {
          angle = 0;
        }
      }
    }, 50); // Update every 50ms for smooth movement

    return audio;
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

    initAudioContext();
    setIsGenerating(true);
    setNeedsManualPlay(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-asmr-session", {
        body: { mood: selectedMood, ambient: selectedAmbient },
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audioBlob = base64ToBlob(data.audioContent);
        const audioUrl = URL.createObjectURL(audioBlob);

        const audio = setupNormalAudio(audioUrl);
        
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Audio started playing successfully');
              setIsPlaying(true);
              setNeedsManualPlay(false);
            })
            .catch((error) => {
              console.error('Play was prevented:', error);
              setNeedsManualPlay(true);
              toast({
                title: "Tap to Play",
                description: "Please tap the play button to start audio",
              });
            });
        } else {
          setIsPlaying(true);
        }

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
            if (loopEnabled) {
              // Restart audio for loop
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
                setTimeLeft(60);
                setLoopCount(prev => prev + 1);
              }
            } else {
              // Normal completion
              if (timerRef.current) clearInterval(timerRef.current);
              setIsPlaying(false);
              setIsComplete(true);
            }
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

    initAudioContext();
    setIsGenerating(true);
    setNeedsManualPlay(false);

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

        const audio = setupNormalAudio(audioUrl);
        
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Audio started playing successfully');
              setIsPlaying(true);
              setNeedsManualPlay(false);
            })
            .catch((error) => {
              console.error('Play was prevented:', error);
              setNeedsManualPlay(true);
              toast({
                title: "Tap to Play",
                description: "Please tap the play button to start audio",
              });
            });
        } else {
          setIsPlaying(true);
        }

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
            if (loopEnabled) {
              // Restart audio for loop
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
                setTimeLeft(60);
                setLoopCount(prev => prev + 1);
              }
            } else {
              // Normal completion
              if (timerRef.current) clearInterval(timerRef.current);
              setIsPlaying(false);
              setIsComplete(true);
            }
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

  const startBinauralExperience = async () => {
    if (!selectedExperience) {
      toast({
        title: "Selection Required",
        description: "Please select a 3D experience",
        variant: "destructive",
      });
      return;
    }

    initAudioContext();
    setIsGenerating(true);
    setNeedsManualPlay(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-binaural-experience", {
        body: { experience: selectedExperience },
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audioBlob = base64ToBlob(data.audioContent);
        const audioUrl = URL.createObjectURL(audioBlob);

        const audio = setup3DAudio(audioUrl);
        if (!audio) {
          throw new Error('Failed to setup 3D audio');
        }
        
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('3D Audio started playing');
              setIsPlaying(true);
              setNeedsManualPlay(false);
            })
            .catch((error) => {
              console.error('Play prevented:', error);
              setNeedsManualPlay(true);
              toast({
                title: "Tap to Play",
                description: "Please tap the play button to start 3D audio",
              });
            });
        } else {
          setIsPlaying(true);
        }

        setGeneratedTitle(
          BINAURAL_EXPERIENCES.find(exp => exp.value === selectedExperience)?.label || "3D Experience"
        );
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
            if (loopEnabled) {
              // Restart audio for loop
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
                setTimeLeft(60);
                setLoopCount(prev => prev + 1);
              }
            } else {
              // Normal completion
              if (timerRef.current) clearInterval(timerRef.current);
              setIsPlaying(false);
              setIsComplete(true);
            }
          };
        }
      }
    } catch (error) {
      console.error("Binaural experience error:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate 3D experience",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const startVoiceJourney = async () => {
    if (!selectedJourney) {
      toast({
        title: "Selection Required",
        description: "Please select a voice journey",
        variant: "destructive",
      });
      return;
    }

    if (withAmbient && !ambientForJourney) {
      toast({
        title: "Ambient Sound Required",
        description: "Please select an ambient sound or uncheck the option",
        variant: "destructive",
      });
      return;
    }

    // Store ambient audio ref for cleanup
    let ambientAudioRef: HTMLAudioElement | null = null;

    initAudioContext();
    setIsGenerating(true);
    setNeedsManualPlay(false);

    try {
      console.log("Step 1: Generating voice journey script...");
      const { data: scriptData, error: scriptError } = await supabase.functions.invoke(
        "generate-voice-journey",
        { body: { category: selectedJourney } }
      );

      if (scriptError) throw scriptError;
      if (!scriptData?.text) throw new Error("No script generated");

      console.log("Step 2: Converting to speech...");
      const journey = VOICE_JOURNEYS.find(j => j.value === selectedJourney);
      const selectedVoiceId = journey?.voices[voiceGender];
      const voiceSettings = JOURNEY_VOICE_SETTINGS[selectedJourney];
      
      const { data: audioData, error: audioError } = await supabase.functions.invoke(
        "whisper-text",
        { 
          body: { 
            text: scriptData.text,
            voiceId: selectedVoiceId,
            ...voiceSettings
          }
        }
      );

      if (audioError) throw audioError;
      if (!audioData?.audioContent) throw new Error("No audio generated");

      // Step 3: Load ambient sound if enabled
      if (withAmbient && ambientForJourney) {
        console.log("Step 3: Loading ambient sound...");

        const { data: ambientData, error: ambientError } = await supabase.functions.invoke(
          "generate-ambient-sound",
          { body: { ambientType: ambientForJourney } }
        );

        if (!ambientError && ambientData?.url) {
          ambientAudioRef = new Audio(ambientData.url);
          ambientAudioRef.loop = true;
          ambientAudioRef.volume = 0.3; // Low volume to not overpower voice
          try {
            await ambientAudioRef.play();
            console.log("Ambient sound playing:", ambientData.cached ? "from cache" : "newly generated");
          } catch (playError) {
            console.error("Failed to play ambient:", playError);
          }
        } else {
          console.warn("Could not load ambient sound:", ambientError);
        }
      }

      console.log("Step 4: Playing voice audio...");
      const audioBlob = base64ToBlob(audioData.audioContent);
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = setupNormalAudio(audioUrl);
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Voice journey started playing');
            setIsPlaying(true);
            setNeedsManualPlay(false);
          })
          .catch((error) => {
            console.error('Play prevented:', error);
            setNeedsManualPlay(true);
            toast({
              title: "Tap to Play",
              description: "Please tap the play button to start audio",
            });
          });
      } else {
        setIsPlaying(true);
      }

      setGeneratedTitle(journey?.label || "Voice Journey");
      setTimeLeft(120); // 2 minutes for voice journeys

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
          if (loopEnabled) {
            // Restart audio for loop
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play();
              setTimeLeft(120); // 2 minutes for voice journeys
              setLoopCount(prev => prev + 1);
            }
          } else {
            // Normal completion
            if (timerRef.current) clearInterval(timerRef.current);
            setIsPlaying(false);
            
            // Stop ambient sound
            if (ambientAudioRef) {
              ambientAudioRef.pause();
              ambientAudioRef.currentTime = 0;
            }
            setIsComplete(true);
          }
        };
      }
    } catch (error) {
      console.error("Voice journey error:", error);
      
      // Cleanup ambient on error
      if (ambientAudioRef) {
        ambientAudioRef.pause();
        ambientAudioRef = null;
      }
      
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to create voice journey",
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
    setSelectedExperience(null);
    setSelectedJourney(null);
    setWithAmbient(false);
    setAmbientForJourney(null);
    setGeneratedTitle("");
    setVibeDescription("");
    setSessionFeedback(null);
    setWaitlistEmail("");
    setEmailSubmitted(false);
    setLoopCount(0);
  };

  if (isPlaying || needsManualPlay) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        <AmbientBackground isPlaying={true} />
        <div className="text-center space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-light lowercase tracking-wider text-foreground">
              {generatedTitle || `${selectedMood} + ${selectedAmbient}`}
            </h2>
            {loopEnabled && loopCount > 0 && (
              <p className="text-sm text-primary/80 flex items-center justify-center gap-2">
                <span>🔁</span> Loop #{loopCount}
              </p>
            )}
          </div>

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

          {needsManualPlay && audioRef.current && (
            <Button 
              onClick={() => {
                audioRef.current?.play().then(() => {
                  setNeedsManualPlay(false);
                  setIsPlaying(true);
                  console.log('Manual play successful');
                }).catch((error) => {
                  console.error('Manual play failed:', error);
                  toast({
                    title: "Playback Error",
                    description: "Unable to play audio. Please try again.",
                    variant: "destructive",
                  });
                });
              }}
              size="lg"
              className="lowercase tracking-wide"
            >
              ▶️ tap to play audio
            </Button>
          )}

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
        {/* Logo Header */}
        <header className="flex items-center justify-center mb-16">
          <div className="text-4xl md:text-5xl font-light lowercase tracking-wide" role="banner">
            🌙 hushh
          </div>
        </header>

        {/* Hero Section */}
        <main>
          <section className="text-center space-y-6 mb-16" aria-labelledby="hero-title">
            <h1 id="hero-title" className="text-5xl md:text-7xl font-light tracking-wider text-foreground">
              <span>AI-Generated Personalized </span>
              <span 
                className={`inline-block transition-all duration-600 ease-in-out ${
                  titleFade 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 -translate-y-2'
                }`}
                style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)' }}
                aria-live="polite"
              >
                {TITLE_ROTATIONS[currentTitleIndex]}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground tracking-wide">
              Describe your mood and get custom ASMR, ambient sounds, and guided meditation for sleep, focus, and relaxation
            </p>
          </section>

          {/* Main Input Area - Creator Mode */}
          <section className="max-w-2xl mx-auto space-y-6 mb-12" aria-labelledby="create-vibe-heading">
            <h2 id="create-vibe-heading" className="sr-only">Create Your Custom Soundscape</h2>
          {/* Large Textarea - Main Focus */}
          <div className="space-y-3">
            {/* Formula hint */}
            <div className="mb-2 px-1">
              <p className="text-xs text-muted-foreground/60 font-mono">
                formula: <span className="text-foreground/80">[goal/feeling]</span> + 
                <span className="text-muted-foreground/40"> with [sound]</span> + 
                <span className="text-muted-foreground/40"> [voice type]</span>
              </p>
            </div>
            <Textarea
              placeholder="describe how you want to feel... (e.g., 'I need deep focus for studying with calming rain')"
              value={vibeDescription}
              onChange={(e) => setVibeDescription(e.target.value)}
              className="min-h-[140px] resize-none text-base py-4 bg-card/70 border-border/90 hover:bg-card/75 focus:bg-card/80 focus:border-border transition-all"
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

          {/* Prompt Examples */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground/70 px-1">
              💡 try examples like:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "I need deep focus with rain sounds",
                "Can you help me sleep?",
                "Confidence boost for my presentation",
                "How can I calm my anxiety with ocean?",
                "Morning energy, no background music",
                "Help me meditate with singing bowls",
                "Study session with male voice and rain",
                "Can you create a peaceful lullaby?",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setVibeDescription(example)}
                  className="px-2.5 py-1 rounded-md text-xs bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border/50"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Loop Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50">
            <div className="flex items-center gap-2">
              <Switch 
                checked={loopEnabled} 
                onCheckedChange={setLoopEnabled}
                id="loop-creator"
              />
              <label htmlFor="loop-creator" className="text-sm lowercase tracking-wide cursor-pointer">
                🔁 loop mode
              </label>
            </div>
            <span className="text-xs text-muted-foreground">
              {loopEnabled ? "will repeat continuously" : "play once"}
            </span>
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
          </section>

          {/* Vibe Starters - Quick Inspiration */}
          <section className="max-w-2xl mx-auto space-y-4 mb-12" aria-labelledby="vibe-starters-heading">
            <h2 id="vibe-starters-heading" className="sr-only">Vibe Starters</h2>
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
          </section>

          {/* Quick Presets - Accordion */}
          <section className="max-w-2xl mx-auto" aria-labelledby="quick-presets-heading">
            <h2 id="quick-presets-heading" className="sr-only">Quick Presets</h2>
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

                {/* Loop Mode Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={loopEnabled} 
                      onCheckedChange={setLoopEnabled}
                      id="loop-preset"
                    />
                    <label htmlFor="loop-preset" className="text-sm lowercase tracking-wide cursor-pointer">
                      🔁 loop mode
                    </label>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {loopEnabled ? "will repeat continuously" : "play once"}
                  </span>
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
          </section>

          {/* 3D Binaural Experiences Section */}
          <section className="max-w-2xl mx-auto mt-12 mb-8 space-y-6 py-8 border-y border-border/30" aria-labelledby="binaural-heading">
            <div className="text-center space-y-2">
              <h2 id="binaural-heading" className="text-2xl font-light lowercase tracking-wide flex items-center justify-center gap-2">
                <span>🎧</span>
                <span>3D Binaural Experiences</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                immersive spatial audio scenarios (best with headphones)
              </p>
            </div>

            {/* Experience Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-4">
              {BINAURAL_EXPERIENCES.map((exp) => (
                <button
                  key={exp.value}
                  onClick={() => setSelectedExperience(exp.value)}
                  className={`p-5 rounded-xl border transition-all text-left space-y-2 ${
                    selectedExperience === exp.value
                      ? "border-primary bg-primary/10 shadow-lg scale-105"
                      : "border-border bg-card hover:bg-accent hover:border-primary/50"
                  }`}
                >
                  <div className="text-3xl mb-2">{exp.emoji}</div>
                  <div className="text-sm font-medium lowercase">{exp.label}</div>
                  <div className="text-xs text-muted-foreground leading-tight">
                    {exp.shortDesc}
                  </div>
                </button>
              ))}
            </div>

            {/* Loop Mode Toggle */}
            <div className="px-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50 mb-3">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={loopEnabled} 
                    onCheckedChange={setLoopEnabled}
                    id="loop-binaural"
                  />
                  <label htmlFor="loop-binaural" className="text-sm lowercase tracking-wide cursor-pointer">
                    🔁 loop mode
                  </label>
                </div>
                <span className="text-xs text-muted-foreground">
                  {loopEnabled ? "will repeat continuously" : "play once"}
                </span>
              </div>
            </div>

            {/* Generate Button */}
            <div className="px-4">
              <Button
                onClick={startBinauralExperience}
                disabled={isGenerating || !selectedExperience}
                className="w-full py-6 text-base lowercase tracking-wide bg-primary/90 hover:bg-primary transition-all"
                size="lg"
              >
                {isGenerating ? "creating 3D experience..." : "🎧 start 3D experience"}
              </Button>
            </div>

            {/* Headphones Tip */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground/70 italic">
                💡 tip: use quality headphones for best spatial effect
              </p>
            </div>
          </section>

          {/* Voice Journeys Section */}
          <section className="max-w-2xl mx-auto mt-12 mb-8 space-y-6 py-8 border-y border-border/30" aria-labelledby="voice-journeys-heading">
            <div className="text-center space-y-2">
              <h2 id="voice-journeys-heading" className="text-2xl font-light lowercase tracking-wide flex items-center justify-center gap-2">
                <span>🎙️</span>
                <span>Voice Journeys</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                pure guided audio experiences focused on voice
              </p>
            </div>

            {/* Voice Preference Selection */}
            <div className="px-4 space-y-4">
              {/* Gender Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium lowercase tracking-wide">voice gender</label>
                <div className="flex gap-2">
                  <Button
                    variant={voiceGender === "female" ? "default" : "outline"}
                    onClick={() => setVoiceGender("female")}
                    className="flex-1 lowercase tracking-wide"
                    type="button"
                  >
                    👩 female
                  </Button>
                  <Button
                    variant={voiceGender === "male" ? "default" : "outline"}
                    onClick={() => setVoiceGender("male")}
                    className="flex-1 lowercase tracking-wide"
                    type="button"
                  >
                    👨 male
                  </Button>
                </div>
              </div>
            </div>

            {/* Journey Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-4">
              {VOICE_JOURNEYS.map((journey) => (
                <button
                  key={journey.value}
                  onClick={() => setSelectedJourney(journey.value)}
                  className={`p-5 rounded-xl border transition-all text-left space-y-2 ${
                    selectedJourney === journey.value
                      ? "border-primary bg-primary/10 shadow-lg scale-105"
                      : "border-border bg-card hover:bg-accent hover:border-primary/50"
                  }`}
                >
                  <div className="text-3xl mb-2">{journey.emoji}</div>
                  <div className="text-sm font-medium lowercase">{journey.label}</div>
                  <div className="text-xs text-muted-foreground leading-tight">
                    {journey.shortDesc}
                  </div>
                </button>
              ))}
            </div>

            {/* Ambient Background Toggle */}
            <div className="px-4 space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card/50 border border-border/50">
                <input
                  type="checkbox"
                  id="ambient-toggle"
                  checked={withAmbient}
                  onChange={(e) => {
                    setWithAmbient(e.target.checked);
                    if (!e.target.checked) setAmbientForJourney(null);
                  }}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="ambient-toggle" className="text-sm lowercase tracking-wide cursor-pointer flex-1">
                  add ambient background sound
                </label>
              </div>

              {/* Ambient Selection (only if toggled) */}
              {withAmbient && (
                <div className="grid grid-cols-3 gap-2">
                  {AMBIENTS.map((ambient) => (
                    <button
                      key={ambient.value}
                      onClick={() => setAmbientForJourney(ambient.value)}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        ambientForJourney === ambient.value
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:bg-accent"
                      }`}
                    >
                      <div className="text-xl mb-1">{ambient.emoji}</div>
                      <div className="text-xs lowercase">{ambient.label}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Loop Mode Toggle */}
            <div className="px-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50 mb-3">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={loopEnabled} 
                    onCheckedChange={setLoopEnabled}
                    id="loop-voice"
                  />
                  <label htmlFor="loop-voice" className="text-sm lowercase tracking-wide cursor-pointer">
                    🔁 loop mode
                  </label>
                </div>
                <span className="text-xs text-muted-foreground">
                  {loopEnabled ? "will repeat continuously" : "play once"}
                </span>
              </div>
            </div>

            {/* Generate Button */}
            <div className="px-4">
              <Button
                onClick={startVoiceJourney}
                disabled={isGenerating || !selectedJourney || (withAmbient && !ambientForJourney)}
                className="w-full py-6 text-base lowercase tracking-wide bg-primary hover:bg-primary/90 transition-all"
                size="lg"
              >
                {isGenerating ? "creating voice journey..." : "🎙️ start journey"}
              </Button>
            </div>

            {/* Note */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground/70 italic">
                💡 voice journeys are 1-2 minutes of guided spoken content
              </p>
            </div>
          </section>

          {/* Story Section - Bottom */}
          <footer className="max-w-2xl mx-auto mt-16 mb-12 px-4">
            <div className="text-center space-y-6 py-12 border-t border-border/30">
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
              <div className="max-w-lg mx-auto space-y-4 text-muted-foreground leading-relaxed">
                <p className="text-base">
                  My mom used to tell me to relax before bed —<br />
                  to fall asleep to the sound of rain.<br />
                  We had those ambient CDs, soft music, slow rhythms...<br />
                  and I'd rest my head on her lap as she whispered songs.
                </p>
                
                <p className="text-base">
                  That feeling of calm, safety, and sound —<br />
                  I brought it here.
                </p>
              </div>

              {/* Waitlist CTA with Dialog */}
              <div className="pt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="lg"
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
          </footer>
        </main>
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
