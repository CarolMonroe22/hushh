import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getUserIdFromAuth(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  try {
    const token = authHeader.substring(7);
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

async function checkPersistentRateLimit(
  supabase: any,
  userId: string,
  endpoint: string,
  maxRequests: number
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date();
  windowStart.setMinutes(Math.floor(windowStart.getMinutes() / 1) * 1);
  windowStart.setSeconds(0, 0);

  await supabase.rpc('increment_rate_limit', {
    p_user_id: userId,
    p_endpoint: endpoint,
    p_window_start: windowStart.toISOString(),
  });

  const { data } = await supabase
    .from('rate_limits')
    .select('request_count')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .eq('window_start', windowStart.toISOString())
    .single();

  const count = data?.request_count || 0;
  const remaining = Math.max(0, maxRequests - count);

  return {
    allowed: count <= maxRequests,
    remaining,
  };
}

// Utility function to detect lullaby requests
function isLullaby(text: string): boolean {
  if (!text) return false;
  const patterns = [
    /\blullaby\b/i,
    /\bbaby\s*(?:sleep|bed|lull)\b/i,
    /\bcanci[oó]n\s+de\s+cuna\b/i,
    /\barrullo\b/i,
    /\bnana\b/i,
    /\bsleep\s+baby\b/i,
    /\bdormir\s+beb[eé]\b/i,
  ];
  return patterns.some((rx) => rx.test(text));
}

// Utility function to sanitize lullaby prompts - removes ASMR and normalizes start
function sanitizeLullabyPrompt(prompt: string): string {
  if (!prompt) return prompt;
  
  // Remove all instances of "ASMR"
  let out = prompt.replace(/\bASMR\b/gi, "").replace(/\s{2,}/g, " ").trim();

  const startPhrase = "1 minute gentle lullaby";

  // Remove problematic "1 minute ASMR ..." header
  out = out.replace(/^\s*1\s*(?:minute|min)\s*ASMR\s*/i, "");

  // If starts with "1 minute ..." but doesn't mention lullaby in the first part, normalize
  if (/^\s*1\s*(?:minute|min)\b/i.test(out) && !/\blullaby\b/i.test(out.slice(0, 80))) {
    out = out.replace(/^\s*1\s*(?:minute|min)\b.*?(?=\s+with|\s+and|\.)/i, startPhrase);
  }

  // Guarantee it starts with "1 minute gentle lullaby"
  if (!/^\s*1\s*(?:minute|min)\s+gentle\s+lullaby\b/i.test(out)) {
    out = `${startPhrase} ${out}`;
  }

  return out.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const userId = getUserIdFromAuth(req);
  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const rateLimit = await checkPersistentRateLimit(supabase, userId, 'interpret-vibe-prompt', 10);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again later.',
        remaining: rateLimit.remaining 
      }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`[interpret-vibe-prompt] User: ${userId}, Rate limit: ${rateLimit.remaining}/10`);

  try {
    const { description } = await req.json();
    
    if (!description || typeof description !== 'string') {
      throw new Error('Description is required and must be a string');
    }

    const trimmedDescription = description.trim();
    if (trimmedDescription.length < 10) {
      throw new Error('Description must be at least 10 characters');
    }
    if (trimmedDescription.length > 500) {
      throw new Error('Description must be less than 500 characters');
    }

    console.log(`[interpret-vibe-prompt] Input validation passed`);
    console.log(`[interpret-vibe-prompt] Interpreting vibe: ${trimmedDescription}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // System prompt para el AI interpreter
    const systemPrompt = `IMPORTANT: All output MUST be in ENGLISH ONLY. Title and prompt must always be in English, regardless of how the user phrases their request.

You are a professional ASMR script writer for the ElevenLabs Music API. Your job is to take a user's simple description and convert it into BOTH:
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
7. Start with "1 minute ASMR" EXCEPT for lullabies - lullabies should start naturally (e.g., "1 minute gentle lullaby")
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

LULLABY SPECIAL RULES (HIGHEST PRIORITY):
1. **Detection**: If user mentions "lullaby", "canción de cuna", "dormir bebé", "sleep baby", detect as LULLABY mode
2. **Tone**: MUST be extra gentle, cute, and loving - this is for a baby
3. **Voice**: 
   - ALWAYS use soft, warm, maternal/paternal whispered voice
   - Speak very slowly and soothingly
   - Use baby-appropriate language (simple, repetitive, loving)
4. **Names**: If user mentions a baby's name, incorporate it naturally and lovingly throughout
5. **Ambient sounds for lullabies**:
   - ✅ music box, soft chimes, gentle lullaby melody, soft bells
   - ✅ very gentle rain (10-15% volume max)
   - ❌ NO ocean waves, NO wind, NO nature sounds (too stimulating for babies)
6. **Script for lullabies**:
   - Use repetitive, simple phrases
   - Include the baby's name if provided
   - Use loving terms: "little one", "my sweet baby", "precious [name]"
   - Examples: "sleep now, sweet [name]... close your eyes, little one... you are loved... safe and warm..."
7. **Volume**: Ambient sounds at 10-15% maximum (babies need very subtle background)
8. **NEVER use "ASMR" terminology**: Lullabies should sound natural and sweet, not technical
   - ❌ "1 minute ASMR gentle lullaby"
   - ✅ "1 minute gentle lullaby" or "Gentle lullaby"

EXAMPLES:

User says: "I need focus for studying with rain"
You return: {
  "title": "study focus",
  "prompt": "1 minute ASMR deep focus session with calm female voiceover and rain sounds. The voice speaks clearly: your mind is sharp... focused... ready to absorb knowledge... distractions fade away like rain on a window... you understand deeply... you remember clearly... this is your study power hour. Gentle ASMR tone, rain steady at 30% volume, voice clear and motivating."
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

User says: "help me with anxiety"
You return: {
  "title": "calm anxiety",
  "prompt": "1 minute ASMR anxiety relief with gentle female whispered voiceover and soft rain sounds. The voice whispers: you are safe... this feeling will pass... breathe slowly... in and out... your body relaxes... tension melts away... you are grounded... calm returns to you. Tender ASMR whisper, rain gentle at 20% volume, voice reassuring and warm."
}

User says: "morning energy boost"
You return: {
  "title": "morning power",
  "prompt": "1 minute ASMR morning energy boost with warm male voiceover and gentle forest sounds. The voice speaks with positive energy: you are ready... this day is yours... filled with possibility... your energy rises... clear mind... strong body... embrace this day... you've got this. Uplifting ASMR tone, forest birds soft at 25% volume, voice encouraging and bright."
}

User says: "guided meditation no background music"
You return: {
  "title": "silent meditation",
  "prompt": "1 minute ASMR guided meditation with gentle female whispered voiceover only, no ambient sounds. The voice whispers: breathe deeply... find your center... let thoughts pass... you are calm... present... at peace... this moment is yours. Soft ASMR whisper, no background music, voice warm and peaceful."
}

User says: "meditation with singing bowls"
You return: {
  "title": "guided peace",
  "prompt": "1 minute ASMR guided meditation with gentle female voiceover and Tibetan singing bowls. The voice whispers softly: breathe deeply... find your center... you are present... calm flows through you... peace resides within... let go of all tension... you are exactly where you need to be. Tender ASMR whisper, singing bowls soft at 20% volume, voice warm and spiritual."
}

User says: "create a lullaby for baby Emma"
You return: {
  "title": "emma's lullaby",
  "prompt": "1 minute gentle lullaby with soft female whispered voice and delicate music box. The voice whispers lovingly: sleep now, sweet Emma... close your little eyes, my love... you are safe and cherished... rest peacefully, little Emma... mama is here... dream sweetly, precious one. Very tender whisper, music box gentle at 12% volume, voice warm and maternal."
}

User says: "lullaby for my baby without name"
You return: {
  "title": "sweet dreams",
  "prompt": "1 minute gentle lullaby with soft female whispered voice and soft chimes. The voice whispers: sleep, little one... close your eyes... you are safe and loved... rest peacefully... you are my treasure... dream sweetly, my love. Very tender whisper, soft chimes at 10% volume, voice warm and maternal."
}

User says: "deep peace with male voice"
You return: {
  "title": "deep peace",
  "prompt": "1 minute ASMR deep peace with soft male whispered voiceover and gentle rain sounds. The voice whispers: you are at peace... let it all go... breathe deeply... calm surrounds you... this moment is yours... simply being... you are well. Calm ASMR male whisper, gentle rain at 25% volume, voice comforting and serene."
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
          { role: 'user', content: trimmedDescription }
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

    // Post-process for lullabies to guarantee no ASMR and correct start
    const inputIsLullaby = isLullaby(description);
    const outputIsLullaby = isLullaby(generatedTitle) || isLullaby(interpretedPrompt);
    const shouldSanitize = inputIsLullaby || outputIsLullaby;

    let finalPrompt = interpretedPrompt;
    let finalTitle = generatedTitle || 'your vibe';

    if (shouldSanitize) {
      finalPrompt = sanitizeLullabyPrompt(finalPrompt);
      finalTitle = finalTitle.replace(/\bASMR\b/gi, "").trim();
      console.log("Lullaby sanitation applied", {
        inputIsLullaby,
        outputIsLullaby,
        titlePreview: finalTitle.slice(0, 50),
      });
    }

    console.log(`Generated title: ${finalTitle}`);
    console.log(`Interpreted prompt: ${finalPrompt}`);

    return new Response(
      JSON.stringify({ 
        prompt: finalPrompt,
        title: finalTitle
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
