import AmbientBackground from "@/components/AmbientBackground";

interface GeneratingScreenProps {
  title?: string;
  subtitle?: string;
}

export const GeneratingScreen = ({
  title = "🎵 crafting your experience",
  subtitle = "this may take a moment... breathe and relax",
}: GeneratingScreenProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <AmbientBackground isPlaying={true} />
      <div className="text-center space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-light lowercase tracking-wider text-foreground">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground lowercase tracking-wide">
            {subtitle}
          </p>
        </div>

        {/* Animated Circle - Same as AudioControls */}
        <div className="relative w-48 h-48 mx-auto">
          {/* Outer circle */}
          <div className="absolute inset-0 rounded-full border-4 border-primary/30" />
          {/* Spinning circle */}
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
               style={{ animationDuration: '2s' }} />
          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl animate-pulse" style={{ animationDuration: '2s' }}>✨</div>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground/70 lowercase tracking-wide">
          preparing your personalized soundscape...
        </p>
      </div>
    </div>
  );
};
