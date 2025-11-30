import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserSessions, type UserSession } from '@/hooks/useUserSessions';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Play, Trash2 } from 'lucide-react';

type SessionHistoryProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlaySession: (session: UserSession) => void;
};

export const SessionHistory = ({ open, onOpenChange, onPlaySession }: SessionHistoryProps) => {
  const { sessions, isLoading, toggleFavorite, deleteSession } = useUserSessions();
  const [filter, setFilter] = useState<'all' | 'preset' | 'creator' | 'binaural' | 'voice'>('all');

  const filteredSessions = sessions.filter((s) => filter === 'all' || s.session_type === filter);
  const favorites = sessions.filter((s) => s.is_favorite);

  const getSessionTitle = (session: UserSession) => {
    switch (session.session_type) {
      case 'preset':
        return `${session.mood} + ${session.ambient}`;
      case 'creator':
        return session.vibe_description?.substring(0, 40) || 'Custom vibe';
      case 'binaural':
        return session.binaural_experience || 'Binaural experience';
      case 'voice':
        return `${session.voice_journey} (${session.voice_gender})`;
      default:
        return 'Session';
    }
  };

  const getSessionEmoji = (session: UserSession) => {
    switch (session.session_type) {
      case 'preset':
        return '🎵';
      case 'creator':
        return '✨';
      case 'binaural':
        return '🎧';
      case 'voice':
        return '🗣️';
      default:
        return '🌙';
    }
  };

  const SessionCard = ({ session }: { session: UserSession }) => (
    <div 
      className="group relative p-5 rounded-xl hover:bg-card/50 transition-all cursor-pointer"
      onClick={() => {
        onPlaySession(session);
        onOpenChange(false);
      }}
    >
      <div className="flex items-center gap-4">
        <span className="text-3xl">{getSessionEmoji(session)}</span>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium lowercase truncate">
            {getSessionTitle(session)}
          </h3>
          <p className="text-sm text-muted-foreground lowercase">
            {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
          </p>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(session.id, session.is_favorite);
            }}
          >
            <Heart className={session.is_favorite ? 'fill-primary text-primary h-4 w-4' : 'h-4 w-4'} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9"
            onClick={(e) => {
              e.stopPropagation();
              deleteSession(session.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle className="lowercase text-2xl">your library</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 flex-wrap px-6 pb-4">
          {(['all', 'preset', 'creator', 'binaural', 'voice'] as const).map((f) => (
            <Button 
              key={f}
              variant={filter === f ? "default" : "ghost"}
              size="sm"
              className="lowercase rounded-full"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>

        <ScrollArea className="h-[50vh] px-6 pb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground lowercase">loading sessions...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-5xl mb-4">🌙</span>
              <p className="text-muted-foreground lowercase">no sessions yet</p>
              <p className="text-sm text-muted-foreground/70 lowercase mt-1">
                generate your first session to start
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filter === 'all' && favorites.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 px-1">
                    ⭐ favorites
                  </p>
                  <div className="space-y-1">
                    {favorites.map((session) => (
                      <SessionCard key={session.id} session={session} />
                    ))}
                  </div>
                  <div className="h-6" />
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 px-1">
                    all sessions
                  </p>
                </div>
              )}
              
              {filteredSessions
                .filter((s) => filter !== 'all' || !s.is_favorite)
                .map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
