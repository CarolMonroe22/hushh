import { Button } from "@/components/ui/button";
import AmbientBackground from "@/components/AmbientBackground";

interface AudioControlsProps {
  generatedTitle: string;
  selectedMood: string | null;
  selectedAmbient: string | null;
  loopEnabled: boolean;
  loopCount: number;
  timeLeft: number;
  needsManualPlay: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  onManualPlay: () => void;
  onPlay: () => void;
  onPauseResume: () => void;
  onStop: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export const AudioControls = ({
  generatedTitle,
  selectedMood,
  selectedAmbient,
  loopEnabled,
  loopCount,
  timeLeft,
  needsManualPlay,
  isPlaying,
  isPaused,
  onManualPlay,
  onPlay,
  onPauseResume,
  onStop,
  audioRef,
}: AudioControlsProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <AmbientBackground isPlaying={true} />
      <div className="text-center space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-light lowercase tracking-wider text-foreground">
            {generatedTitle || `${selectedMood} + ${selectedAmbient}`}
          </h2>
          {loopEnabled && (
            <div className="flex items-center justify-center gap-4 text-sm">
              <p className="text-primary/80 flex items-center gap-2">
                <span>🔁</span> loop mode active
              </p>
              {loopCount > 0 && (
                <p className="text-muted-foreground">
                  completed: {loopCount}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="relative w-48 h-48 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-primary/30" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-light">{timeLeft}</div>
              <div className="text-sm text-muted-foreground lowercase tracking-wide">seconds</div>
            </div>
          </div>
        </div>

        {needsManualPlay && audioRef.current && (
          <Button
            onClick={onManualPlay}
            size="lg"
            className="lowercase tracking-wide"
          >
            ▶️ tap to play audio
          </Button>
        )}

        {/* Play button when audio is stopped but still available */}
        {!isPlaying && !needsManualPlay && audioRef.current && (
          <Button
            onClick={onPlay}
            variant="default"
            size="lg"
            className="lowercase tracking-wide"
          >
            <span className="mr-2">▶️</span>
            play
          </Button>
        )}

        {/* Control buttons when audio is playing */}
        {isPlaying && !needsManualPlay && (
          <div className="space-y-4">
            {isPaused && (
              <p className="text-sm text-yellow-500 flex items-center justify-center gap-2">
                <span>⏸️</span> paused
              </p>
            )}

            <div className="flex gap-3 justify-center items-center">
              <Button
                onClick={onPauseResume}
                variant="outline"
                size="lg"
                className="lowercase tracking-wide"
              >
                {isPaused ? (
                  <>
                    <span className="mr-2">▶️</span>
                    resume
                  </>
                ) : (
                  <>
                    <span className="mr-2">⏸️</span>
                    pause
                  </>
                )}
              </Button>

              <Button
                onClick={onStop}
                variant="destructive"
                size="lg"
                className="lowercase tracking-wide"
              >
                <span className="mr-2">⏹️</span>
                stop
              </Button>
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground lowercase tracking-wide">
          breathe deep, let go
        </p>
      </div>
    </div>
  );
};
