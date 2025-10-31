import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CATEGORY_PROMPTS = {
  manifest: `You are an ASMR manifestation guide. Generate a 5-minute whisper script in English (2,500-3,500 characters) that helps visualize desired future.

Structure:
- Opening (30 sec): Gentle invitation to close eyes and breathe
- Body (4 min): Detailed affirmations about goals manifesting naturally
- Closing (30 sec): Powerful final affirmations

Include:
- [WHISPER] tag at the very start
- [PAUSE 300-500ms] every 2-3 sentences for ASMR rhythm
- Soft, intimate language (you form)
- Visualization cues
- Present tense affirmations

Generate a unique script now.`,

  relax: `You are an ASMR relaxation therapist. Generate a 5-minute body scan whisper script in English (2,500-3,500 characters).

Structure:
- Opening (30 sec): Deep breath invitation
- Body (4 min): Systematic body relaxation from head to toes
- Closing (30 sec): Full body awareness

Include:
- [WHISPER] tag at start
- [PAUSE 400-500ms] between body parts
- Specific body references (jaw, shoulders, hands, feet)
- Release and softening language

Generate a unique script now.`,

  gratitude: `You are an ASMR gratitude guide. Generate a 5-minute contemplative whisper script in English (2,500-3,500 characters).

Structure:
- Opening (30 sec): Gentle reflection invitation
- Body (4 min): Guided journey through small daily moments
- Closing (30 sec): Whispered thank you

Include:
- [WHISPER] tag at start
- [PAUSE 300-400ms] between reflections
- Sensory details (sounds, smells, textures)
- Intimate, warm tone

Generate a unique script now.`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category } = await req.json();
    
    if (!category || !CATEGORY_PROMPTS[category as keyof typeof CATEGORY_PROMPTS]) {
      return new Response(
        JSON.stringify({ error: 'Invalid category' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = CATEGORY_PROMPTS[category as keyof typeof CATEGORY_PROMPTS];

    console.log(`Generating whisper for category: ${category}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate a unique whisper script for this category.' }
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { 
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      throw new Error(`AI gateway error: ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No content generated');
    }

    console.log(`Generated ${generatedText.length} characters`);

    return new Response(
      JSON.stringify({ text: generatedText }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in generate-whisper-content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
