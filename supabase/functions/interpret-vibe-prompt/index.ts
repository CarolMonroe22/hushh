import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, title } = await req.json();
    
    if (!description) {
      throw new Error('Description is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Interpreting vibe: "${title}" - ${description}`);

    // System prompt para el AI interpreter
    const systemPrompt = `You are a professional ASMR script writer. Your job is to take a user's simple description of how they want to feel and convert it into a professional, optimized 1-minute ASMR prompt for ElevenLabs text-to-speech.

CRITICAL RULES:
1. Output must be EXACTLY 100-150 words (for 1 minute audio)
2. Must include: voiceover description, ambient sound, specific phrases to say
3. Use ASMR language: "whispered", "gentle", "soothing", "calm", "powerful"
4. Specify voice characteristics (e.g., "female voiceover", "warm tone", "confident voice")
5. Specify ambient sound volume (e.g., "rain at 30% volume")
6. Include 3-5 actual phrases the voice should say
7. Start with "1 minute ASMR"

EXAMPLES:

User says: "I need focus for studying with rain"
You generate: "1 minute ASMR deep focus session with calm female voiceover and rain sounds. The voice speaks clearly: your mind is sharp... focused... ready to absorb knowledge... distractions fade away like rain on a window... you understand deeply... you remember clearly... this is your study power hour. Gentle ASMR tone, rain steady at 30% volume, voice clear and motivating."

User says: "Help me sleep, I'm anxious"
You generate: "1 minute ASMR sleep preparation with soothing whispered female voiceover and gentle white noise. The voice whispers tenderly: release the worry... let it all go... your body is heavy... safe... held... tomorrow can wait... right now, you rest... you are at peace... deeply at peace. Close ASMR whisper, white noise soft at 20% volume, voice loving and calming."

Now interpret the user's description into a professional ASMR prompt.`;

    // Call Lovable AI
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
          { role: 'user', content: `Title: ${title}\nDescription: ${description}` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI interpretation failed: ${response.status}`);
    }

    const data = await response.json();
    const interpretedPrompt = data.choices[0].message.content.trim();

    console.log(`Interpreted prompt: ${interpretedPrompt}`);

    return new Response(
      JSON.stringify({ 
        prompt: interpretedPrompt,
        title: title || 'Custom Vibe'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Vibe interpretation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
