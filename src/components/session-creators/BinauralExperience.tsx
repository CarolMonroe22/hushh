import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BINAURAL_EXPERIENCES, type BinauralExperience as BinauralExperienceType } from "@/lib/constants/session-constants";
import { Headphones } from "lucide-react";

interface BinauralExperienceProps {
  selectedExperience: BinauralExperienceType | null;
  onExperienceChange: (experience: BinauralExperienceType) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const BinauralExperience = ({
  selectedExperience,
  onExperienceChange,
  onGenerate,
  isGenerating,
}: BinauralExperienceProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-white/80 text-sm font-light tracking-wide flex items-center gap-2">
          <Headphones className="w-4 h-4" />
          Choose your 3D experience
        </Label>
        <div className="text-xs text-white/50 mb-4">
          For the best experience, use headphones
        </div>
        <div className="grid grid-cols-2 gap-3">
          {BINAURAL_EXPERIENCES.map((experience) => (
            <Button
              key={experience.value}
              variant={selectedExperience === experience.value ? "default" : "outline"}
              className={`h-auto py-4 px-4 flex flex-col items-start gap-2 transition-all ${
                selectedExperience === experience.value
                  ? "bg-white/20 border-white/40"
                  : "bg-black/20 border-white/20 hover:bg-white/10"
              }`}
              onClick={() => onExperienceChange(experience.value)}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-2xl">{experience.emoji}</span>
                <span className="text-sm text-white/90 font-light">
                  {experience.label}
                </span>
              </div>
              <span className="text-xs text-white/60 font-light text-left">
                {experience.shortDesc}
              </span>
            </Button>
          ))}
        </div>
      </div>

      <Button
        className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-2"
        onClick={onGenerate}
        disabled={!selectedExperience || isGenerating}
      >
        {isGenerating ? (
          <>Generating 3D Experience...</>
        ) : (
          <>
            <Headphones className="w-4 h-4" />
            Generate 3D Experience
          </>
        )}
      </Button>
    </div>
  );
};
