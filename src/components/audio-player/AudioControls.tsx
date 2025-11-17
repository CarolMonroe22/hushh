import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Play, Pause, Square, Repeat } from "lucide-react";

interface AudioControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  loopEnabled: boolean;
  loopCount: number;
  timeLeft: number;
  generatedTitle?: string;
  needsManualPlay?: boolean;
  onPlay?: () => void;
  onPauseResume: () => void;
  onStop: () => void;
  onToggleLoop: () => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const AudioControls = ({
  isPlaying,
  isPaused,
  loopEnabled,
  loopCount,
  timeLeft,
  generatedTitle,
  needsManualPlay,
  onPlay,
  onPauseResume,
  onStop,
  onToggleLoop,
}: AudioControlsProps) => {
  return (
    <div className="space-y-6">
      {generatedTitle && (
        <div className="text-center">
          <h3 className="text-xl font-light text-white mb-1">
            {generatedTitle}
          </h3>
        </div>
      )}

      <div className="text-center space-y-2">
        <div className="text-6xl font-light text-white tabular-nums">
          {formatTime(timeLeft)}
        </div>
        {loopEnabled && loopCount > 0 && (
          <div className="text-sm text-white/60">
            Loop #{loopCount}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        {needsManualPlay && onPlay && (
          <Button
            size="lg"
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
            onClick={onPlay}
          >
            <Play className="w-5 h-5" />
            Tap to Play
          </Button>
        )}

        {!needsManualPlay && (
          <>
            <Button
              size="icon"
              variant="outline"
              className="bg-black/20 border-white/20 hover:bg-white/10 text-white"
              onClick={onPauseResume}
              disabled={!isPlaying && !isPaused}
            >
              {isPaused ? (
                <Play className="w-5 h-5" />
              ) : (
                <Pause className="w-5 h-5" />
              )}
            </Button>

            <Button
              size="icon"
              variant="outline"
              className="bg-black/20 border-white/20 hover:bg-white/10 text-white"
              onClick={onStop}
              disabled={!isPlaying && !isPaused}
            >
              <Square className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-black/20 rounded-lg border border-white/10">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-white/60" />
          <Label className="text-sm text-white/80 font-light">
            Loop Mode
          </Label>
        </div>
        <Switch
          checked={loopEnabled}
          onCheckedChange={onToggleLoop}
          className="data-[state=checked]:bg-white/40"
        />
      </div>

      <p className="text-center text-sm text-white/50 font-light italic">
        Breathe deep, let go
      </p>
    </div>
  );
};
