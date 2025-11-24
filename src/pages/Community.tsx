import { useState } from 'react';
import { useCommunityAudios } from '@/hooks/useCommunityAudios';
import { CommunitySearch } from '@/components/community/CommunitySearch';
import { CommunityFilters } from '@/components/community/CommunityFilters';
import { CommunityAudioCard } from '@/components/community/CommunityAudioCard';
import { AudioGrid } from '@/components/community/AudioGrid';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Community = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sessionType, setSessionType] = useState<'all' | 'preset' | 'creator' | 'binaural' | 'voice'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most-played'>('newest');
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const { communityAudios, isLoading } = useCommunityAudios({
    search,
    sessionType,
    sortBy,
    limit: 50,
  });

  const handlePlay = (audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
    }
    const audio = new Audio(audioUrl);
    audio.play();
    setCurrentAudio(audio);
  };

  return (
    <div className="min-h-screen bg-background">
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
            <h1 className="text-4xl font-bold lowercase">community audios</h1>
            <p className="text-muted-foreground lowercase">
              discover and play public sessions created by the community
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground lowercase">
            <span>{communityAudios.length} public audios</span>
          </div>
        </div>

        <CommunitySearch value={search} onChange={setSearch} />

        <CommunityFilters
          sessionType={sessionType}
          sortBy={sortBy}
          onSessionTypeChange={setSessionType}
          onSortByChange={setSortBy}
        />

        <AudioGrid
          isLoading={isLoading}
          isEmpty={communityAudios.length === 0}
          emptyMessage={search || sessionType !== 'all' ? 'no matching audios found' : 'no public audios yet'}
        >
          {communityAudios.map((session) => (
            <CommunityAudioCard
              key={session.id}
              session={session}
              profile={session.profiles}
              onPlay={() => handlePlay(session.audio_url)}
            />
          ))}
        </AudioGrid>
      </div>
    </div>
  );
};

export default Community;
