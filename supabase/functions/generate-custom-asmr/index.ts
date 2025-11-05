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
    const { prompt, title } = await req.json();
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const elevenLabsKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsKey) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    console.log(`Generating custom ASMR: "${title}"`);

    // Call ElevenLabs Music API
    const response = await fetch('https://api.elevenlabs.io/v1/music/compose', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': elevenLabsKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
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
        title: title || 'Custom Vibe'
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
