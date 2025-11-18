import { useState, useRef, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AmbientBackground from "@/components/AmbientBackground";
import { SessionHistory } from "@/components/SessionHistory";
import { AuthModal } from "@/components/AuthModal";
import { type UserSession } from "@/hooks/useUserSessions";
import { RotatingHeroTitle } from "@/components/landing";
import { AppHeader } from "@/components/header/AppHeader";
import { QuickPreset } from "@/components/session-creators/QuickPreset";
import { CreatorMode } from "@/components/session-creators/CreatorMode";
import { BinauralExperience } from "@/components/session-creators/BinauralExperience";
import { VoiceJourney } from "@/components/session-creators/VoiceJourney";
import { AudioControls, SessionComplete, GeneratingScreen } from "@/components/audio-player";

// Constants
import {
  MOODS,
  AMBIENTS,
  BINAURAL_EXPERIENCES,
  VOICE_JOURNEYS,
  JOURNEY_VOICE_SETTINGS,
  VIBE_STARTERS,
  TITLE_ROTATIONS,
  type Mood,
  type Ambient,
  type BinauralExperience,
  type VoiceJourney,
} from "@/lib/constants/session-constants";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [selectedAmbient, setSelectedAmbient] = useState<Ambient | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isComplete, setIsComplete] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [vibeDescription, setVibeDescription] = useState("");
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
  const [isPaused, setIsPaused] = useState(false);
  const [saveSession, setSaveSession] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const pannerRef = useRef<PannerNode | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Cleanup effect - MUST be before any conditional returns
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

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "🌊 gentle pause",
        description: "having trouble signing out... let's try once more",
        variant: "gentle",
      });
    } else {
      navigate('/auth');
    }
  };

  const requireAuth = (action: () => void) => {
    if (!user) {
      setShowAuthModal(true);
      toast({
        title: "✨ create account",
        description: "sign up to generate your personalized audio experience",
        variant: "calm",
      });
      return;
    }
    action();
  };

  const handlePlaySession = (session: UserSession) => {
    console.log('Playing session from history:', session);
    
    // Stop current audio if any
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Clear timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationRef.current) clearInterval(animationRef.current);
    
    // Set up new audio
    audioRef.current = new Audio(session.audio_url);
    audioRef.current.loop = loopEnabled;
    
    audioRef.current.play().then(() => {
      setIsPlaying(true);
      setIsPaused(false);
      setTimeLeft(session.duration_seconds);
      setIsComplete(false);
      
      // Set session type specific states
      switch (session.session_type) {
        case 'preset':
          setSelectedMood(session.mood as Mood);
          setSelectedAmbient(session.ambient as Ambient);
          break;
        case 'creator':
          setVibeDescription(session.vibe_description || '');
          break;
        case 'binaural':
          setSelectedExperience(session.binaural_experience as BinauralExperience);
          break;
        case 'voice':
          setSelectedJourney(session.voice_journey as VoiceJourney);
          setVoiceGender(session.voice_gender as "female" | "male");
          break;
      }
      
      // Start timer
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
      
      toast({
        title: "▶️ Playing from library",
        duration: 2000,
      });
    }).catch((error) => {
      console.error('Error playing session:', error);
      toast({
        title: "❌ Playback Error",
        description: "Could not play session",
        variant: "destructive",
      });
    });
  };

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
        title: "🌸 one moment",
        description: "choose your mood and ambient sound to begin",
        variant: "gentle",
      });
      return;
    }

    initAudioContext();
    setIsGenerating(true);
    setNeedsManualPlay(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-asmr-session", {
        body: { 
          mood: selectedMood, 
          ambient: selectedAmbient,
          saveSession: saveSession,
          userId: user?.id
        },
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
                title: "🌸 ready to begin",
                description: "tap the play button when you're ready",
                variant: "calm",
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
      
      if (error?.message?.includes('tokens') || error?.message?.includes('NO_TOKENS_AVAILABLE')) {
        toast({
          title: "✨ please wait a moment",
          description: "taking a brief pause... free sessions will be available again soon",
          variant: "notice",
          duration: 6000,
        });
      } else if (error?.message?.includes('AUTH_FAILED') || error?.message?.includes('Authentication')) {
        toast({
          title: "🌙 gentle reminder",
          description: "let's reconnect... please reach out if you need support",
          variant: "gentle",
        });
      } else {
        toast({
          title: "🌊 taking a breath",
          description: error instanceof Error ? "something needs attention... let's try that again" : "let's take another approach... try once more when ready",
          variant: "gentle",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const startCreatorSession = async () => {
    if (!vibeDescription.trim() || vibeDescription.trim().length < 20) {
      toast({
        title: "🌸 share your vision",
        description: "describe your desired vibe with a few more words",
        variant: "gentle",
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
            saveSession: saveSession,
            userId: user?.id,
            vibeDescription: vibeDescription
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
                title: "🌸 ready to begin",
                description: "tap the play button when you're ready",
                variant: "calm",
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
      
      if (error?.message?.includes('tokens') || error?.message?.includes('NO_TOKENS_AVAILABLE')) {
        toast({
          title: "✨ please wait a moment",
          description: "taking a brief pause... free sessions will be available again soon",
          variant: "notice",
          duration: 6000,
        });
      } else if (error?.message?.includes('AUTH_FAILED') || error?.message?.includes('Authentication')) {
        toast({
          title: "🌙 gentle reminder",
          description: "let's reconnect... please reach out if you need support",
          variant: "gentle",
        });
      } else {
        toast({
          title: "🌊 taking a breath",
          description: error instanceof Error ? "something needs attention... let's try that again" : "let's take another approach... try once more when ready",
          variant: "gentle",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const startBinauralExperience = async () => {
    if (!selectedExperience) {
      toast({
        title: "🌸 one moment",
        description: "choose your 3d experience to begin",
        variant: "gentle",
      });
      return;
    }

    initAudioContext();
    setIsGenerating(true);
    setNeedsManualPlay(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-binaural-experience", {
        body: { 
          experience: selectedExperience,
          saveSession: saveSession,
          userId: user?.id
        },
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
      
      if (error?.message?.includes('tokens') || error?.message?.includes('NO_TOKENS_AVAILABLE')) {
        toast({
          title: "✨ please wait a moment",
          description: "taking a brief pause... free sessions will be available again soon",
          variant: "notice",
          duration: 6000,
        });
      } else if (error?.message?.includes('AUTH_FAILED') || error?.message?.includes('Authentication')) {
        toast({
          title: "🌙 gentle reminder",
          description: "let's reconnect... please reach out if you need support",
          variant: "gentle",
        });
      } else {
        toast({
          title: "🌊 taking a breath",
          description: error instanceof Error ? "something needs attention... let's try that again" : "let's take another approach... try once more when ready",
          variant: "gentle",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const startVoiceJourney = async () => {
    if (!selectedJourney) {
      toast({
        title: "🌸 one moment",
        description: "choose your voice journey to begin",
        variant: "gentle",
      });
      return;
    }

    if (withAmbient && !ambientForJourney) {
      toast({
        title: "🌸 gentle reminder",
        description: "select an ambient sound or turn off the option",
        variant: "gentle",
      });
      return;
    }

    // Store ambient audio ref for cleanup
    let ambientAudioRef: HTMLAudioElement | null = null;

    initAudioContext();
    setIsGenerating(true);
    setNeedsManualPlay(false);

    toast({
      title: "🗣️ preparing your voice journey",
      description: `generating guided ${selectedJourney} meditation...`,
      duration: 3000,
    });

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
            ...voiceSettings,
            saveSession: saveSession,
            userId: user?.id,
            journey: selectedJourney,
            voiceGender: voiceGender
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
      
      if (error?.message?.includes('tokens') || error?.message?.includes('NO_TOKENS_AVAILABLE')) {
        toast({
          title: "✨ please wait a moment",
          description: "taking a brief pause... free sessions will be available again soon",
          variant: "notice",
          duration: 6000,
        });
      } else if (error?.message?.includes('AUTH_FAILED') || error?.message?.includes('Authentication')) {
        toast({
          title: "🌙 gentle reminder",
          description: "let's reconnect... please reach out if you need support",
          variant: "gentle",
        });
      } else {
        toast({
          title: "🌊 taking a breath",
          description: error instanceof Error ? "something needs attention... let's try that again" : "let's take another approach... try once more when ready",
          variant: "gentle",
        });
      }
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
      setIsPaused(false);
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

  const handlePauseResume = async () => {
    console.log('handlePauseResume called - isPaused:', isPaused, 'audioRef exists:', !!audioRef.current);
    
    try {
      if (!audioRef.current) {
        console.error('No audio reference available');
        toast({
          title: "🌊 gentle reset",
          description: "let's begin a fresh session together",
          variant: "gentle",
        });
        return;
      }

      if (isPaused) {
        // Resume
        console.log('Attempting to resume audio...');
        await audioRef.current.play();
        setIsPaused(false);
        console.log('Audio resumed successfully');
        
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        toast({
          title: "🌿 continuing",
          description: "flow resumes",
          variant: "calm",
          duration: 1500,
        });
      } else {
        // Pause
        console.log('Attempting to pause audio...');
        audioRef.current.pause();
        setIsPaused(true);
        console.log('Audio paused successfully');

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        toast({
          title: "🍃 resting",
          description: "take your time",
          variant: "calm",
          duration: 1500,
        });
      }
    } catch (error) {
      console.error('Error in handlePauseResume:', error);
      toast({
        title: "🌊 gentle reset",
        description: error instanceof Error ? "let's try that once more" : "taking a moment to reconnect",
        variant: "gentle",
      });
    }
  };

  const handleStop = () => {
    console.log('handleStop called - audioRef exists:', !!audioRef.current);
    
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        console.log('Audio stopped successfully');
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
      
      setIsPlaying(false);
      setIsPaused(false);
      setLoopCount(0);
      setTimeLeft(60);
      
      toast({
        title: "🌙 session ended",
        description: "ready when you are",
        variant: "calm",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error in handleStop:', error);
      toast({
        title: "🌊 gentle pause",
        description: "session complete",
        variant: "gentle",
      });
    }
  };

  const handlePlay = async () => {
    console.log('handlePlay called - audioRef exists:', !!audioRef.current);
    
    try {
      if (!audioRef.current) {
        console.error('No audio reference in handlePlay');
        toast({
          title: "🌸 fresh start",
          description: "let's create a new session together",
          variant: "gentle",
        });
        return;
      }

      console.log('Starting playback from beginning...');
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
      setTimeLeft(60);
      console.log('Playback started successfully');

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
    } catch (error) {
      console.error('Error in handlePlay:', error);
      toast({
        title: "🌊 gentle pause",
        description: error instanceof Error ? "let's try once more" : "taking a moment... try again when ready",
        variant: "gentle",
      });
    }
  };

  const handleWaitlistSubmit = async () => {
    if (!waitlistEmail.trim() || !waitlistEmail.includes('@')) {
      toast({
        title: "🌸 gentle reminder",
        description: "please share a valid email address",
        variant: "gentle",
      });
      return;
    }

    setEmailSubmitted(true);
    toast({
      title: "✨ you're on the list",
      description: "we'll reach out when extended sessions are ready",
      variant: "calm",
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
    setIsPaused(false);
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

  // Show generating screen when creating audio
  if (isGenerating) {
    return <GeneratingScreen />;
  }

  if (isPlaying || needsManualPlay) {
    return (
      <AudioControls
        generatedTitle={generatedTitle}
        selectedMood={selectedMood}
        selectedAmbient={selectedAmbient}
        loopEnabled={loopEnabled}
        loopCount={loopCount}
        timeLeft={timeLeft}
        needsManualPlay={needsManualPlay}
        isPlaying={isPlaying}
        isPaused={isPaused}
        onManualPlay={() => {
          audioRef.current?.play().then(() => {
            setNeedsManualPlay(false);
            setIsPlaying(true);
            console.log('Manual play successful');
          }).catch((error) => {
            console.error('Manual play failed:', error);
            toast({
              title: "🌊 gentle pause",
              description: "let's try playing once more",
              variant: "gentle",
            });
          });
        }}
        onPlay={handlePlay}
        onPauseResume={handlePauseResume}
        onStop={handleStop}
        audioRef={audioRef}
      />
    );
  }

  if (isComplete) {
    return (
      <SessionComplete
        sessionFeedback={sessionFeedback}
        onFeedbackChange={setSessionFeedback}
        waitlistEmail={waitlistEmail}
        onWaitlistEmailChange={setWaitlistEmail}
        emailSubmitted={emailSubmitted}
        onWaitlistSubmit={handleWaitlistSubmit}
        onReplay={handleReplay}
        onNewSession={handleNewSession}
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-pulse text-4xl">🌙</div>
          <p className="text-muted-foreground lowercase">loading hushh...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader
        user={user}
        onShowHistory={() => setShowHistory(true)}
        onNavigateToAccount={() => navigate('/account')}
        onSignOut={handleSignOut}
        onSignUp={() => setShowAuthModal(true)}
      />

      {/* Session History Modal */}
      {user && (
        <SessionHistory 
          open={showHistory}
          onOpenChange={setShowHistory}
          onPlaySession={handlePlaySession}
        />
      )}

      {/* Auth Modal */}
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
        onSuccess={() => {
          setShowAuthModal(false);
          toast({
            title: "Welcome! 🎉",
            description: "You can now generate your personalized audio",
          });
        }}
      />

      <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
        {/* Logo Header */}
        <header className="flex items-center justify-center mb-16">
          <div className="text-4xl md:text-5xl font-light lowercase tracking-wide" role="banner">
            🌙 hushh
          </div>
        </header>

        {/* Hero Section */}
        <main>
          <RotatingHeroTitle />

          {/* Main Input Area - Creator Mode */}
          <section className="max-w-2xl mx-auto space-y-6 mb-12" aria-labelledby="create-vibe-heading">
            <h2 id="create-vibe-heading" className="sr-only">Create Your Custom Soundscape</h2>
            <CreatorMode
              vibeDescription={vibeDescription}
              onDescriptionChange={setVibeDescription}
              onGenerate={() => requireAuth(startCreatorSession)}
              isGenerating={isGenerating}
              loopEnabled={loopEnabled}
              onLoopChange={setLoopEnabled}
              saveSession={saveSession}
              onSaveSessionChange={setSaveSession}
              user={user}
            />
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
                <QuickPreset
                  selectedMood={selectedMood}
                  selectedAmbient={selectedAmbient}
                  onMoodChange={setSelectedMood}
                  onAmbientChange={setSelectedAmbient}
                  onGenerate={() => requireAuth(startSession)}
                  isGenerating={isGenerating}
                  loopEnabled={loopEnabled}
                  onLoopChange={setLoopEnabled}
                  saveSession={saveSession}
                  onSaveSessionChange={setSaveSession}
                  user={user}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          </section>

          {/* 3D Binaural Experiences Section */}
          <section className="max-w-2xl mx-auto mt-12 mb-8 py-8 border-y border-border/30" aria-labelledby="binaural-heading">
            <BinauralExperience
              selectedExperience={selectedExperience}
              onExperienceChange={setSelectedExperience}
              onGenerate={() => requireAuth(startBinauralExperience)}
              isGenerating={isGenerating}
              loopEnabled={loopEnabled}
              onLoopChange={setLoopEnabled}
              saveSession={saveSession}
              onSaveSessionChange={setSaveSession}
              user={user}
            />

            {/* Headphones Tip */}
            <div className="text-center mt-6">
              <p className="text-xs text-muted-foreground/70 italic">
                💡 tip: use quality headphones for best spatial effect
              </p>
            </div>
          </section>

          {/* Voice Journeys Section */}
          <section className="max-w-2xl mx-auto mt-12 mb-8 py-8 border-y border-border/30" aria-labelledby="voice-journeys-heading">
            <VoiceJourney
              selectedJourney={selectedJourney}
              voiceGender={voiceGender}
              withAmbient={withAmbient}
              ambientForJourney={ambientForJourney}
              onJourneyChange={setSelectedJourney}
              onVoiceGenderChange={setVoiceGender}
              onWithAmbientChange={setWithAmbient}
              onAmbientChange={setAmbientForJourney}
              onGenerate={() => requireAuth(startVoiceJourney)}
              isGenerating={isGenerating}
              loopEnabled={loopEnabled}
              onLoopChange={setLoopEnabled}
              saveSession={saveSession}
              onSaveSessionChange={setSaveSession}
              user={user}
            />
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
