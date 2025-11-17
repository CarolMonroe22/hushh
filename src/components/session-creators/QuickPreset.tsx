import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MOODS, AMBIENTS, type Mood, type Ambient } from "@/lib/constants/session-constants";

interface QuickPresetProps {
  selectedMood: Mood | null;
  selectedAmbient: Ambient | null;
  onMoodChange: (mood: Mood) => void;
  onAmbientChange: (ambient: Ambient) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const QuickPreset = ({
  selectedMood,
  selectedAmbient,
  onMoodChange,
  onAmbientChange,
  onGenerate,
  isGenerating,
}: QuickPresetProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-white/80 text-sm font-light tracking-wide">
          Choose your mood
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {MOODS.map((mood) => (
            <Button
              key={mood.value}
              variant={selectedMood === mood.value ? "default" : "outline"}
              className={`h-auto py-3 px-4 flex flex-col items-center gap-1 transition-all ${
                selectedMood === mood.value
                  ? "bg-white/20 border-white/40"
                  : "bg-black/20 border-white/20 hover:bg-white/10"
              }`}
              onClick={() => onMoodChange(mood.value)}
            >
              <span className="text-2xl">{mood.emoji}</span>
              <span className="text-xs text-white/90 font-light">
                {mood.label}
              </span>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-white/80 text-sm font-light tracking-wide">
          Choose your ambient
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {AMBIENTS.map((ambient) => (
            <Button
              key={ambient.value}
              variant={selectedAmbient === ambient.value ? "default" : "outline"}
              className={`h-auto py-3 px-4 flex flex-col items-center gap-1 transition-all ${
                selectedAmbient === ambient.value
                  ? "bg-white/20 border-white/40"
                  : "bg-black/20 border-white/20 hover:bg-white/10"
              }`}
              onClick={() => onAmbientChange(ambient.value)}
            >
              <span className="text-2xl">{ambient.emoji}</span>
              <span className="text-xs text-white/90 font-light">
                {ambient.label}
              </span>
            </Button>
          ))}
        </div>
      </div>

      <Button
        className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
        onClick={onGenerate}
        disabled={!selectedMood || !selectedAmbient || isGenerating}
      >
        {isGenerating ? "Generating..." : "Generate Session"}
      </Button>
    </div>
  );
};
