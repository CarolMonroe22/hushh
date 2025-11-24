import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getAuthContext(req: Request): { userId: string | null; isServiceRole: boolean } {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { userId: null, isServiceRole: false };
  }
  
  const token = authHeader.substring(7);
  
  // Check if it's the service role key
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (token === SUPABASE_SERVICE_ROLE_KEY) {
    return { userId: null, isServiceRole: true };
  }
  
  // Otherwise try to parse as user JWT
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { userId: null, isServiceRole: false };
    
    const payload = JSON.parse(atob(parts[1]));
    return { userId: payload.sub || null, isServiceRole: false };
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return { userId: null, isServiceRole: false };
  }
}

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const JOURNEY_PROMPTS = {
  story: `You are a gentle ASMR storyteller. Write a 2-3 minute whispered bedtime story using flowing, poetic sentences of 10-15 words each. Use rich sensory language and descriptive phrases that naturally take time to speak aloud.

Structure:
- Write in complete, flowing sentences (not tiny fragments)
- Use words like "slowly", "gently", "softly" to hint at pacing
- Add "..." only after complete thoughts (every 2-3 sentences), not after every phrase
- Focus on moonlight, soft textures, gentle sounds, peaceful feelings

Example of correct flow:
"The moon rises slowly over the quiet hills, casting silver light across the valley below... You can feel the soft breeze moving through the trees, whispering ancient lullabies to the earth... Everything is peaceful here, in this sacred space between waking and dreaming..."

NOT: "The moon rises... It's silver... You feel calm..."

Write ONLY the story text - no instructions, no labels. The text will be spoken with [slowly] [whispered] tags, so write naturally flowing sentences without trying to control pacing through punctuation. Focus on poetic, descriptive language that feels intimate and calming when whispered slowly.`,

  prayer: `You are leading a gentle 90-second whispered prayer meditation. Write a tender, inclusive prayer using flowing sentences of 10-15 words. Use "we" and "us" language with rich, heartfelt descriptions.

Structure:
- Write complete, flowing sentences (not tiny fragments)
- Use words like "gently", "deeply", "softly" to create natural pacing
- Add "..." only after complete thoughts (every 2-3 sentences)
- Focus on gratitude, peace, and presence with sensory language

Example of correct flow:
"We gather here in this sacred moment, feeling the gentle presence of peace all around us... Let us breathe deeply into gratitude for this breath, for this heartbeat, for this gift of being... May we release all worry softly into the night, trusting that we are held and supported..."

Write ONLY the prayer text - no instructions, no labels. The text will be spoken with [slowly] [whispered] tags, so write naturally flowing sentences without trying to control pacing through punctuation. Focus on poetic, descriptive language that feels intimate and calming when whispered slowly.`,

  stoic: `You are a compassionate stoic guide. Write a gentle 2-minute reflection using flowing sentences of 10-15 words. Use "you" language and address the listener directly with warmth and wisdom.

Structure:
- Write complete, flowing sentences with rich, contemplative language
- Use words like "gently", "deeply", "slowly" to hint at thoughtful pacing
- Add "..." only after complete thoughts (every 2-3 sentences)
- Focus on control, acceptance, impermanence, and inner peace

Example of correct flow:
"You have within you a quiet strength that cannot be shaken by external storms or passing troubles... The ancient teachers remind us gently that we control so little in this world, yet we hold complete sovereignty over our inner peace... Like water finding its way around stones, you can flow gracefully through whatever this moment brings..."

Write ONLY the reflection text - no instructions, no labels. The text will be spoken with [slowly] [whispered] tags, so write naturally flowing sentences without trying to control pacing through punctuation. Focus on poetic, descriptive language that feels intimate and calming when whispered slowly.`,

  manifestation: `You are guiding intimate manifestation affirmations. Write 2 minutes of flowing "I am" statements using complete sentences of 10-15 words. Repeat key themes with rich, sensory language.

Structure:
- Write complete, flowing affirmations (not tiny fragments)
- Use descriptive words like "deeply", "fully", "completely" that naturally extend pacing
- Add "..." only after complete thoughts (every 2-3 affirmations)
- Focus on abundance, worthiness, alignment with sensory details

Example of correct flow:
"I am deeply worthy of all the beautiful abundance that flows naturally into my life... I am completely aligned with my highest purpose, walking this path with confidence and grace... I receive all good things with an open heart, knowing that the universe supports me fully..."

Write ONLY the manifestation text - no instructions, no labels. The text will be spoken with [slowly] [whispered] tags, so write naturally flowing sentences without trying to control pacing through punctuation. Focus on poetic, descriptive language that feels intimate and calming when whispered slowly.`,

  motivational: `You are a gentle motivational guide. Write 2 minutes of soft encouragement using flowing sentences of 10-15 words. Motivate through tenderness with rich, compassionate language.

Structure:
- Write complete, flowing sentences (not tiny fragments)
- Use gentle words like "slowly", "softly", "deeply" to create natural pacing
- Add "..." only after complete thoughts (every 2-3 sentences)
- Acknowledge tiredness while affirming capability with descriptive language

Example of correct flow:
"You have been carrying so much weight on your shoulders, and it's okay to feel tired sometimes... The strength within you runs deeper than you know, like roots reaching down into the earth... Every small step you take matters more than you realize, and you are never walking this path alone..."

Write ONLY the motivation text - no instructions, no labels. The text will be spoken with [slowly] [whispered] tags, so write naturally flowing sentences without trying to control pacing through punctuation. Focus on poetic, descriptive language that feels intimate and calming when whispered slowly.`,

  brainwash: `You are guiding a hypnotic 3-minute mind-cleansing meditation. Write with flowing repetition using complete sentences of 8-12 words. Use water and cleansing imagery with descriptive, trance-inducing language.

Structure:
- Write flowing, repetitive sentences (not choppy fragments)
- Use hypnotic words like "slowly washing", "gently releasing", "deeply cleansing"
- Add "..." after every 2-3 sentences to create meditative rhythm
- Repeat key phrases in flowing variations

Example of correct flow:
"Feel the cleansing water slowly washing over every thought in your mind... Let it gently carry away everything that no longer serves your highest peace... Releasing... releasing... releasing all tension, all worry, all noise... The water flows through you continuously, leaving only clarity and calm in its wake..."

Write ONLY the meditation text - no instructions, no labels. The text will be spoken with [slowly] [whispered] tags, so write naturally flowing sentences without trying to control pacing through punctuation. Focus on poetic, descriptive language that feels intimate and calming when whispered slowly.`,

  fullattention: `You are guiding a gentle 90-second focus meditation. Write flowing sentences of 10-15 words using soft, directive language. Help anchor attention with rich sensory descriptions.

Structure:
- Write complete, flowing sentences (not tiny fragments)
- Use grounding words like "gently notice", "softly return", "deeply feel"
- Add "..." only after complete thoughts (every 2-3 sentences)
- Guide attention with descriptive, present-moment language

Example of correct flow:
"Gently notice the sensation of your breath moving in and out of your body right now... If your mind begins to wander, softly return your attention to this present moment without any judgment... Choose to anchor yourself here in the quiet stillness of your own awareness..."

Write ONLY the focus guide text - no instructions, no labels. The text will be spoken with [slowly] [whispered] tags, so write naturally flowing sentences without trying to control pacing through punctuation. Focus on poetic, descriptive language that feels intimate and calming when whispered slowly.`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication
  const { userId, isServiceRole } = getAuthContext(req);
  
  // Require either user auth OR service role
  if (!userId && !isServiceRole) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!isServiceRole && userId) {
    console.log(`[generate-voice-journey] User: ${userId}`);
  } else {
    console.log(`[generate-voice-journey] Service role call (admin)`);
  }

  try {
    const { category } = await req.json();

    if (!category || !JOURNEY_PROMPTS[category as keyof typeof JOURNEY_PROMPTS]) {
      throw new Error('Invalid journey category');
    }

    const prompt = JOURNEY_PROMPTS[category as keyof typeof JOURNEY_PROMPTS];

    console.log(`Generating ${category} voice journey for user ${userId}...`);

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

    // NUEVO: Envolver todo el texto en tags de control de ritmo y estilo
    generatedText = `[slowly] [whispered] ${generatedText}`;

    // Convertir "..." a pausas SSML naturales
    generatedText = generatedText
      .replace(/\.\.\.+/g, '<break time="800ms"/>') // Pausa pensativa entre pensamientos
      .replace(/\.\s+/g, '. <break time="500ms"/>') // Pausa suave entre oraciones
      .replace(/\,\s+/g, ', <break time="250ms"/>'); // Micro-pausa en comas

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
