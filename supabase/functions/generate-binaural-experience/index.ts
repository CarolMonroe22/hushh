import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getAuthContext(req: Request): { userId: string | null; isServiceRole: boolean } {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { userId: null, isServiceRole: false };
  }
  
  const token = authHeader.substring(7);
  
  // Check if it's the service role key
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (token === SUPABASE_SERVICE_ROLE_KEY) {
    return { userId: null, isServiceRole: true };
  }
  
  // Otherwise try to parse as user JWT
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { userId: null, isServiceRole: false };
    
    const payload = JSON.parse(atob(parts[1]));
    return { userId: payload.sub || null, isServiceRole: false };
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return { userId: null, isServiceRole: false };
  }
}

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

  // Verify authentication
  const { userId, isServiceRole } = getAuthContext(req);
  
  // Require either user auth OR service role
  if (!userId && !isServiceRole) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!isServiceRole && userId) {
    console.log(`[generate-binaural] User: ${userId}`);
  } else {
    console.log(`[generate-binaural] Service role call (admin)`);
  }

  try {
    const { experience, saveSession } = await req.json();

    if (!experience || !BINAURAL_PROMPTS[experience]) {
      throw new Error('Invalid binaural experience selected');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }
    console.log(`ELEVENLABS key present, len=${ELEVENLABS_API_KEY.length}`);

    const prompt = BINAURAL_PROMPTS[experience];
    console.log(`Generating binaural experience: ${experience} for user ${userId}, promptLen=${prompt.length}`);

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
    const chunkSize = 8192;

    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode(...chunk);
    }

    const audioBase64 = btoa(binaryString);

    console.log(`Binaural experience generated: ${audioBase64.length} bytes`);

    // Save to user's personal library if requested
    let saved = false;
    let savedKey = '';
    
    if (saveSession && userId && userId !== 'system') {
      console.log('[generate-binaural] Saving to library', { saveSession, hasUserId: !!userId });
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const userFileName = `${userId}/${Date.now()}_binaural_${experience}.mp3`;
        savedKey = userFileName;

        console.log('[generate-binaural] Uploading to user-sessions', { key: userFileName });

        // Upload to user-sessions bucket
        const { error: userUploadError } = await supabase.storage
          .from('user-sessions')
          .upload(userFileName, audioArrayBuffer, {
            contentType: 'audio/mpeg',
            upsert: false,
          });

        if (userUploadError) {
          console.error('[generate-binaural] Upload error:', userUploadError);
        } else {
          console.log('[generate-binaural] Insert user_sessions', { 
            user_id: userId, 
            audio_url: userFileName, 
            session_type: 'binaural' 
          });

          // Insert into user_sessions table
          const { error: dbError } = await supabase
            .from('user_sessions')
            .insert({
              user_id: userId,
              session_type: 'binaural',
              binaural_experience: experience,
              audio_url: userFileName,
              duration_seconds: 60,
            });

          if (dbError) {
            console.error('[generate-binaural] DB insert error:', dbError);
          } else {
            console.log('[generate-binaural] Saved OK');
            saved = true;
          }
        }
      } catch (saveError) {
        console.error('[generate-binaural] Error saving user session:', saveError);
        // Don't fail the request if saving to library fails
      }
    }

    return new Response(
      JSON.stringify({ 
        audioContent: audioBase64,
        saved,
        key: savedKey
      }),
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
