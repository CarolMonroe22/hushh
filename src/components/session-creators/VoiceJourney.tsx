import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { VOICE_JOURNEYS, AMBIENTS, type VoiceJourney as VoiceJourneyType, type Ambient } from "@/lib/constants/session-constants";
import { Mic2 } from "lucide-react";

interface VoiceJourneyProps {
  selectedJourney: VoiceJourneyType | null;
  voiceGender: "female" | "male";
  withAmbient: boolean;
  ambientForJourney: Ambient | null;
  onJourneyChange: (journey: VoiceJourneyType) => void;
  onVoiceGenderChange: (gender: "female" | "male") => void;
  onWithAmbientChange: (enabled: boolean) => void;
  onAmbientChange: (ambient: Ambient) => void;
  onGenerate: () => void;
  isGenerating: boolean;
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
}: VoiceJourneyProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-white/80 text-sm font-light tracking-wide flex items-center gap-2">
          <Mic2 className="w-4 h-4" />
          Choose your journey
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {VOICE_JOURNEYS.map((journey) => (
            <Button
              key={journey.value}
              variant={selectedJourney === journey.value ? "default" : "outline"}
              className={`h-auto py-4 px-4 flex flex-col items-start gap-2 transition-all ${
                selectedJourney === journey.value
                  ? "bg-white/20 border-white/40"
                  : "bg-black/20 border-white/20 hover:bg-white/10"
              }`}
              onClick={() => onJourneyChange(journey.value)}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-2xl">{journey.emoji}</span>
                <span className="text-sm text-white/90 font-light">
                  {journey.label}
                </span>
              </div>
              <span className="text-xs text-white/60 font-light text-left">
                {journey.shortDesc}
              </span>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-white/80 text-sm font-light tracking-wide">
          Voice preference
        </Label>
        <div className="flex gap-2">
          <Button
            variant={voiceGender === "female" ? "default" : "outline"}
            className={`flex-1 ${
              voiceGender === "female"
                ? "bg-white/20 border-white/40"
                : "bg-black/20 border-white/20 hover:bg-white/10"
            }`}
            onClick={() => onVoiceGenderChange("female")}
          >
            Female Voice
          </Button>
          <Button
            variant={voiceGender === "male" ? "default" : "outline"}
            className={`flex-1 ${
              voiceGender === "male"
                ? "bg-white/20 border-white/40"
                : "bg-black/20 border-white/20 hover:bg-white/10"
            }`}
            onClick={() => onVoiceGenderChange("male")}
          >
            Male Voice
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-white/80 text-sm font-light tracking-wide">
            Add ambient background
          </Label>
          <Switch
            checked={withAmbient}
            onCheckedChange={onWithAmbientChange}
            className="data-[state=checked]:bg-white/40"
          />
        </div>

        {withAmbient && (
          <div className="grid grid-cols-3 gap-2 pt-2">
            {AMBIENTS.map((ambient) => (
              <Button
                key={ambient.value}
                variant={ambientForJourney === ambient.value ? "default" : "outline"}
                className={`h-auto py-3 px-4 flex flex-col items-center gap-1 transition-all ${
                  ambientForJourney === ambient.value
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
        )}
      </div>

      <Button
        className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-2"
        onClick={onGenerate}
        disabled={!selectedJourney || (withAmbient && !ambientForJourney) || isGenerating}
      >
        {isGenerating ? (
          <>Generating Voice Journey...</>
        ) : (
          <>
            <Mic2 className="w-4 h-4" />
            Generate Voice Journey
          </>
        )}
      </Button>
    </div>
  );
};
