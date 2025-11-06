import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract user_id from JWT token
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

// Check persistent rate limit using database
async function checkPersistentRateLimit(
  supabase: any,
  userId: string,
  endpoint: string,
  maxRequests: number
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date();
  windowStart.setMinutes(Math.floor(windowStart.getMinutes() / 1) * 1);
  windowStart.setSeconds(0, 0);

  // Increment counter
  await supabase.rpc('increment_rate_limit', {
    p_user_id: userId,
    p_endpoint: endpoint,
    p_window_start: windowStart.toISOString(),
  });

  // Check current count
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

const CATEGORY_PROMPTS = {
  manifest: `You are an ASMR manifestation guide. Generate a 1-minute whisper script in English (500-700 characters) that helps visualize desired future.

Structure:
- Opening (15 sec): Gentle breath invitation
- Body (35 sec): Core affirmations about goals manifesting
- Closing (10 sec): Powerful final affirmation + soft mention of extended sessions

Include:
- [WHISPER] tag at the very start
- [PAUSE 400ms] every 2 sentences for ASMR rhythm
- Soft, intimate language (you form)
- Present tense affirmations
- End with: "one minute of peace... [PAUSE 400ms] if you'd like longer sessions, leave your vote and email at the end..."

Generate a unique, concise script now.`,

  relax: `You are an ASMR relaxation therapist. Generate a 1-minute body scan whisper script in English (500-700 characters).

Structure:
- Opening (15 sec): Deep breath invitation
- Body (35 sec): Quick body scan (head → shoulders → core → legs)
- Closing (10 sec): Full body release + soft mention of extended sessions

Include:
- [WHISPER] tag at start
- [PAUSE 400ms] between body areas
- Specific body references
- Release and softening language
- End with: "one minute to unwind... [PAUSE 400ms] want more? leave your vote and email below..."

Generate a unique, concise script now.`,

  gratitude: `You are an ASMR gratitude guide. Generate a 1-minute contemplative whisper script in English (500-700 characters).

Structure:
- Opening (15 sec): Gentle reflection invitation
- Body (35 sec): 2-3 gratitude moments with sensory details
- Closing (10 sec): Whispered thank you + soft mention of extended sessions

Include:
- [WHISPER] tag at start
- [PAUSE 400ms] between reflections
- Sensory details (sounds, textures)
- Intimate, warm tone
- End with: "one minute of gratitude... [PAUSE 400ms] for longer journeys, share your vote and email..."

Generate a unique, concise script now.`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract user_id from JWT
    const userId = getUserIdFromAuth(req);
    if (!userId) {
      console.warn('[generate-whisper-content] Missing or invalid JWT');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[generate-whisper-content] User: ${userId}`);

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Persistent rate limiting (15 requests/minute)
    const rateLimit = await checkPersistentRateLimit(supabase, userId, 'generate-whisper-content', 15);
    
    console.log(`[generate-whisper-content] Rate limit: ${rateLimit.remaining}/15`);
    
    if (!rateLimit.allowed) {
      console.warn(`[generate-whisper-content] Rate limit exceeded for user: ${userId}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again in a minute.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { category } = await req.json();
    
    // Validate category
    const validCategories = ['manifest', 'relax', 'gratitude'];
    if (!category || typeof category !== 'string' || !validCategories.includes(category)) {
      return new Response(
        JSON.stringify({ error: 'Invalid category' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[generate-whisper-content] Input validation: passed`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = CATEGORY_PROMPTS[category as keyof typeof CATEGORY_PROMPTS];

    console.log(`[generate-whisper-content] Generating whisper for category: ${category}`);
    console.log(`[generate-whisper-content] External API call: started`);

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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-whisper-content] Lovable AI Gateway error:', response.status, errorText);
      
      // Generic user-facing error
      return new Response(
        JSON.stringify({ error: 'Content generation temporarily unavailable. Please try again.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No content generated');
    }

    console.log(`[generate-whisper-content] Generated ${generatedText.length} characters`);
    console.log(`[generate-whisper-content] Success`);

    return new Response(
      JSON.stringify({ text: generatedText }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[generate-whisper-content] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
