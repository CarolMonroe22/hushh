import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const text = body.text;
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    if (!text) {
      throw new Error('Text is required');
    }

    console.log("Generating whisper for text:", text.substring(0, 50));

    // Get voice settings from request or use defaults
    const voiceId = body.voiceId || '9BWtsMINqrJLrRacOk9x';
    const stability = body.stability || 0.2;
    const similarityBoost = body.similarity || 0.85;

    // Convert custom pause tags to SSML
    const processedText = text
      .replace(/\[WHISPER\]/g, '')
      .replace(/\[PAUSE (\d+)ms\]/g, '<break time="$1ms"/>')
      .trim();

    // Call ElevenLabs TTS API with custom voice settings
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: processedText,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: stability,
          similarity_boost: similarityBoost,
          style: 0.15,
          use_speaker_boost: false,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", errorText);
      
      // Parse error details
      let errorMessage = `ElevenLabs API error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail?.status === 'quota_exceeded') {
          errorMessage = `ElevenLabs quota exceeded. ${errorData.detail.message}`;
        } else if (errorData.detail?.message) {
          errorMessage = errorData.detail.message;
        }
      } catch (e) {
        // Keep default error message if parsing fails
      }
      
      throw new Error(errorMessage);
    }

    // Get audio as array buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64 in chunks to avoid call stack issues
    const uint8Array = new Uint8Array(audioBuffer);
    const chunkSize = 8192;
    let binaryString = '';
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const base64Audio = btoa(binaryString);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error("Error in whisper-text function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
