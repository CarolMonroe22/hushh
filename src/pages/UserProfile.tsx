import { useParams, useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { UserProfileCard } from '@/components/community/UserProfileCard';
import { CommunityAudioCard } from '@/components/community/CommunityAudioCard';
import { AudioGrid } from '@/components/community/AudioGrid';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const { profile, sessions, stats, isLoading } = useUserProfile(userId || '');

  const handlePlay = (audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
    }
    const audio = new Audio(audioUrl);
    audio.play();
    setCurrentAudio(audio);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-muted rounded-lg" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold lowercase">user not found</h1>
          <Button onClick={() => navigate('/community')} className="lowercase">
            back to community
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/community')}
          className="lowercase"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          back to community
        </Button>

        <UserProfileCard profile={profile} stats={stats} />

        <div className="space-y-4">
          <h2 className="text-2xl font-bold lowercase">public sessions</h2>
          <AudioGrid
            isLoading={false}
            isEmpty={sessions.length === 0}
            emptyMessage="this user hasn't shared any public sessions yet"
          >
            {sessions.map((session) => (
              <CommunityAudioCard
                key={session.id}
                session={session}
                profile={profile}
                onPlay={() => handlePlay(session.audio_url)}
              />
            ))}
          </AudioGrid>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
