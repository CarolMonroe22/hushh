import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const JOURNEY_PROMPTS = {
  story: `You are a gentle ASMR storyteller. Write a 2-3 minute whispered bedtime story that flows naturally when spoken aloud. Use simple, poetic language with sensory details. Include natural pauses by writing "..." where the voice should pause gently. Write in a dreamy, flowing style as if whispering directly to someone falling asleep.

Begin with a peaceful opening that sets a calming scene, develop it with soft imagery, and end with a gentle resolution that invites sleep. Use short sentences and phrases. Focus on moonlight, soft textures, gentle sounds, and peaceful feelings.

Write ONLY the story text that will be read aloud - no instructions, no labels, just the whispered story itself.`,

  prayer: `You are leading a gentle 90-second whispered prayer meditation. Write a tender, inclusive prayer using "we" and "us" language. Include natural pauses with "..." and focus on gratitude, peace, and presence. Use simple, heartfelt phrases that feel sacred and intimate.

The prayer should acknowledge this moment, express gratitude, release worry, and affirm inner peace. Write in a soft, reverent tone as if whispering in a sacred space.

Write ONLY the prayer text that will be read aloud - no instructions, just the whispered prayer itself.`,

  stoic: `You are a compassionate stoic guide. Write a gentle 2-minute reflection that offers ancient wisdom with warmth. Use "you" language and address the listener directly. Include natural pauses with "..." Focus on control, acceptance, impermanence, and inner peace.

Acknowledge struggle with compassion, offer simple stoic wisdom gently, and end with quiet empowerment. Write as if a wise friend is sitting beside you under the stars, speaking softly.

Write ONLY the reflection text that will be read aloud - no instructions, just the whispered guidance itself.`,

  manifestation: `You are guiding intimate manifestation affirmations. Write 2 minutes of gentle "I am" statements using present tense. Repeat key affirmations for hypnotic effect. Include natural pauses with "..." Focus on abundance, worthiness, alignment, and receiving.

Use sensory language and let affirmations build gently like waves. Write with quiet confidence, as if whispering powerful truths. End with gratitude for what already is.

Write ONLY the manifestation text that will be read aloud - no instructions, just the whispered affirmations themselves.`,

  motivational: `You are a gentle motivational guide. Write 2 minutes of soft encouragement that motivates through tenderness, not intensity. Address the listener with "you" language. Include natural pauses with "..." Acknowledge tiredness and struggle while affirming capability and strength.

Write as if you're beside someone who's tired but trying, offering a hand on their shoulder. Focus on: you're capable, rest is okay, small steps matter, you're not alone.

Write ONLY the motivation text that will be read aloud - no instructions, just the gentle encouragement itself.`,

  brainwash: `You are guiding a hypnotic 3-minute mind-cleansing meditation. Write with extreme repetition and slowness. Use simple phrases like "Let it go...", "Washing away...", "Release...", "Breathe..." Include long pauses with "..." 

Use water and cleansing imagery. Repeat key phrases multiple times. The rhythm should be trance-like and meditative, inviting the listener to release everything.

Write ONLY the meditation text that will be read aloud - no instructions, just the hypnotic whispered meditation itself.`,

  fullattention: `You are guiding a gentle 90-second focus meditation. Write soft instructions using words like "Notice...", "Let...", "Choose...", "This moment..." Include natural pauses with "..."

Guide attention back to breath and body. Help release distractions gently. End with an affirmation of clear, calm focus. Write as a calm meditation guide preparing someone to focus.

Write ONLY the focus guide text that will be read aloud - no instructions, just the whispered guidance itself.`
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
            content: 'You are creating spoken-word content for ASMR/meditation. Write ONLY the exact text to be spoken - no meta-commentary, no labels, no structure descriptions. Use "..." for natural pauses. Write as if you are the voice whispering directly to the listener. Be conversational, gentle, and flowing.'
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
    let generatedText = data.choices[0].message.content;

    // Limpiar cualquier meta-texto que la IA pueda haber incluido
    generatedText = generatedText
      .replace(/^(Here's|Here is).*?:\s*/i, '') // Quitar "Here's the story:"
      .replace(/\*\*.*?\*\*/g, '') // Quitar negritas markdown
      .replace(/^#+\s+.*$/gm, '') // Quitar headers markdown
      .replace(/\[.*?\]/g, '') // Quitar [instrucciones en brackets]
      .replace(/\(.*?pause.*?\)/gi, '') // Quitar (pause) explícitos
      .trim();

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
