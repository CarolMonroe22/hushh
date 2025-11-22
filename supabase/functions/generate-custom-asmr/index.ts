import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getUserIdFromAuth(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.substring(7);
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Allow service role for internal system calls
    if (payload.role === 'service_role') {
      return 'system';
    }
    
    return payload.sub || null;
  } catch (error) {
    console.error('Error parsing JWT:', error);
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

function sanitizePrompt(text: string): string {
  if (!text) return '';
  
  const dangerousTags = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
  ];
  
  let cleaned = text;
  dangerousTags.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  return cleaned.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication
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

  const rateLimit = await checkPersistentRateLimit(supabase, userId, 'generate-custom-asmr', 15);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again later.',
        remaining: rateLimit.remaining 
      }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`[generate-custom-asmr] User: ${userId}, Rate limit: ${rateLimit.remaining}/15`);

  try {
    const { prompt, title, saveSession, vibeDescription } = await req.json();
    
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required and must be a string');
    }

    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length < 50) {
      throw new Error('Prompt must be at least 50 characters');
    }
    if (trimmedPrompt.length > 1000) {
      throw new Error('Prompt must be less than 1000 characters');
    }

    const sanitizedPrompt = sanitizePrompt(trimmedPrompt);
    
    let sanitizedTitle = title || 'Custom Vibe';
    if (typeof sanitizedTitle === 'string' && sanitizedTitle.length > 100) {
      sanitizedTitle = sanitizedTitle.substring(0, 100);
    }

    console.log(`[generate-custom-asmr] Input validation passed`);

    const elevenLabsKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsKey) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    console.log(`[generate-custom-asmr] Generating: "${sanitizedTitle}"`);

    // Call ElevenLabs Music API
    const response = await fetch('https://api.elevenlabs.io/v1/music/compose', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': elevenLabsKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: sanitizedPrompt,
        duration: 60,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: 'Authentication error occurred. Please contact support.',
            code: 'AUTH_FAILED',
            type: 'auth'
          }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } else if (response.status === 429 || errorText.includes('quota_exceeded')) {
        return new Response(
          JSON.stringify({ 
            error: 'Free session tokens not available. Please try again later.',
            code: 'NO_TOKENS_AVAILABLE',
            type: 'quota'
          }),
          { 
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      throw new Error(`Audio generation failed: ${response.status}`);
    }

    const audioArrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(audioArrayBuffer);
    let binaryString = '';
    const chunkSize = 8192; // Process in 8KB chunks to avoid stack overflow

    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode(...chunk);
    }

    const audioBase64 = btoa(binaryString);

    console.log(`Custom ASMR generated: ${audioBase64.length} bytes`);

    // Save to user's personal library if requested
    let saved = false;
    let savedKey = '';
    
    if (saveSession && userId && userId !== 'system') {
      console.log('[generate-custom-asmr] Saving to library', { saveSession, hasUserId: !!userId });
      try {
        const userFileName = `${userId}/${Date.now()}_custom_${sanitizedTitle.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;
        savedKey = userFileName;

        console.log('[generate-custom-asmr] Uploading to user-sessions', { key: userFileName });

        // Upload to user-sessions bucket
        const { error: userUploadError } = await supabase.storage
          .from('user-sessions')
          .upload(userFileName, audioArrayBuffer, {
            contentType: 'audio/mpeg',
            upsert: false,
          });

        if (userUploadError) {
          console.error('[generate-custom-asmr] Upload error:', userUploadError);
        } else {
          console.log('[generate-custom-asmr] Insert user_sessions', { 
            user_id: userId, 
            audio_url: userFileName, 
            session_type: 'creator' 
          });

          // Insert into user_sessions table
          const { error: dbError } = await supabase
            .from('user_sessions')
            .insert({
              user_id: userId,
              session_type: 'creator',
              vibe_description: vibeDescription || sanitizedTitle,
              audio_url: userFileName,
              duration_seconds: 60,
            });

          if (dbError) {
            console.error('[generate-custom-asmr] DB insert error:', dbError);
          } else {
            console.log('[generate-custom-asmr] Saved OK');
            saved = true;
          }
        }
      } catch (saveError) {
        console.error('[generate-custom-asmr] Error saving user session:', saveError);
        // Don't fail the request if saving to library fails
      }
    }

    return new Response(
      JSON.stringify({
        audioContent: audioBase64,
        title: sanitizedTitle,
        saved,
        key: savedKey
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('ASMR generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
