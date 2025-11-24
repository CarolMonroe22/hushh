import { useState } from 'react';
import { useCommunityAudios } from '@/hooks/useCommunityAudios';
import { useCommunityPlayer } from '@/hooks/useCommunityPlayer';
import { CategoryCard } from '@/components/community/CategoryCard';
import { CommunityPlayer } from '@/components/community/CommunityPlayer';
import { PlaylistQueue } from '@/components/community/PlaylistQueue';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AmbientBackground from '@/components/AmbientBackground';

const Community = () => {
  const navigate = useNavigate();
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const { communityAudios: allAudios, isLoading: isLoadingAll } = useCommunityAudios({
    sessionType: 'all',
    limit: 100,
  });

  const { communityAudios: presetAudios, isLoading: isLoadingPreset } = useCommunityAudios({
    sessionType: 'preset',
    limit: 100,
  });

  const { communityAudios: creatorAudios, isLoading: isLoadingCreator } = useCommunityAudios({
    sessionType: 'creator',
    limit: 100,
  });

  const { communityAudios: binauralAudios, isLoading: isLoadingBinaural } = useCommunityAudios({
    sessionType: 'binaural',
    limit: 100,
  });

  const { communityAudios: voiceAudios, isLoading: isLoadingVoice } = useCommunityAudios({
    sessionType: 'voice',
    limit: 100,
  });

  const {
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
  } = useCommunityPlayer();

  const handlePlayCategory = (category: 'all' | 'preset' | 'creator' | 'binaural' | 'voice') => {
    let audios;
    switch (category) {
      case 'all':
        audios = allAudios;
        break;
      case 'preset':
        audios = presetAudios;
        break;
      case 'creator':
        audios = creatorAudios;
        break;
      case 'binaural':
        audios = binauralAudios;
        break;
      case 'voice':
        audios = voiceAudios;
        break;
      default:
        audios = [];
    }

    if (audios.length > 0) {
      loadPlaylist(audios);
    }
  };

  const getVideoKey = (): string => {
    if (!currentAudio) return 'home';
    
    // Para sesiones preset: usar mood o ambient
    if (currentAudio.session_type === 'preset') {
      if (currentAudio.mood) return currentAudio.mood;
      if (currentAudio.ambient) return currentAudio.ambient;
    }
    
    // Para sesiones binaural: usar binaural_experience
    if (currentAudio.session_type === 'binaural' && currentAudio.binaural_experience) {
      return currentAudio.binaural_experience;
    }
    
    // Para voice journeys: usar voice_journey
    if (currentAudio.session_type === 'voice' && currentAudio.voice_journey) {
      return currentAudio.voice_journey;
    }
    
    // Para creator sessions: usar video genérico
    if (currentAudio.session_type === 'creator') {
      return 'creator';
    }
    
    return 'home';
  };

  return (
    <>
      <AmbientBackground isPlaying={isPlaying} videoKey={getVideoKey()} />
      
      <div className="min-h-screen bg-background pb-32">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="lowercase"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            back to home
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold lowercase">community playlists</h1>
            <p className="text-muted-foreground lowercase">
              select a category and play all audios continuously
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <CategoryCard
            category="all"
            audioCount={allAudios.length}
            onPlayAll={() => handlePlayCategory('all')}
            isLoading={isLoadingAll}
          />
          <CategoryCard
            category="preset"
            audioCount={presetAudios.length}
            onPlayAll={() => handlePlayCategory('preset')}
            isLoading={isLoadingPreset}
          />
          <CategoryCard
            category="creator"
            audioCount={creatorAudios.length}
            onPlayAll={() => handlePlayCategory('creator')}
            isLoading={isLoadingCreator}
          />
          <CategoryCard
            category="binaural"
            audioCount={binauralAudios.length}
            onPlayAll={() => handlePlayCategory('binaural')}
            isLoading={isLoadingBinaural}
          />
          <CategoryCard
            category="voice"
            audioCount={voiceAudios.length}
            onPlayAll={() => handlePlayCategory('voice')}
            isLoading={isLoadingVoice}
          />
        </div>
      </div>

      {currentAudio && (
        <>
          <CommunityPlayer
            currentAudio={currentAudio}
            isPlaying={isPlaying}
            isShuffle={isShuffle}
            repeatMode={repeatMode}
            currentTime={currentTime}
            duration={duration}
            onTogglePlay={togglePlay}
            onNext={playNext}
            onPrevious={playPrevious}
            onToggleShuffle={toggleShuffle}
            onCycleRepeat={cycleRepeat}
            onSeek={seekTo}
            onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
            onClose={clearQueue}
            isQueueOpen={isQueueOpen}
          />

          <PlaylistQueue
            queue={queue}
            currentIndex={currentIndex}
            onSelectAudio={selectAudio}
            isExpanded={isQueueOpen}
            onClose={() => setIsQueueOpen(false)}
          />
        </>
      )}
      </div>
    </>
  );
};

export default Community;
