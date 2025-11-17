import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioPlayerOptions {
  initialDuration?: number;
  loopEnabled?: boolean;
  onComplete?: () => void;
  onLoopComplete?: () => void;
}

export const useAudioPlayer = (options: UseAudioPlayerOptions = {}) => {
  const {
    initialDuration = 60,
    loopEnabled = false,
    onComplete,
    onLoopComplete,
  } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [loopCount, setLoopCount] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startTimer = useCallback((duration: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setTimeLeft(duration);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsPlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const setupAudio = useCallback((audioUrl: string, duration: number = initialDuration) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      if (loopEnabled) {
        audio.currentTime = 0;
        audio.play();
        setTimeLeft(duration);
        setLoopCount((prev) => prev + 1);
        onLoopComplete?.();
      } else {
        stopTimer();
        setIsPlaying(false);
        onComplete?.();
      }
    };

    return audio;
  }, [loopEnabled, initialDuration, onComplete, onLoopComplete, stopTimer]);

  const play = useCallback(async (audioUrl?: string, duration: number = initialDuration) => {
    try {
      if (audioUrl) {
        setupAudio(audioUrl, duration);
      }

      if (!audioRef.current) {
        throw new Error('No audio reference available');
      }

      await audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
      startTimer(duration);
    } catch (error) {
      console.error('Error playing audio:', error);
      throw error;
    }
  }, [setupAudio, startTimer, initialDuration]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  }, [stopTimer]);

  const resume = useCallback(async () => {
    if (audioRef.current && isPaused) {
      await audioRef.current.play();
      setIsPaused(false);

      // Resume timer with current timeLeft
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [isPaused]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    stopTimer();
    setIsPlaying(false);
    setIsPaused(false);
    setTimeLeft(initialDuration);
    setLoopCount(0);
  }, [stopTimer, initialDuration]);

  const replay = useCallback(async () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
      startTimer(initialDuration);
    }
  }, [startTimer, initialDuration]);

  return {
    // State
    isPlaying,
    isPaused,
    timeLeft,
    loopCount,
    audioRef,

    // Methods
    play,
    pause,
    resume,
    stop,
    replay,
    setupAudio,
  };
};
