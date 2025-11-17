// Session Types
export type Mood = "relax" | "sleep" | "focus" | "gratitude" | "boost" | "stoic";
export type Ambient = "rain" | "ocean" | "forest" | "fireplace" | "whitenoise" | "city";
export type BinauralExperience = "barbershop" | "spa" | "ear-cleaning" | "bedtime" | "art-studio" | "yoga";
export type VoiceJourney = "story" | "prayer" | "stoic" | "manifestation" | "motivational" | "brainwash" | "fullattention";

// Mood Options
export const MOODS: { value: Mood; label: string; emoji: string }[] = [
  { value: "relax", label: "relax", emoji: "🌙" },
  { value: "sleep", label: "sleep", emoji: "😴" },
  { value: "focus", label: "focus", emoji: "🎯" },
  { value: "gratitude", label: "gratitude", emoji: "🙏" },
  { value: "boost", label: "boost", emoji: "⚡" },
  { value: "stoic", label: "stoic", emoji: "🗿" },
];

// Ambient Options
export const AMBIENTS: { value: Ambient; label: string; emoji: string }[] = [
  { value: "rain", label: "rain", emoji: "🌧️" },
  { value: "ocean", label: "ocean", emoji: "🌊" },
  { value: "forest", label: "forest", emoji: "🌲" },
  { value: "fireplace", label: "fireplace", emoji: "🔥" },
  { value: "whitenoise", label: "white noise", emoji: "📻" },
  { value: "city", label: "city", emoji: "🏙️" },
];

// Binaural Experiences
export const BINAURAL_EXPERIENCES: {
  value: BinauralExperience;
  label: string;
  emoji: string;
  shortDesc: string;
}[] = [
  {
    value: "barbershop",
    label: "Barbershop Visit",
    emoji: "💈",
    shortDesc: "scissors, clippers, personal attention"
  },
  {
    value: "spa",
    label: "Spa & Massage",
    emoji: "🧖",
    shortDesc: "soft whispers, gentle touches, oils"
  },
  {
    value: "ear-cleaning",
    label: "Ear Cleaning",
    emoji: "👂",
    shortDesc: "close proximity, gentle sounds"
  },
  {
    value: "bedtime",
    label: "Bedtime Attention",
    emoji: "🌙",
    shortDesc: "tucking in, soft whispers, goodnight"
  },
  {
    value: "art-studio",
    label: "Art Studio",
    emoji: "🎨",
    shortDesc: "sketching, painting, creative energy"
  },
  {
    value: "yoga",
    label: "Yoga Session",
    emoji: "🧘",
    shortDesc: "guided breathing, gentle movement"
  },
];

// Voice Journeys
export const VOICE_JOURNEYS: {
  value: VoiceJourney;
  label: string;
  emoji: string;
  voices: {
    female: string;
    male: string;
  };
  shortDesc: string;
}[] = [
  {
    value: "story",
    label: "Story",
    emoji: "📖",
    voices: {
      female: "pjcYQlDFKMbcOUp6F5GD", // Brittney - Meditation
      male: "Mu5jxyqZOLIGltFpfalg"    // Jameson - Meditation
    },
    shortDesc: "immersive bedtime tale"
  },
  {
    value: "prayer",
    label: "Prayer",
    emoji: "🙏",
    voices: {
      female: "pjcYQlDFKMbcOUp6F5GD",
      male: "Mu5jxyqZOLIGltFpfalg"
    },
    shortDesc: "guided peaceful prayer"
  },
  {
    value: "stoic",
    label: "Stoic",
    emoji: "🏛️",
    voices: {
      female: "pjcYQlDFKMbcOUp6F5GD",
      male: "Mu5jxyqZOLIGltFpfalg"
    },
    shortDesc: "wisdom & inner strength"
  },
  {
    value: "manifestation",
    label: "Manifest",
    emoji: "✨",
    voices: {
      female: "pjcYQlDFKMbcOUp6F5GD",
      male: "Mu5jxyqZOLIGltFpfalg"
    },
    shortDesc: "abundance affirmations"
  },
  {
    value: "motivational",
    label: "Motivate",
    emoji: "🔥",
    voices: {
      female: "pjcYQlDFKMbcOUp6F5GD",
      male: "Mu5jxyqZOLIGltFpfalg"
    },
    shortDesc: "powerful encouragement"
  },
  {
    value: "brainwash",
    label: "Brain Wash",
    emoji: "🧠",
    voices: {
      female: "pjcYQlDFKMbcOUp6F5GD",
      male: "Mu5jxyqZOLIGltFpfalg"
    },
    shortDesc: "mental cleanse & reset"
  },
  {
    value: "fullattention",
    label: "Full Attention",
    emoji: "🎯",
    voices: {
      female: "pjcYQlDFKMbcOUp6F5GD",
      male: "Mu5jxyqZOLIGltFpfalg"
    },
    shortDesc: "deep focus activation"
  },
];

