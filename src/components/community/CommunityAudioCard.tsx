import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Play, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface CommunityAudioCardProps {
  session: {
    id: string;
    session_type: string;
    mood?: string | null;
    ambient?: string | null;
    vibe_description?: string | null;
    binaural_experience?: string | null;
    voice_journey?: string | null;
    times_played?: number | null;
    created_at: string | null;
    user_id: string;
    audio_url: string;
  };
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  onPlay: () => void;
}

export const CommunityAudioCard = ({ session, profile, onPlay }: CommunityAudioCardProps) => {
  const navigate = useNavigate();

  const getSessionEmoji = () => {
    switch (session.session_type) {
      case 'preset': return '🎵';
      case 'creator': return '🎨';
      case 'binaural': return '🎧';
      case 'voice': return '🗣️';
      default: return '🎵';
    }
  };

  const getSessionTitle = () => {
    if (session.vibe_description) return session.vibe_description;
    if (session.mood && session.ambient) return `${session.mood} ${session.ambient}`;
    if (session.binaural_experience) return session.binaural_experience;
    if (session.voice_journey) return session.voice_journey;
    return `${session.session_type} session`;
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${session.user_id}`);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
      <CardContent className="p-6 space-y-4" onClick={onPlay}>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{getSessionEmoji()}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg lowercase line-clamp-2">{getSessionTitle()}</h3>
                <p className="text-sm text-muted-foreground lowercase">{session.session_type}</p>
              </div>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
          >
            <Play className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm lowercase text-muted-foreground hover:text-foreground">
              {profile?.full_name || 'anonymous'}
            </span>
          </button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground lowercase">
            <span>{session.times_played || 0} plays</span>
            {session.created_at && (
              <span>
                {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
