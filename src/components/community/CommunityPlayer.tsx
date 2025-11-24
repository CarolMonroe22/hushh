import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1,
  Heart,
  Save,
  List,
  X
} from 'lucide-react';
import { useCommunityLikes } from '@/hooks/useCommunityLikes';
import { useSaveToCollection } from '@/hooks/useSaveToCollection';
import { type UserSession } from '@/hooks/useUserSessions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type CommunitySession = UserSession & {
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

interface CommunityPlayerProps {
  currentAudio: CommunitySession | null;
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onSeek: (time: number) => void;
  onToggleQueue: () => void;
  onClose: () => void;
  isQueueOpen: boolean;
}

const formatTime = (seconds: number) => {
  if (!isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const CommunityPlayer = ({
  currentAudio,
  isPlaying,
  isShuffle,
  repeatMode,
  currentTime,
  duration,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleShuffle,
  onCycleRepeat,
  onSeek,
  onToggleQueue,
  onClose,
  isQueueOpen,
}: CommunityPlayerProps) => {
  const { isLiked, toggleLike } = useCommunityLikes(currentAudio?.id || '');
  const { saveToCollection } = useSaveToCollection();

  if (!currentAudio) return null;

  const getSessionTitle = () => {
    if (currentAudio.session_type === 'preset' && currentAudio.mood) {
      return `${currentAudio.mood} • ${currentAudio.ambient || 'ambient'}`;
    }
    if (currentAudio.vibe_description) {
      return currentAudio.vibe_description.slice(0, 50);
    }
    if (currentAudio.binaural_experience) {
      return currentAudio.binaural_experience.slice(0, 50);
    }
    if (currentAudio.voice_journey) {
      return currentAudio.voice_journey.slice(0, 50);
    }
    return 'audio session';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Audio Info */}
          <div className="flex items-center gap-3 min-w-[250px]">
            <Avatar className="h-12 w-12">
              <AvatarImage src={currentAudio.profiles?.avatar_url || ''} />
              <AvatarFallback>
                {currentAudio.profiles?.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium lowercase truncate">
                {getSessionTitle()}
              </p>
              <p className="text-xs text-muted-foreground lowercase truncate">
                {currentAudio.profiles?.full_name || 'anonymous'}
              </p>
            </div>
          </div>

          {/* Center Controls */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleShuffle}
                className={isShuffle ? 'text-primary' : 'text-muted-foreground'}
              >
                <Shuffle className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="icon" onClick={onPrevious}>
                <SkipBack className="h-5 w-5" />
              </Button>

              <Button 
                variant="default" 
                size="icon" 
                onClick={onTogglePlay}
                className="h-10 w-10"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>

              <Button variant="ghost" size="icon" onClick={onNext}>
                <SkipForward className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onCycleRepeat}
                className={repeatMode !== 'off' ? 'text-primary' : 'text-muted-foreground'}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="h-4 w-4" />
                ) : (
                  <Repeat className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={(value) => onSeek(value[0])}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLike}
              className={isLiked ? 'text-red-500' : 'text-muted-foreground'}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => saveToCollection(currentAudio)}
            >
              <Save className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleQueue}
              className={isQueueOpen ? 'text-primary' : 'text-muted-foreground'}
            >
              <List className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
