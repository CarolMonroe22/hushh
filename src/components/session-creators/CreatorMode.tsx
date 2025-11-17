import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { VIBE_STARTERS } from "@/lib/constants/session-constants";

interface CreatorModeProps {
  vibeDescription: string;
  onDescriptionChange: (description: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  loopEnabled: boolean;
  onLoopChange: (enabled: boolean) => void;
  saveSession: boolean;
  onSaveSessionChange: (save: boolean) => void;
  user: any | null;
}

const PROMPT_EXAMPLES = [
  "I need deep focus with rain sounds",
  "Can you help me sleep?",
  "Confidence boost for my presentation",
  "How can I calm my anxiety with ocean?",
  "Morning energy, no background music",
  "Help me meditate with singing bowls",
  "Study session with male voice and rain",
  "Can you create a peaceful lullaby?",
];

export const CreatorMode = ({
  vibeDescription,
  onDescriptionChange,
  onGenerate,
  isGenerating,
  loopEnabled,
  onLoopChange,
  saveSession,
  onSaveSessionChange,
  user,
}: CreatorModeProps) => {
  return (
    <div className="space-y-6">
      {/* Large Textarea - Main Focus */}
      <div className="space-y-3">
        {/* Formula hint */}
        <div className="mb-2 px-1">
          <p className="text-xs text-muted-foreground/60 font-mono">
            formula: <span className="text-foreground/80">[goal/feeling]</span> +
            <span className="text-muted-foreground/40"> with [sound]</span> +
            <span className="text-muted-foreground/40"> [voice type]</span>
          </p>
        </div>
        <Textarea
          placeholder="describe how you want to feel... (e.g., 'I need deep focus for studying with calming rain')"
          value={vibeDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="min-h-[140px] resize-none text-base py-4 bg-card/70 border-border/90 hover:bg-card/75 focus:bg-card/80 focus:border-border transition-all"
          maxLength={300}
        />
        <div className="flex justify-between items-center px-1">
          <p className="text-xs text-muted-foreground/60">
            ✨ we'll interpret your vibe into the perfect audio
          </p>
          <p className="text-xs text-muted-foreground/60">
            {vibeDescription.length}/300
          </p>
        </div>
      </div>

      {/* Prompt Examples */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground/70 px-1">
          💡 try examples like:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PROMPT_EXAMPLES.map((example) => (
            <button
              key={example}
              onClick={() => onDescriptionChange(example)}
              className="px-2.5 py-1 rounded-md text-xs bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border/50"
            >
              {example}
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
              id="loop-creator"
            />
            <label htmlFor="loop-creator" className="text-sm lowercase tracking-wide cursor-pointer">
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
                id="save-session-creator"
              />
              <label htmlFor="save-session-creator" className="text-sm lowercase tracking-wide cursor-pointer">
                💾 save to library
              </label>
            </div>
            <span className="text-xs text-muted-foreground">
              {saveSession ? "will be saved" : "temporary only"}
            </span>
          </div>
        )}
      </div>

      {/* Generate Button - Prominent */}
      <Button
        onClick={onGenerate}
        disabled={isGenerating || !vibeDescription.trim() || vibeDescription.trim().length < 20}
        className="w-full py-6 text-lg lowercase tracking-wide bg-primary hover:bg-primary/90 transition-all"
        size="lg"
      >
        {isGenerating ? "creating your vibe..." : "✨ create my vibe"}
      </Button>
    </div>
  );
};
