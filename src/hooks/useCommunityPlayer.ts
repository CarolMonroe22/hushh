import { useState, useRef, useEffect } from 'react';
import { type UserSession } from './useUserSessions';
import { supabase } from '@/integrations/supabase/client';

type CommunitySession = UserSession & {
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

type RepeatMode = 'off' | 'all' | 'one';

export const useCommunityPlayer = () => {
  const [queue, setQueue] = useState<CommunitySession[]>([]);
  const [originalQueue, setOriginalQueue] = useState<CommunitySession[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(new Audio());

  const currentAudio = queue[currentIndex];

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const loadPlaylist = (audios: CommunitySession[]) => {
    console.log('📋 Loading playlist with', audios.length, 'audios');
    setOriginalQueue(audios);
    const playQueue = isShuffle ? shuffleArray(audios) : audios;
    setQueue(playQueue);
    setCurrentIndex(0);
    setIsPlaying(true);
  };

  const updatePlayCount = async (sessionId: string) => {
    try {
      await supabase.rpc('increment_session_play_count', { session_id: sessionId });
    } catch (error) {
      console.error('Error updating play count:', error);
    }
  };

  const playNext = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }

    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    } else if (repeatMode === 'all') {
      setCurrentIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const playPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleShuffle = () => {
    const newShuffle = !isShuffle;
    setIsShuffle(newShuffle);
    
    if (newShuffle) {
      const current = queue[currentIndex];
      const remaining = queue.filter((_, idx) => idx !== currentIndex);
      const shuffled = shuffleArray(remaining);
      setQueue([current, ...shuffled]);
      setCurrentIndex(0);
    } else {
      const current = queue[currentIndex];
      const currentId = current.id;
      const newIndex = originalQueue.findIndex(s => s.id === currentId);
      setQueue(originalQueue);
      setCurrentIndex(newIndex >= 0 ? newIndex : 0);
    }
  };

  const cycleRepeat = () => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const currentModeIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const selectAudio = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  };

  const clearQueue = () => {
    setQueue([]);
    setOriginalQueue([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    console.log('🔧 Setting up audio listeners');

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (currentAudio) {
        updatePlayCount(currentAudio.id);
      }
      playNext();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex, queue, repeatMode]);

  useEffect(() => {
    if (!audioRef.current || !currentAudio) {
      console.log('⚠️ No audioRef or currentAudio');
      return;
    }

    console.log('🎵 Loading audio:', currentAudio.audio_url);
    audioRef.current.src = currentAudio.audio_url;
    audioRef.current.load();
    
    if (isPlaying) {
      audioRef.current.play()
        .then(() => console.log('✅ Audio playing'))
        .catch(err => console.error('❌ Play failed:', err));
    }
  }, [currentAudio]);

  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  return {
    queue,
    currentIndex,
    currentAudio,
    isPlaying,
    isShuffle,
    repeatMode,
    currentTime,
    duration,
    loadPlaylist,
    playNext,
    playPrevious,
    togglePlay,
    toggleShuffle,
    cycleRepeat,
    seekTo,
    selectAudio,
    clearQueue,
    audioRef,
  };
};
