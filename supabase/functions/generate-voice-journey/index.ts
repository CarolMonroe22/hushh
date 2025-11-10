import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const JOURNEY_PROMPTS = {
  story: `Create an intimate, whispered bedtime story in English (2-3 minutes spoken softly).

🎙️ ASMR Voice Direction:
- Speak as if whispering directly into someone's ear
- Use a slow, gentle pace with natural pauses
- Let your voice be soft, warm, and comforting
- Imagine tucking someone in and telling them a dreamy tale

Structure:
- Opening: Set a magical scene with sensory details (moonlight, soft sounds, gentle textures)
- Body: A simple journey with poetic imagery, flowing like a lullaby
- Closing: Drift into peaceful resolution, like falling asleep

Emotional Tone: Tender, nurturing, dreamlike, safe
Language: Simple, poetic, sensory (sight, sound, touch, smell)
Rhythm: Like waves - slow, repetitive, hypnotic

Example opening: "Close your eyes... and let me take you somewhere peaceful... Can you feel the soft grass beneath you?... The moonlight dancing on your skin?..."

Return ONLY the whispered story text.`,

  prayer: `Create an intimate, whispered prayer in English (90 seconds spoken softly).

🎙️ ASMR Voice Direction:
- Speak with reverence and tenderness
- Whisper as if in a sacred, quiet space
- Use long, calming pauses
- Let emotion flow through gentle tone

Structure:
- Opening: Gentle invitation to presence ("Let us breathe together...")
- Body: Soft expressions of gratitude, peace, and connection
- Closing: Whispered affirmation of love and calm

Emotional Tone: Sacred, tender, peaceful, intimate
Language: Inclusive "we/us", poetic, heartfelt
Rhythm: Like a gentle heartbeat - steady, comforting

Focus on: Gratitude for this moment, releasing worry, feeling held, inner peace

Example: "We breathe in... this gift of now... We release... what we cannot hold... We are grateful... for this quiet space..."

Return ONLY the whispered prayer text.`,

  stoic: `Create a gentle stoic reflection whispered in English (2 minutes spoken softly).

🎙️ ASMR Voice Direction:
- Speak like a wise friend whispering guidance
- Slow, thoughtful pace with contemplative pauses
- Balance strength with softness
- Imagine sitting beside someone under the stars

Structure:
- Opening: Acknowledge the present struggle with compassion
- Body: Ancient wisdom delivered gently (not forcefully)
- Closing: Quiet empowerment and acceptance

Emotional Tone: Wise, compassionate, grounding, peaceful strength
Language: Second person ("you"), poetic yet clear
Rhythm: Meditative, like walking slowly through a garden

Core wisdom: Control what you can... accept what you cannot... find peace in virtue... everything passes...

Example: "You've been carrying so much... and that's okay... What if... you only held... what you can truly control?... Your thoughts... your response... your next breath..."

Return ONLY the whispered reflection text.`,

  manifestation: `Create intimate manifestation whispers in English (2 minutes spoken softly).

🎙️ ASMR Voice Direction:
- Whisper affirmations like secrets of truth
- Speak with quiet confidence and warmth
- Use present tense "I am" statements
- Let conviction flow through gentleness

Structure:
- Opening: Acknowledge current transformation
- Body: Vivid "I am" affirmations with sensory details, repeated for hypnotic effect
- Closing: Whispered gratitude for what already is

Emotional Tone: Confident yet soft, powerful yet gentle, certain yet calm
Language: "I am", sensory, emotional, present tense
Rhythm: Repetitive, building, like gentle waves

Focus on: Abundance, worthiness, alignment, clarity, receiving

Example: "I am worthy... I am worthy of all that I desire... Can you feel it?... That truth settling into your bones?... I am aligned... with my highest path... I am receiving... all that is meant for me..."

Return ONLY the whispered manifestation text.`,

  motivational: `Create gentle motivational whispers in English (2 minutes spoken softly).

🎙️ ASMR Voice Direction:
- Motivate through soft encouragement, not loud energy
- Whisper like a supportive friend beside you
- Balance strength with tenderness
- Imagine encouraging someone who's tired but trying

Structure:
- Opening: Acknowledge the struggle with compassion
- Body: Gentle reminders of strength and capability
- Closing: Quiet belief in the listener

Emotional Tone: Encouraging but gentle, strong but soft, empowering but calm
Language: "You" language, supportive, compassionate
Rhythm: Steady, reassuring, like a hand on your shoulder

Focus on: You're capable... it's okay to rest... small steps matter... you're not alone...

Example: "I know you're tired... and that's completely okay... But listen... you've made it this far... Every single step... even when it felt impossible... That's your strength... that's your power..."

Return ONLY the whispered motivation text.`,

  brainwash: `Create a hypnotic mind-cleansing whisper meditation in English (3 minutes spoken very slowly).

🎙️ ASMR Voice Direction:
- Speak with trance-like slowness
- Use repetitive, soothing phrases
- Long pauses between phrases
- Almost hypnotic, like guided sleep

Structure:
- Opening: Invitation to release (30s)
- Body: Repetitive cleansing visualizations (2min)
- Closing: Fresh mental clarity (30s)

Emotional Tone: Hypnotic, calming, meditative, deeply relaxing
Language: Simple, repetitive, water/cleansing imagery
Rhythm: Extremely slow, like meditation

Techniques: "Let it go...", "Washing away...", "Release...", "Clear...", "Empty...", "Breathe..."

Example: "Let it wash away... [pause] ... all of it... [pause] ... washing away... [pause] ... like water... [pause] ... flowing... [pause] ... carrying it all... [pause] ... away..."

Return ONLY the whispered cleansing meditation.`,

  fullattention: `Create gentle focus whispers in English (90 seconds spoken softly).

🎙️ ASMR Voice Direction:
- Guide attention through soft clarity
- Calm but purposeful tone
- Use breath awareness and gentle cues
- Like a meditation guide preparing you

Structure:
- Opening: Notice where attention is now (20s)
- Body: Gentle techniques to center focus (50s)
- Closing: Affirmation of clear, calm focus (20s)

Emotional Tone: Calm, clear, purposeful yet gentle
Language: "Notice...", "Let...", "Choose...", "This moment..."
Rhythm: Steady, centering, grounding

Techniques: Anchor to breath, body awareness, gentle release of distractions

Example: "Notice... where your mind is right now... [pause] ... It's okay... [pause] ... Now... gently... bring it back... [pause] ... to this breath... [pause] ... this moment... [pause] ... only this..."

Return ONLY the whispered focus guide.`
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
