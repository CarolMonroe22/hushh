import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { VIBE_STARTERS } from "@/lib/constants/session-constants";
import { Sparkles } from "lucide-react";

interface CreatorModeProps {
  vibeDescription: string;
  onDescriptionChange: (description: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const CreatorMode = ({
  vibeDescription,
  onDescriptionChange,
  onGenerate,
  isGenerating,
}: CreatorModeProps) => {
  const handleVibeStarterClick = (starter: typeof VIBE_STARTERS[0]) => {
    onDescriptionChange(starter.description);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-white/80 text-sm font-light tracking-wide flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Describe your desired vibe
        </Label>
        <Textarea
          placeholder="Describe how you want to feel... (at least 20 characters)"
          value={vibeDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="bg-black/20 border-white/20 text-white placeholder:text-white/40 min-h-[120px] resize-none focus:bg-black/30"
          maxLength={500}
        />
        <div className="text-xs text-white/50 text-right">
          {vibeDescription.length}/500 characters
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-white/60 text-xs font-light">
          Or try a vibe starter:
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {VIBE_STARTERS.slice(0, 6).map((starter) => (
            <Button
              key={starter.title}
              variant="outline"
              size="sm"
              className="bg-black/20 border-white/10 hover:bg-white/10 text-white/80 h-auto py-2 justify-start text-left"
              onClick={() => handleVibeStarterClick(starter)}
            >
              <span className="text-xs truncate">{starter.title}</span>
            </Button>
          ))}
        </div>
      </div>

      <Button
        className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-2"
        onClick={onGenerate}
        disabled={vibeDescription.trim().length < 20 || isGenerating}
      >
        {isGenerating ? (
          <>Generating Custom Vibe...</>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Custom Vibe
          </>
        )}
      </Button>
    </div>
  );
};
