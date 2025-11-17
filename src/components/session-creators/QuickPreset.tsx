import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MOODS, AMBIENTS, type Mood, type Ambient } from "@/lib/constants/session-constants";

interface QuickPresetProps {
  selectedMood: Mood | null;
  selectedAmbient: Ambient | null;
  onMoodChange: (mood: Mood) => void;
  onAmbientChange: (ambient: Ambient) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  loopEnabled: boolean;
  onLoopChange: (enabled: boolean) => void;
  saveSession: boolean;
  onSaveSessionChange: (save: boolean) => void;
  user: any | null;
}

export const QuickPreset = ({
  selectedMood,
  selectedAmbient,
  onMoodChange,
  onAmbientChange,
  onGenerate,
  isGenerating,
  loopEnabled,
  onLoopChange,
  saveSession,
  onSaveSessionChange,
  user,
}: QuickPresetProps) => {
  return (
    <div className="space-y-6">
      {/* Mood Selection */}
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          mood
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {MOODS.map((mood) => (
            <button
              key={mood.value}
              onClick={() => onMoodChange(mood.value)}
              className={`p-4 rounded-lg border transition-all text-left ${
                selectedMood === mood.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <div className="text-2xl mb-1">{mood.emoji}</div>
              <div className="text-sm lowercase">{mood.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Ambient Selection */}
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          ambient
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {AMBIENTS.map((ambient) => (
            <button
              key={ambient.value}
              onClick={() => onAmbientChange(ambient.value)}
              className={`p-4 rounded-lg border transition-all text-left ${
                selectedAmbient === ambient.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <div className="text-2xl mb-1">{ambient.emoji}</div>
              <div className="text-sm lowercase">{ambient.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Loop Mode Toggle and Save Session */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50">
          <div className="flex items-center gap-2">
            <Switch
              checked={loopEnabled}
              onCheckedChange={onLoopChange}
              id="loop-preset"
            />
            <label htmlFor="loop-preset" className="text-sm lowercase tracking-wide cursor-pointer">
              🔁 loop mode
            </label>
          </div>
          <span className="text-xs text-muted-foreground">
            {loopEnabled ? "will repeat continuously" : "play once"}
          </span>
        </div>

        {user && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50">
            <div className="flex items-center gap-2">
              <Switch
                checked={saveSession}
                onCheckedChange={onSaveSessionChange}
                id="save-session-preset"
              />
              <label htmlFor="save-session-preset" className="text-sm lowercase tracking-wide cursor-pointer">
                💾 save to library
              </label>
            </div>
            <span className="text-xs text-muted-foreground">
              {saveSession ? "will be saved" : "temporary only"}
            </span>
          </div>
        )}
      </div>

      {/* Generate Preset Button */}
      <Button
        onClick={onGenerate}
        disabled={isGenerating || !selectedMood || !selectedAmbient}
        className="w-full py-6 text-base lowercase tracking-wide"
        size="lg"
      >
        {isGenerating ? "creating..." : "generate preset"}
      </Button>
    </div>
  );
};
