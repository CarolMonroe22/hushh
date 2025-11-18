import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AmbientBackground from "@/components/AmbientBackground";
import { type UserSession } from "@/hooks/useUserSessions";

// Lazy load components for code splitting
const SessionHistory = lazy(() => import("@/components/SessionHistory").then(module => ({ default: module.SessionHistory })));
const AuthModal = lazy(() => import("@/components/AuthModal").then(module => ({ default: module.AuthModal })));
import { LogOut, Archive, User, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Import new components
import PresetSession from "@/components/session/PresetSession";
import CreatorMode from "@/components/session/CreatorMode";
import BinauralExperience from "@/components/session/BinauralExperience";
import VoiceJourney from "@/components/session/VoiceJourney";

// Import constants
import {
  type Mood,
  type Ambient,
  type BinauralExperience as BinauralExperienceType,
  type VoiceJourney as VoiceJourneyType,
  BINAURAL_EXPERIENCES,
  VOICE_JOURNEYS,
  JOURNEY_VOICE_SETTINGS,
  TITLE_ROTATIONS,
} from "@/lib/constants";

// Import audio utilities
import { base64ToBlob, initAudioContext, setupNormalAudio, setup3DAudio, start3DAnimation } from "@/lib/audioUtils";

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
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [titleFade, setTitleFade] = useState(true);
  const [sessionFeedback, setSessionFeedback] = useState<'loved' | 'liked' | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [needsManualPlay, setNeedsManualPlay] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<BinauralExperienceType | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<VoiceJourneyType | null>(null);
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

  // Title rotation effect - MUST be before any conditional returns
  useEffect(() => {
    const titleInterval = setInterval(() => {
      setTitleFade(false);
      setTimeout(() => {
        setCurrentTitleIndex((prevIndex) =>
          (prevIndex + 1) % TITLE_ROTATIONS.length
        );
        setTitleFade(true);
      }, 600);
    }, 5000);

    return () => clearInterval(titleInterval);
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "❌ Error",
        description: "Could not sign out",
        variant: "destructive",
      });
    } else {
      navigate('/auth');
    }
  };

  const requireAuth = (action: () => void) => {
    if (!user) {
      setShowAuthModal(true);
      toast({
        title: "✨ Create Account",
        description: "Sign up to generate your personalized audio experience",
      });
      return;
    }
    action();
  };

  const handlePlaySession = async (session: UserSession) => {
    console.log('Playing session from history:', session);

    // Stop current audio if any
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Clear timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationRef.current) clearInterval(animationRef.current);

    try {
      // Download audio file from storage bucket
      const { data: audioData, error: downloadError } = await supabase.storage
        .from('user-sessions')
        .download(session.audio_url);

      if (downloadError) {
        throw new Error(`Failed to download audio: ${downloadError.message}`);
      }

      if (!audioData) {
        throw new Error('No audio data received');
      }

      // Convert blob to object URL
      const audioUrl = URL.createObjectURL(audioData);

      // Set up new audio
      audioRef.current = new Audio(audioUrl);
      audioRef.current.loop = loopEnabled;

      // Cleanup object URL when audio ends
      audioRef.current.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      });

      await audioRef.current.play();

      // Increment play count in database
      try {
        await supabase.rpc('increment_session_play_count', {
          session_id: session.id,
        });
      } catch (rpcError) {
        console.error('Failed to increment play count:', rpcError);
        // Don't fail playback if this fails
      }

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
          setSelectedExperience(session.binaural_experience as BinauralExperienceType);
          break;
        case 'voice':
          setSelectedJourney(session.voice_journey as VoiceJourneyType);
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
    } catch (error) {
      console.error('Error playing session:', error);
      toast({
        title: "❌ Playback Error",
        description: error instanceof Error ? error.message : "Could not play session",
        variant: "destructive",
      });
    }
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

    const context = initAudioContext();
    if (context) audioContextRef.current = context;
    setIsGenerating(true);
    setNeedsManualPlay(false);

    toast({
      title: "🎵 starting your asmr experience",
      description: `generating ${selectedMood} with ${selectedAmbient} sounds...`,
      duration: 3000,
    });

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
        audioRef.current = audio;

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

      if (error?.message?.includes('tokens') || error?.message?.includes('NO_TOKENS_AVAILABLE')) {
        toast({
          title: "⚠️ No Tokens Available",
          description: "Free session tokens are currently not available. Please try again later.",
          variant: "destructive",
          duration: 6000,
        });
      } else if (error?.message?.includes('AUTH_FAILED') || error?.message?.includes('Authentication')) {
        toast({
          title: "🔑 Authentication Error",
          description: "There was an authentication error. Please contact support.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Generation Error",
          description: error instanceof Error ? error.message : "Could not generate audio. Please try again.",
          variant: "destructive",
        });
      }
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

    const context = initAudioContext();
    if (context) audioContextRef.current = context;
    setIsGenerating(true);
    setNeedsManualPlay(false);

    toast({
      title: "🎨 creating your custom vibe",
      description: "step 1: interpreting your description...",
      duration: 3000,
    });

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

      toast({
        title: "🎵 generating audio",
        description: `step 2: crafting "${interpretData.title || 'your vibe'}"...`,
        duration: 3000,
      });

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
        audioRef.current = audio;

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

      if (error?.message?.includes('tokens') || error?.message?.includes('NO_TOKENS_AVAILABLE')) {
        toast({
          title: "⚠️ No Tokens Available",
          description: "Free session tokens are currently not available. Please try again later.",
          variant: "destructive",
          duration: 6000,
        });
      } else if (error?.message?.includes('AUTH_FAILED') || error?.message?.includes('Authentication')) {
        toast({
          title: "🔑 Authentication Error",
          description: "There was an authentication error. Please contact support.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Generation Error",
          description: error instanceof Error ? error.message : "Could not create your vibe. Please try again.",
          variant: "destructive",
        });
      }
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

    const context = initAudioContext();
    if (context) audioContextRef.current = context;
    setIsGenerating(true);
    setNeedsManualPlay(false);

    toast({
      title: "🎧 creating 3d experience",
      description: "generating immersive binaural audio...",
      duration: 3000,
    });

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

        if (audioContextRef.current) {
          const result = setup3DAudio(audioUrl, audioContextRef.current);
          if (!result) {
            throw new Error('Failed to setup 3D audio');
          }

          audioRef.current = result.audio;
          pannerRef.current = result.panner;

          // Start 3D animation
          animationRef.current = start3DAnimation(result.panner);

          const playPromise = result.audio.play();

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
          title: "⚠️ No Tokens Available",
          description: "Free session tokens are currently not available. Please try again later.",
          variant: "destructive",
          duration: 6000,
        });
      } else if (error?.message?.includes('AUTH_FAILED') || error?.message?.includes('Authentication')) {
        toast({
          title: "🔑 Authentication Error",
          description: "There was an authentication error. Please contact support.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Generation Error",
          description: error instanceof Error ? error.message : "Could not generate 3D experience. Please try again.",
          variant: "destructive",
        });
      }
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

    const context = initAudioContext();
    if (context) audioContextRef.current = context;
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
      audioRef.current = audio;

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
          title: "⚠️ No Tokens Available",
          description: "Free session tokens are currently not available. Please try again later.",
          variant: "destructive",
          duration: 6000,
        });
      } else if (error?.message?.includes('AUTH_FAILED') || error?.message?.includes('Authentication')) {
        toast({
          title: "🔑 Authentication Error",
          description: "There was an authentication error. Please contact support.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Generation Error",
          description: error instanceof Error ? error.message : "Could not generate voice journey. Please try again.",
          variant: "destructive",
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
          title: "⚠️ Audio Error",
          description: "Audio reference lost. Please start a new session.",
          variant: "destructive",
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
          title: "▶️ Resumed",
          description: "Playback resumed",
          duration: 2000,
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
          title: "⏸️ Paused",
          description: "Playback paused",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error in handlePauseResume:', error);
      toast({
        title: "❌ Playback Error",
        description: error instanceof Error ? error.message : "Could not pause/resume audio",
        variant: "destructive",
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
        title: "⏹️ Stopped",
        description: "Audio ready to play again",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error in handleStop:', error);
      toast({
        title: "⚠️ Stop Error",
        description: "Audio stopped but with errors",
        variant: "destructive",
      });
    }
  };

  const handlePlay = async () => {
    console.log('handlePlay called - audioRef exists:', !!audioRef.current);

    try {
      if (!audioRef.current) {
        console.error('No audio reference in handlePlay');
        toast({
          title: "⚠️ Audio Lost",
          description: "Please generate a new session",
          variant: "destructive",
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
        title: "❌ Playback Error",
        description: error instanceof Error ? error.message : "Could not start playback",
        variant: "destructive",
      });
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

  if (isPlaying || needsManualPlay) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        <AmbientBackground isPlaying={true} />
        <div className="text-center space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-light lowercase tracking-wider text-foreground">
              {generatedTitle || `${selectedMood} + ${selectedAmbient}`}
            </h2>
            {loopEnabled && (
              <div className="flex items-center justify-center gap-4 text-sm">
                <p className="text-primary/80 flex items-center gap-2">
                  <span>🔁</span> loop mode active
                </p>
                {loopCount > 0 && (
                  <p className="text-muted-foreground">
                    completed: {loopCount}
                  </p>
                )}
              </div>
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

          {/* Play button when audio is stopped but still available */}
          {!isPlaying && !isComplete && !needsManualPlay && audioRef.current && (
            <Button
              onClick={handlePlay}
              variant="default"
              size="lg"
              className="lowercase tracking-wide"
            >
              <span className="mr-2">▶️</span>
              play
            </Button>
          )}

          {/* Control buttons when audio is playing */}
          {isPlaying && !needsManualPlay && (
            <div className="space-y-4">
              {isPaused && (
                <p className="text-sm text-yellow-500 flex items-center justify-center gap-2">
                  <span>⏸️</span> paused
                </p>
              )}

              <div className="flex gap-3 justify-center items-center">
                <Button
                  onClick={handlePauseResume}
                  variant="outline"
                  size="lg"
                  className="lowercase tracking-wide"
                >
                  {isPaused ? (
                    <>
                      <span className="mr-2">▶️</span>
                      resume
                    </>
                  ) : (
                    <>
                      <span className="mr-2">⏸️</span>
                      pause
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleStop}
                  variant="destructive"
                  size="lg"
                  className="lowercase tracking-wide"
                >
                  <span className="mr-2">⏹️</span>
                  stop
                </Button>
              </div>
            </div>
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
      {/* Elegant Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-background/80 border-b border-border/50 shadow-sm animate-fade-in">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Left side - could add logo here */}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Library Icon with Tooltip */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowHistory(true)}
                        className="relative hover:scale-110 transition-transform"
                      >
                        <Archive className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Library</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 hover:bg-accent/50 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-md">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium lowercase">
                          {user.user_metadata?.full_name || 'user'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate lowercase">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/account')} className="lowercase cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>my account</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowHistory(true)} className="lowercase cursor-pointer">
                      <Archive className="mr-2 h-4 w-4" />
                      <span>library</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive lowercase cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowAuthModal(true)}
                  className="text-sm lowercase hover:bg-accent/50 transition-colors"
                >
                  login
                </Button>
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="text-sm lowercase bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all"
                >
                  sign up
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Session History Modal */}
      {user && (
        <Suspense fallback={<div />}>
          <SessionHistory
            open={showHistory}
            onOpenChange={setShowHistory}
            onPlaySession={handlePlaySession}
          />
        </Suspense>
      )}

      {/* Auth Modal */}
      <Suspense fallback={<div />}>
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
      </Suspense>

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
              <span>1-Minute </span>
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
              build beautiful feelings, in sound
            </p>
          </section>

          {/* Creator Mode Component */}
          <CreatorMode
            vibeDescription={vibeDescription}
            onVibeChange={setVibeDescription}
            loopEnabled={loopEnabled}
            onLoopChange={setLoopEnabled}
            saveSession={saveSession}
            onSaveSessionChange={setSaveSession}
            onGenerate={() => requireAuth(startCreatorSession)}
            isGenerating={isGenerating}
            isAuthenticated={!!user}
          />

          {/* Preset Session Component */}
          <PresetSession
            selectedMood={selectedMood}
            selectedAmbient={selectedAmbient}
            onMoodChange={setSelectedMood}
            onAmbientChange={setSelectedAmbient}
            loopEnabled={loopEnabled}
            onLoopChange={setLoopEnabled}
            saveSession={saveSession}
            onSaveSessionChange={setSaveSession}
            onGenerate={() => requireAuth(startSession)}
            isGenerating={isGenerating}
            isAuthenticated={!!user}
          />

          {/* Binaural Experience Component */}
          <BinauralExperience
            selectedExperience={selectedExperience}
            onExperienceChange={setSelectedExperience}
            loopEnabled={loopEnabled}
            onLoopChange={setLoopEnabled}
            saveSession={saveSession}
            onSaveSessionChange={setSaveSession}
            onGenerate={() => requireAuth(startBinauralExperience)}
            isGenerating={isGenerating}
            isAuthenticated={!!user}
          />

          {/* Voice Journey Component */}
          <VoiceJourney
            selectedJourney={selectedJourney}
            onJourneyChange={setSelectedJourney}
            voiceGender={voiceGender}
            onVoiceGenderChange={setVoiceGender}
            withAmbient={withAmbient}
            onWithAmbientChange={setWithAmbient}
            ambientForJourney={ambientForJourney}
            onAmbientChange={setAmbientForJourney}
            loopEnabled={loopEnabled}
            onLoopChange={setLoopEnabled}
            saveSession={saveSession}
            onSaveSessionChange={setSaveSession}
            onGenerate={() => requireAuth(startVoiceJourney)}
            isGenerating={isGenerating}
            isAuthenticated={!!user}
          />

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
