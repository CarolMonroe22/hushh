import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Prompts optimizados para cada experiencia binaural (≤2000 chars)
const BINAURAL_PROMPTS: Record<string, string> = {
  barbershop: `1 minute 3D binaural barbershop ASMR. Barber whispers left ear: "relax, I'll take care of you..." Scissors snip precisely left to right *snip snip*, voice circles: "looking good..." Scissors move right ear to behind. Clippers buzz from neck base traveling up right side then left, vibrating spatially. Spray bottle mists left *psst psst*, right *psst*, above. Voice whispers right ear: "almost done..." All sounds in precise 3D space—scissors at varying distances, clippers moving dynamically, whispers circling—immersive barbershop binaural audio.`,

  spa: `1 minute 3D binaural spa & massage ASMR. Masseuse whispers left ear: "let tension go..." moves right: "breathe deeply..." Warm oil pours left *drip drip*, smooth strokes move across space left to right creating tingles. Fabric rustles behind, candles flicker, singing bowls ring distantly right then left. Voice circles: "you're safe..." Massage strokes spatial—near, far, left, right—3D cocoon of comfort. Oil sounds, rustles, whispers positioned in binaural space for deep relaxation.`,

  "ear-cleaning": `1 minute 3D binaural ear cleaning ASMR ultra-close proximity. Voice whispers left ear: "cleaning your ear now, gently..." Cotton swab approaches left, delicate circular motions inside *rustle rustle*—intense tingles. Voice moves right: "now this side..." swab travels across, approaches right ear. Delicate cleaning sounds each ear—close, intimate, careful. Blowing clears debris *whooosh* left then right. Voice behind: "all clean, you did well..." Ultra-close proximity, hyper-realistic 3D for maximum ASMR.`,

  bedtime: `1 minute 3D binaural bedtime ASMR nurturing whispers. Voice left ear: "rest now, you're safe..." Blankets rustle pulled up, sound moving feet upward. Voice right: "I'm here with you..." Hand strokes hair—brushing sounds travel head top downward, left to right. Voice circles behind: "close eyes, let go..." Music box tinkles distant left, fades. Gentle breathing nearby. Final whisper left: "goodnight, sweet dreams..." Nurturing 3D cocoon—blankets, whispers, touches spatially positioned for peaceful sleep.`,

  "art-studio": `1 minute 3D binaural art studio ASMR creative sounds. Artist whispers right: "watch as I create..." Pencil scratches paper left *scratch*, moving canvas left to right. Palette sounds nearby—brush dips water *swish*, taps edge *tap tap*. Voice behind: "art flows through stillness..." Charcoal drags rough paper right *drag scratch*. Pages flip *whoosh*, paint tubes squeeze *squirt*, brushes swirl water jars. Voice circles left: "you are creativity..." All sounds precise 3D—sketching, painting, mixing—immersive studio environment binaural audio.`,

  yoga: `1 minute 3D binaural yoga ASMR breathing and movement. Instructor whispers left: "breathe in through nose..." Deep inhale travels left to right around head. Voice behind: "breathe out, release tension..." Exhale whooshes right to left. Yoga mat unrolls left *unfurl*, bare feet pad softly across space. Voice circles right: "feel body in space, grounded and light..." Fabric rustles as instructor moves—behind, left—3D presence. Singing bowls ring distant *ding*, closer. Final whisper left: "you are centered, peace..." Immersive 3D yoga sanctuary spatially positioned for mindfulness.`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { experience } = await req.json();

    if (!experience || !BINAURAL_PROMPTS[experience]) {
      throw new Error('Invalid binaural experience selected');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }
    console.log(`ELEVENLABS key present, len=${ELEVENLABS_API_KEY.length}`);

    const prompt = BINAURAL_PROMPTS[experience];
    console.log(`Generating binaural experience: ${experience}, promptLen=${prompt.length}`);

    const response = await fetch('https://api.elevenlabs.io/v1/music/compose', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
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
    const chunkSize = 8192;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode(...chunk);
    }
    
    const audioBase64 = btoa(binaryString);

    console.log(`Binaural experience generated: ${audioBase64.length} bytes`);

    return new Response(
      JSON.stringify({ audioContent: audioBase64 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating binaural experience:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
