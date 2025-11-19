import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserSessions, type UserSession } from '@/hooks/useUserSessions';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Play, Trash2, Clock } from 'lucide-react';

type SessionHistoryProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlaySession: (session: UserSession) => void;
};

export const SessionHistory = ({ open, onOpenChange, onPlaySession }: SessionHistoryProps) => {
  const { sessions, isLoading, toggleFavorite, deleteSession } = useUserSessions();
  const [filter, setFilter] = useState<'all' | 'preset' | 'creator' | 'binaural' | 'voice'>('all');

  const filteredSessions = sessions.filter(
    (s) => filter === 'all' || s.session_type === filter
  );

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
    <div className="group relative p-4 rounded-lg border border-border/50 bg-card/30 hover:bg-card/50 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{getSessionEmoji(session)}</span>
            <h3 className="font-medium text-sm lowercase truncate">
              {getSessionTitle(session)}
            </h3>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground lowercase">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
            </span>
            {session.times_played > 0 && (
              <span>played {session.times_played}x</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => toggleFavorite(session.id, session.is_favorite)}
          >
            <Heart
              className={`h-4 w-4 ${
                session.is_favorite ? 'fill-primary text-primary' : ''
              }`}
            />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              onPlaySession(session);
              onOpenChange(false);
            }}
          >
            <Play className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => deleteSession(session.id)}
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
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="lowercase text-2xl">your library</DialogTitle>
        </DialogHeader>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b px-6">
            <TabsTrigger value="all" className="lowercase">all</TabsTrigger>
            <TabsTrigger value="preset" className="lowercase">preset</TabsTrigger>
            <TabsTrigger value="creator" className="lowercase">creator</TabsTrigger>
            <TabsTrigger value="binaural" className="lowercase">binaural</TabsTrigger>
            <TabsTrigger value="voice" className="lowercase">voice</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-0">
            <ScrollArea className="h-[50vh] px-6 py-4">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground lowercase">
                  loading your sessions...
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground lowercase mb-2">no sessions yet</p>
                  <p className="text-sm text-muted-foreground lowercase">
                    generate your first session to start your library
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {favorites.length > 0 && filter === 'all' && (
                    <>
                      <h4 className="text-sm font-medium lowercase text-muted-foreground mb-2">
                        ⭐ favorites
                      </h4>
                      {favorites.map((session) => (
                        <SessionCard key={session.id} session={session} />
                      ))}
                      <div className="h-4" />
                      <h4 className="text-sm font-medium lowercase text-muted-foreground mb-2">
                        all sessions
                      </h4>
                    </>
                  )}
                  
                  {filteredSessions
                    .filter((s) => filter !== 'all' || !s.is_favorite)
                    .map((session) => (
                      <SessionCard key={session.id} session={session} />
                    ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {!isLoading && sessions.length > 0 && (
          <div className="border-t p-4 bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground lowercase">
              <span>{sessions.length} total sessions</span>
              <span>{favorites.length} favorites</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
