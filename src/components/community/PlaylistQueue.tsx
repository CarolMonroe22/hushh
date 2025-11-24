import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Music, X } from 'lucide-react';
import { type UserSession } from '@/hooks/useUserSessions';

type CommunitySession = UserSession & {
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

interface PlaylistQueueProps {
  queue: CommunitySession[];
  currentIndex: number;
  onSelectAudio: (index: number) => void;
  isExpanded: boolean;
  onClose: () => void;
}

export const PlaylistQueue = ({
  queue,
  currentIndex,
  onSelectAudio,
  isExpanded,
  onClose,
}: PlaylistQueueProps) => {
  if (!isExpanded) return null;

  const getSessionTitle = (session: CommunitySession) => {
    if (session.session_type === 'preset' && session.mood) {
      return `${session.mood} • ${session.ambient || 'ambient'}`;
    }
    if (session.vibe_description) {
      return session.vibe_description.slice(0, 40);
    }
    if (session.binaural_experience) {
      return session.binaural_experience.slice(0, 40);
    }
    if (session.voice_journey) {
      return session.voice_journey.slice(0, 40);
    }
    return 'audio session';
  };

  return (
    <Card className="fixed bottom-24 right-4 w-96 h-[500px] bg-background/95 backdrop-blur-lg border shadow-lg z-50">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold lowercase">queue ({queue.length})</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="h-[calc(500px-60px)]">
        <div className="p-4 space-y-2">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Music className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm lowercase">no audios in queue</p>
            </div>
          ) : (
            queue.map((session, index) => (
              <button
                key={session.id}
                onClick={() => onSelectAudio(index)}
                className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                  index === currentIndex
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-muted/50'
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={session.profiles?.avatar_url || ''} />
                  <AvatarFallback>
                    {session.profiles?.full_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium lowercase truncate">
                    {getSessionTitle(session)}
                  </p>
                  <p className="text-xs text-muted-foreground lowercase truncate">
                    {session.profiles?.full_name || 'anonymous'}
                  </p>
                </div>

                {index === currentIndex && (
                  <div className="flex items-center gap-1">
                    <div className="h-1 w-1 bg-primary rounded-full animate-pulse" />
                    <div className="h-1 w-1 bg-primary rounded-full animate-pulse delay-75" />
                    <div className="h-1 w-1 bg-primary rounded-full animate-pulse delay-150" />
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};
