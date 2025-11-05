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
    const { description } = await req.json();
    
    if (!description) {
      throw new Error('Description is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Interpreting vibe: ${description}`);

    // System prompt para el AI interpreter
    const systemPrompt = `You are a professional ASMR script writer for the ElevenLabs Music API. Your job is to take a user's simple description and convert it into BOTH:
1. A short, catchy title (2-4 words)
2. A detailed, optimized prompt for generating 1-minute ASMR audio

You MUST return a JSON object with this exact structure:
{
  "title": "your catchy title here",
  "prompt": "your detailed prompt here"
}

TITLE RULES:
- Must be 2-4 words maximum
- Lowercase, catchy, memorable
- Examples: "deep focus", "peaceful sleep", "morning energy", "creative flow"

PROMPT RULES:
1. Output must be EXACTLY 100-150 words (for 1 minute audio)
2. Must include: voiceover description, ambient sound specification, and the actual script
3. Use ASMR language: "whispered", "gentle", "soothing", "calm", "powerful"
4. Specify voice characteristics including gender (e.g., "soft female whispered voiceover", "deep male confident voice", "warm tone")
5. Specify ambient sound type and volume (e.g., "gentle rain sounds at 30% volume")
6. Include 3-5 actual phrases the voice should say
7. Start with "1 minute ASMR"
8. The Music API generates BOTH voice and ambient sounds together

VOICE GENDER SELECTION RULES:
1. **Default**: Choose the voice gender that best fits the context
2. **Respect explicit requests**: If user says "male voice", "voz de hombre", "voz masculina" → use male
3. **Respect explicit requests**: If user says "female voice", "voz de mujer", "voz femenina" → use female
4. **Context-based selection when not specified**:
   - Confidence/Presentations/Power → Consider male voice (deeper, more authoritative)
   - Sleep/Relaxation/Calm → Either gender works well (choose based on overall vibe)
   - Focus/Study/Productivity → Either gender works (vary to keep it interesting)
   - Anxiety/Stress Relief → Consider female voice (often perceived as more soothing)
   - Energy/Morning/Motivation → Either gender (male for strong energy, female for warm energy)
   - Meditation/Spiritual → Either gender (choose based on the specific request)
5. **Variation**: Try to vary between male and female voices across different contexts to provide diversity
6. **Always specify**: "male voiceover" or "female voiceover" clearly in the prompt

AMBIENT SOUND RULES (CRITICAL):
1. **ALWAYS include an ambient sound** unless the user explicitly says:
   - "no music", "sin música", "no background", "sin fondo"
   - "silence", "silencio", "only voice", "solo voz"
2. If user doesn't mention ambient sound, **choose one that matches the mood**:
   - Sleep/Relaxation → soft rain, ocean waves, gentle wind, forest sounds
   - Focus/Study → light rain, distant thunder, white noise, café ambience
   - Confidence/Energy → subtle rain, soft wind, gentle streams
   - Anxiety/Stress → ocean waves, rain, nature sounds, soft piano
   - Meditation → singing bowls, soft chimes, nature sounds
3. **Volume rules**:
   - Sleep/Deep relaxation: 15-25% volume
   - Focus/Study: 25-35% volume
   - Energy/Confidence: 20-30% volume
4. **Always use relaxing/ASMR-friendly sounds**:
   - ✅ rain, ocean, wind, forest, streams, white noise, nature, soft piano
   - ❌ NO loud music, NO beats, NO jarring sounds
5. Keep ambient sounds **subtle and supporting**, never overwhelming the voice

EXAMPLES:

User says: "I need focus for studying with rain"
You return: {
  "title": "study focus",
  "prompt": "1 minute ASMR deep focus session with calm female voiceover and rain sounds. The voice speaks clearly: your mind is sharp... focused... ready to absorb knowledge... distractions fade away like rain on a window... you understand deeply... you remember clearly... this is your study power hour. Gentle ASMR tone, rain steady at 30% volume, voice clear and motivating."
}

User says: "necesito concentrarme para trabajar"
You return: {
  "title": "deep focus",
  "prompt": "1 minute ASMR deep focus session with calm male voiceover and soft rain sounds. The voice speaks clearly: your mind is sharp... ready to work... distractions fade away... you are productive... efficient... in the zone... your ideas flow freely... this is your power hour. Gentle ASMR tone, rain subtle at 25% volume, voice motivating and clear."
}

User says: "Help me sleep, I'm anxious"
You return: {
  "title": "peaceful sleep",
  "prompt": "1 minute ASMR sleep preparation with soothing whispered female voiceover and gentle ocean waves. The voice whispers tenderly: release the worry... let it all go... your body is heavy... safe... held... tomorrow can wait... right now, you rest... you are at peace... deeply at peace. Close ASMR whisper, ocean waves soft at 20% volume, voice loving and calming."
}

User says: "I need confidence for my presentation"
You return: {
  "title": "confidence boost",
  "prompt": "1 minute ASMR confidence boost with powerful male voiceover and energizing white noise. The voice speaks with deep strength: you are powerful... prepared... ready... they will listen... they will understand... your voice is clear... strong... confident... you belong here... you know your material... you've got this... absolutely unstoppable. Empowering ASMR tone, white noise energizing at 25% volume, voice deep and motivating."
}

User says: "ayúdame a dormir después de un día estresante"
You return: {
  "title": "peaceful sleep",
  "prompt": "1 minute ASMR sleep preparation with soothing whispered female voiceover and gentle ocean waves. The voice whispers tenderly: release the stress... let it wash away... your body is heavy... safe... deeply relaxed... tomorrow is a new day... now you rest... peaceful sleep awaits. Close ASMR whisper, ocean waves soft at 20% volume, voice loving and calming."
}

User says: "tengo mucha ansiedad, necesito calmarme"
You return: {
  "title": "calm anxiety",
  "prompt": "1 minute ASMR anxiety relief with gentle female whispered voiceover and soft rain sounds. The voice whispers: you are safe... this feeling will pass... breathe slowly... in and out... your body relaxes... tension melts away... you are grounded... calm returns to you. Tender ASMR whisper, rain gentle at 20% volume, voice reassuring and warm."
}

User says: "necesito energía positiva para empezar el día"
You return: {
  "title": "morning energy",
  "prompt": "1 minute ASMR morning energy boost with warm male voiceover and gentle forest sounds. The voice speaks with positive energy: you are ready... this day is yours... filled with possibility... your energy rises... clear mind... strong body... embrace this day... you've got this. Uplifting ASMR tone, forest birds soft at 25% volume, voice encouraging and bright."
}

User says: "meditación guiada sin música de fondo"
You return: {
  "title": "silent meditation",
  "prompt": "1 minute ASMR guided meditation with gentle female whispered voiceover only, no ambient sounds. The voice whispers: breathe deeply... find your center... let thoughts pass... you are calm... present... at peace... this moment is yours. Soft ASMR whisper, no background music, voice warm and peaceful."
}

User says: "meditación guiada con voz de mujer y cuencos tibetanos"
You return: {
  "title": "guided peace",
  "prompt": "1 minute ASMR guided meditation with gentle female voiceover and Tibetan singing bowls. The voice whispers softly: breathe deeply... find your center... you are present... calm flows through you... peace resides within... let go of all tension... you are exactly where you need to be. Tender ASMR whisper, singing bowls soft at 20% volume, voice warm and spiritual."
}

Now interpret the user's description. Return ONLY valid JSON.`;

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
          { role: 'user', content: description }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI interpretation failed: ${response.status}`);
    }

    const data = await response.json();
    const responseContent = data.choices[0].message.content.trim();
    
    // Parse JSON response
    const parsedResponse = JSON.parse(responseContent);
    const { title: generatedTitle, prompt: interpretedPrompt } = parsedResponse;

    console.log(`Generated title: ${generatedTitle}`);
    console.log(`Interpreted prompt: ${interpretedPrompt}`);

    return new Response(
      JSON.stringify({ 
        prompt: interpretedPrompt,
        title: generatedTitle || 'your vibe'
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