// Voice Journey Settings
export const JOURNEY_VOICE_SETTINGS: Record<VoiceJourney, {
  stability: number;
  similarity: number;
  style: number;
  use_speaker_boost: boolean;
}> = {
  story: {
    stability: 0.5,
    similarity: 0.85,
    style: 0.0,
    use_speaker_boost: true
  },
  prayer: {
    stability: 0.5,
    similarity: 0.85,
    style: 0.0,
    use_speaker_boost: true
  },
  stoic: {
    stability: 0.5,
    similarity: 0.85,
    style: 0.0,
    use_speaker_boost: true
  },
  manifestation: {
    stability: 0.5,
    similarity: 0.85,
    style: 0.0,
    use_speaker_boost: true
  },
  motivational: {
    stability: 0.5,
    similarity: 0.85,
    style: 0.0,
    use_speaker_boost: true
  },
  brainwash: {
    stability: 0.5,
    similarity: 0.85,
    style: 0.0,
    use_speaker_boost: true
  },
  fullattention: {
    stability: 0.5,
    similarity: 0.85,
    style: 0.0,
    use_speaker_boost: true
  }
};

// Vibe Starters
export const VIBE_STARTERS = [
  {
    title: "deep focus",
    description: "I need to concentrate deeply on complex work. Create a focused atmosphere with subtle background sounds that help me stay in the zone without any distractions.",
  },
  {
    title: "calm evening",
    description: "Help me wind down after a long day. I want gentle, soothing sounds that ease my mind and help me transition into a peaceful evening routine.",
  },
  {
    title: "creative flow",
    description: "I'm working on something creative and need sounds that inspire without overwhelming. Something that keeps my energy up while letting my imagination flow.",
  },
  {
    title: "peaceful sleep",
    description: "Guide me into deep, restful sleep with calming sounds that quiet my racing thoughts and create a cocoon of tranquility around me.",
  },
  {
    title: "manifestation",
    description: "Help me manifest my goals and dreams. I want powerful, affirming whispers that strengthen my belief in what I'm creating and fill me with confidence and clarity about my vision.",
  },
  {
    title: "prayer",
    description: "Create a sacred space for prayer and spiritual connection. I want gentle, reverent whispers that help me feel grounded, connected to something greater, and at peace in this moment of reflection.",
  },
  {
    title: "stoic",
    description: "I need strength and clarity rooted in ancient wisdom. Create a grounded atmosphere that reminds me to focus on what I can control, accept what I cannot change, and act with virtue and reason regardless of external circumstances.",
  },
];

// Title Rotations for Hero
export const TITLE_ROTATIONS = [
  "ASMR",
  "Meditation",
  "Focus",
  "Calm",
  "Flow",
  "Lullaby",
  "Reset",
  "Breathe",
  "Pray",
  "Pause",
  "Dream",
];
