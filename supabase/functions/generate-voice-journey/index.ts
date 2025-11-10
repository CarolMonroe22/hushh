import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const JOURNEY_PROMPTS = {
  story: `Generate a contemplative short story in English (1-2 minutes when read aloud, approximately 200-300 words).

Structure:
- Opening: Set a peaceful, immersive scene with sensory details
- Body: Gentle narrative with vivid imagery and a flowing rhythm
- Closing: Soft conclusion with a subtle, meaningful takeaway

Tone: Calm, descriptive, flowing, poetic
Themes: nature, wonder, simple wisdom, tranquility
Style: Use short, breath-friendly sentences. Include pauses naturally. Write for spoken word.

Example themes: a walk through a moonlit forest, discovering a hidden garden, watching stars from a mountaintop, meeting a wise owl.

Return ONLY the story text, no titles or metadata.`,

  prayer: `Generate a non-denominational guided prayer in English (1 minute when spoken aloud, approximately 120-150 words).

Structure:
- Opening: Gentle invitation to stillness and presence
- Body: Expressions of gratitude, hope, and peaceful intention
- Closing: Affirmation of peace and calm

Tone: Reverent, gentle, inclusive, comforting
Style: Use "we" language to be inclusive. Include natural pauses. Avoid specific religious terminology.

Focus on: gratitude, presence, inner peace, connection, letting go

Return ONLY the prayer text, no titles or metadata.`,

  stoic: `Generate a stoic reflection in English inspired by Marcus Aurelius and Epictetus (1 minute when spoken aloud, approximately 150-180 words).

Structure:
- Opening: Acknowledge the present moment and current challenges
- Body: Present a core stoic principle (focus on what you can control, virtue over comfort, accepting nature's course)
- Closing: Practical wisdom for immediate application

Tone: Grounded, wise, empowering, firm but calm
Style: Direct, clear language. Use second person ("you"). Include contemplative pauses.

Core principles to draw from: control vs. no control, inner freedom, virtue, acceptance, rational mind, impermanence

Return ONLY the reflection text, no titles or metadata.`,

  manifestation: `Generate a powerful manifestation script in English (90 seconds when spoken aloud, approximately 180-220 words).

Structure:
- Opening: Acknowledge current state and readiness for change
- Body: Vivid affirmations of desired reality as if already true, sensory details
- Closing: Confident declaration of alignment and gratitude

Tone: Powerful, confident, present-tense, emotionally resonant
Style: Use "I am" statements. Make it vivid and sensory. Include emotional language.

Focus on: abundance, confidence, success, clarity, aligned action, worthiness

Return ONLY the manifestation script, no titles or metadata.`,

  motivational: `Generate a motivational coaching message in English (90 seconds when spoken aloud, approximately 180-220 words).

Structure:
- Opening: Direct acknowledgment of challenges and current struggle
- Body: Powerful mindset shifts with actionable wisdom
- Closing: Strong call to action and belief in the listener

Tone: Energizing, direct, confident, empowering, authentic
Style: Use "you" language. Be direct. Include powerful short sentences. Build momentum.

Focus on: taking action despite fear, owning your power, the next step, resilience, potential, proving doubt wrong

Return ONLY the motivational message, no titles or metadata.`,

  brainwash: `Generate a mind-cleansing meditation script in English (2-3 minutes when spoken aloud, approximately 300-400 words).

Structure:
- Opening: Invitation to let go and release mental clutter (30s)
- Body: Progressive mental cleansing with repetitive, calming phrases and visualizations (90s)
- Closing: Sense of mental clarity and freshness (30s)

Tone: Hypnotic, soothing, slow, meditative, almost trance-like
Style: Use simple, repetitive language. Include long pauses. Speak slowly. Use "you" language.
Techniques: Mental imagery (washing away thoughts, water flowing, clean slate), breath awareness, progressive relaxation

Focus on: letting go, releasing, emptying, cleansing, renewal, mental space, clarity

Example phrases: "Let it wash away...", "Release that thought...", "Your mind is becoming clear...", "Like water flowing..."

Return ONLY the meditation script, no titles or metadata.`,

  fullattention: `Generate a focus-inducing attention training script in English (90 seconds when spoken aloud, approximately 180-220 words).

Structure:
- Opening: Acknowledge distractions and intention to focus (20s)
- Body: Practical techniques to center attention and enter flow state (50s)
- Closing: Affirmation of clear, focused awareness ready for action (20s)

Tone: Clear, direct, calm but energized, purposeful
Style: Use concise sentences. Strategic pauses. Action-oriented language. Second person ("you").

Techniques: Anchor attention to breath, body scan for alertness, mental prioritization, distraction release

Focus on: presence, clarity, single-pointed focus, flow state, mental sharpness, readiness

Example phrases: "Notice where your attention is right now...", "Choose to focus...", "Let everything else fade...", "This moment, this task..."

Return ONLY the focus script, no titles or metadata.`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category } = await req.json();

    if (!category || !JOURNEY_PROMPTS[category as keyof typeof JOURNEY_PROMPTS]) {
      throw new Error('Invalid journey category');
    }

    const prompt = JOURNEY_PROMPTS[category as keyof typeof JOURNEY_PROMPTS];

    console.log(`Generating ${category} voice journey...`);

    // Call Lovable AI to generate the script
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a expert writer of contemplative, spoken-word content. Write natural, flowing text meant to be spoken aloud and listened to. Use conversational rhythm and include natural pauses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    console.log(`Generated ${category} journey successfully`);

    return new Response(
      JSON.stringify({ text: generatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-voice-journey:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
