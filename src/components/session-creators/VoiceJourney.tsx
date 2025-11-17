import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { VOICE_JOURNEYS, AMBIENTS, type VoiceJourney as VoiceJourneyType, type Ambient } from "@/lib/constants/session-constants";

interface VoiceJourneyProps {
  selectedJourney: VoiceJourneyType | null;
  voiceGender: "female" | "male";
  withAmbient: boolean;
  ambientForJourney: Ambient | null;
  onJourneyChange: (journey: VoiceJourneyType) => void;
  onVoiceGenderChange: (gender: "female" | "male") => void;
  onWithAmbientChange: (enabled: boolean) => void;
  onAmbientChange: (ambient: Ambient | null) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  loopEnabled: boolean;
  onLoopChange: (enabled: boolean) => void;
  saveSession: boolean;
  onSaveSessionChange: (save: boolean) => void;
  user: any | null;
}

export const VoiceJourney = ({
  selectedJourney,
  voiceGender,
  withAmbient,
  ambientForJourney,
  onJourneyChange,
  onVoiceGenderChange,
  onWithAmbientChange,
  onAmbientChange,
  onGenerate,
  isGenerating,
  loopEnabled,
  onLoopChange,
  saveSession,
  onSaveSessionChange,
  user,
}: VoiceJourneyProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-light lowercase tracking-wide flex items-center justify-center gap-2">
          <span>🎙️</span>
          <span>Voice Journeys</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          pure guided audio experiences focused on voice
        </p>
      </div>

      {/* Voice Preference Selection */}
      <div className="px-4 space-y-4">
        {/* Gender Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium lowercase tracking-wide">voice gender</label>
          <div className="flex gap-2">
            <Button
              variant={voiceGender === "female" ? "default" : "outline"}
              onClick={() => onVoiceGenderChange("female")}
              className="flex-1 lowercase tracking-wide"
              type="button"
            >
              👩 female
            </Button>
            <Button
              variant={voiceGender === "male" ? "default" : "outline"}
              onClick={() => onVoiceGenderChange("male")}
              className="flex-1 lowercase tracking-wide"
              type="button"
            >
              👨 male
            </Button>
          </div>
        </div>
      </div>

      {/* Journey Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-4">
        {VOICE_JOURNEYS.map((journey) => (
          <button
            key={journey.value}
            onClick={() => onJourneyChange(journey.value)}
            className={`p-5 rounded-xl border transition-all text-left space-y-2 ${
              selectedJourney === journey.value
                ? "border-primary bg-primary/10 shadow-lg scale-105"
                : "border-border bg-card hover:bg-accent hover:border-primary/50"
            }`}
          >
            <div className="text-3xl mb-2">{journey.emoji}</div>
            <div className="text-sm font-medium lowercase">{journey.label}</div>
            <div className="text-xs text-muted-foreground leading-tight">
              {journey.shortDesc}
            </div>
          </button>
        ))}
      </div>

      {/* Ambient Background Toggle */}
      <div className="px-4 space-y-3">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-card/50 border border-border/50">
          <input
            type="checkbox"
            id="ambient-toggle"
            checked={withAmbient}
            onChange={(e) => {
              onWithAmbientChange(e.target.checked);
              if (!e.target.checked) onAmbientChange(null);
            }}
            className="w-4 h-4 accent-primary"
          />
          <label htmlFor="ambient-toggle" className="text-sm lowercase tracking-wide cursor-pointer flex-1">
            add ambient background sound
          </label>
        </div>

        {/* Ambient Selection (only if toggled) */}
        {withAmbient && (
          <div className="grid grid-cols-3 gap-2">
            {AMBIENTS.map((ambient) => (
              <button
                key={ambient.value}
                onClick={() => onAmbientChange(ambient.value)}
                className={`p-3 rounded-lg border transition-all text-left ${
                  ambientForJourney === ambient.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-accent"
                }`}
              >
                <div className="text-xl mb-1">{ambient.emoji}</div>
                <div className="text-xs lowercase">{ambient.label}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loop Mode Toggle and Save Session */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50">
          <div className="flex items-center gap-2">
            <Switch
              checked={loopEnabled}
              onCheckedChange={onLoopChange}
              id="loop-voice"
            />
            <label htmlFor="loop-voice" className="text-sm lowercase tracking-wide cursor-pointer">
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
                id="save-session-voice"
              />
              <label htmlFor="save-session-voice" className="text-sm lowercase tracking-wide cursor-pointer">
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
          disabled={isGenerating || !selectedJourney || (withAmbient && !ambientForJourney)}
          className="w-full py-6 text-base lowercase tracking-wide bg-primary hover:bg-primary/90 transition-all"
          size="lg"
        >
          {isGenerating ? "creating voice journey..." : "🎙️ start journey"}
        </Button>
      </div>

      {/* Note */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground/70 italic">
          💡 voice journeys are 1-2 minutes of guided spoken content
        </p>
      </div>
    </div>
  );
};
