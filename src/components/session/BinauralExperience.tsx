import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BINAURAL_EXPERIENCES, type BinauralExperience as BinauralExperienceType } from "@/lib/constants";

interface BinauralExperienceProps {
  selectedExperience: BinauralExperienceType | null;
  onExperienceChange: (experience: BinauralExperienceType) => void;
  loopEnabled: boolean;
  onLoopChange: (enabled: boolean) => void;
  saveSession: boolean;
  onSaveSessionChange: (save: boolean) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isAuthenticated: boolean;
}

const BinauralExperience = memo(({
  selectedExperience,
  onExperienceChange,
  loopEnabled,
  onLoopChange,
  saveSession,
  onSaveSessionChange,
  onGenerate,
  isGenerating,
  isAuthenticated,
}: BinauralExperienceProps) => {
  return (
    <section className="max-w-2xl mx-auto mt-12 mb-8 space-y-6 py-8 border-y border-border/30" aria-labelledby="binaural-heading">
      <div className="text-center space-y-2">
        <h2 id="binaural-heading" className="text-2xl font-light lowercase tracking-wide flex items-center justify-center gap-2">
          <span>🎧</span>
          <span>3D Binaural Experiences</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          immersive spatial audio scenarios (best with headphones)
        </p>
      </div>

      {/* Experience Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-4">
        {BINAURAL_EXPERIENCES.map((exp) => (
          <button
            key={exp.value}
            onClick={() => onExperienceChange(exp.value)}
            className={`p-5 rounded-xl border transition-all text-left space-y-2 ${
              selectedExperience === exp.value
                ? "border-primary bg-primary/10 shadow-lg scale-105"
                : "border-border bg-card hover:bg-accent hover:border-primary/50"
            }`}
          >
            <div className="text-3xl mb-2">{exp.emoji}</div>
            <div className="text-sm font-medium lowercase">{exp.label}</div>
            <div className="text-xs text-muted-foreground leading-tight">
              {exp.shortDesc}
            </div>
          </button>
        ))}
      </div>

      {/* Loop Mode Toggle and Save Session */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50">
          <div className="flex items-center gap-2">
            <Switch
              checked={loopEnabled}
              onCheckedChange={onLoopChange}
              id="loop-binaural"
            />
            <label htmlFor="loop-binaural" className="text-sm lowercase tracking-wide cursor-pointer">
              🔁 loop mode
            </label>
          </div>
          <span className="text-xs text-muted-foreground">
            {loopEnabled ? "will repeat continuously" : "play once"}
          </span>
        </div>

        {isAuthenticated && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50">
            <div className="flex items-center gap-2">
              <Switch
                checked={saveSession}
                onCheckedChange={onSaveSessionChange}
                id="save-session-binaural"
              />
              <label htmlFor="save-session-binaural" className="text-sm lowercase tracking-wide cursor-pointer">
                💾 save to library
              </label>
            </div>
            <span className="text-xs text-muted-foreground">
              {saveSession ? "will be saved" : "temporary only"}
            </span>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="px-4">
        <Button
          onClick={onGenerate}
          disabled={isGenerating || !selectedExperience}
          className="w-full py-6 text-base lowercase tracking-wide bg-primary/90 hover:bg-primary transition-all"
          size="lg"
        >
          {isGenerating ? "creating 3D experience..." : "🎧 start 3D experience"}
        </Button>
      </div>

      {/* Headphones Tip */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground/70 italic">
          💡 tip: use quality headphones for best spatial effect
        </p>
      </div>
    </section>
  );
});

BinauralExperience.displayName = "BinauralExperience";

export default BinauralExperience;
