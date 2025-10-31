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
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    console.log("Testing ElevenLabs Music API access...");

    // Test the Music API endpoint with minimal parameters
    const response = await fetch('https://api.elevenlabs.io/v1/music/compose', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        prompt: "calm ambient meditation music",
        duration: 10
      }),
    });

    const responseData = await response.text();
    console.log("ElevenLabs Music API response status:", response.status);
    console.log("ElevenLabs Music API response:", responseData);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          success: false,
          status: response.status,
          error: responseData,
          message: response.status === 403 ? 
            "Access denied. Your API key doesn't have Music API access." :
            response.status === 401 ?
            "Invalid API key." :
            "API request failed."
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        status: response.status,
        message: "Music API access verified successfully!",
        data: JSON.parse(responseData)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error("Error in test-music-api function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
