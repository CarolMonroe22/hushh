import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getClientId(req: Request): string {
  // Use IP address as identifier for public endpoints
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `ip_${ip}`;
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

  const clientId = getClientId(req);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const rateLimit = await checkPersistentRateLimit(supabase, clientId, 'generate-custom-asmr', 5);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again later.',
        remaining: rateLimit.remaining 
      }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`[generate-custom-asmr] Client: ${clientId}, Rate limit: ${rateLimit.remaining}/5`);

  try {
    const { prompt, title } = await req.json();
    
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
        throw new Error('ElevenLabs authentication failed - check API key');
      } else if (response.status === 429 || errorText.includes('quota_exceeded')) {
        throw new Error('ElevenLabs quota exceeded - please add credits to your account');
      }
      throw new Error(`ElevenLabs error: ${response.status}`);
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

    return new Response(
      JSON.stringify({ 
        audioContent: audioBase64,
        title: sanitizedTitle
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
