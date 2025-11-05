import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ASMR prompts for each mood + ambient combination
const ASMR_PROMPTS: Record<string, string> = {
  relax_rain: `1 minute ASMR relaxation meditation with soft female whispered voiceover and gentle rain sounds. The voice speaks slowly and intimately: "breathe in deeply... hold... release all tension... feel the rain washing away your stress... you are safe... you are calm... notice your shoulders dropping... your jaw relaxing... let go of everything you're holding... the rain cleanses you... you are at peace...". Whispered ASMR style, intimate close-mic tone, rain ambience at 30% volume, voice clear and soothing.`,
  
  relax_ocean: `1 minute ASMR relaxation meditation with soft female whispered voiceover and distant ocean waves. The voice whispers gently: "breathe with the waves... in... out... feel the rhythm of the ocean... tension flows out with each exhale... your body softens... melts into relaxation... the ocean carries away your worries... peace washes over you...". ASMR whisper style, ocean waves subtle and rhythmic at 25% volume, voice warm and comforting.`,
  
  relax_forest: `1 minute ASMR relaxation meditation with calm female whispered voiceover and peaceful forest ambience. The voice speaks softly: "you are surrounded by nature... hear the gentle breeze... birds singing... feel grounded and safe... your breath flows naturally... stress dissolves into the earth... you are connected to peace... relaxed and whole...". Intimate ASMR whisper, forest birds and breeze at 30% volume, voice nurturing and slow.`,
  
  relax_fireplace: `1 minute ASMR relaxation meditation with warm female whispered voiceover and crackling fireplace. The voice whispers tenderly: "feel the warmth embracing you... safe and cozy... tension melts away like snow... your muscles release... jaw unclenches... shoulders drop... you are held by this moment... warm... peaceful... completely relaxed...". Close ASMR whisper, fireplace crackles soft and comforting at 25% volume, voice loving and slow.`,
  
  relax_whitenoise: `1 minute ASMR relaxation meditation with soft female whispered voiceover and gentle white noise. The voice speaks intimately: "all distractions fade away... there is only this moment... your breath... your peace... let everything else dissolve into the background... you are calm... centered... at ease...". Pure ASMR whisper style, white noise subtle at 20% volume, voice clear and close.`,

  sleep_rain: `1 minute ASMR sleep meditation with gentle female whispered voiceover and soft rain sounds. The voice whispers very slowly: "close your eyes... listen to the rain... each drop pulls you deeper into sleep... your body is heavy... sinking into the mattress... drifting... peaceful... let the rain carry you to dreams... you are safe... sleep comes easily...". Quiet whispered ASMR, rain gentle and steady at 30% volume, voice slow and dreamy.`,
  
  sleep_ocean: `1 minute ASMR sleep meditation with tender female whispered voiceover and distant ocean waves. The voice whispers softly: "the waves rock you to sleep... like a lullaby... each wave pulls you deeper... your eyelids are heavy... your breath slows... drifting... floating... safe in the rhythm of the sea... sleep finds you...". Intimate ASMR whisper, ocean distant and rhythmic at 25% volume, voice extremely slow and soothing.`,
  
  sleep_forest: `1 minute ASMR sleep meditation with calm female whispered voiceover and nighttime forest sounds. The voice speaks very gently: "the forest sleeps... and so do you... crickets sing you to rest... darkness wraps around you like a blanket... your body releases the day... you sink into peace... into sleep... the night holds you safe...". ASMR whisper, night forest ambience soft at 30% volume, voice nurturing and slow.`,
  
  sleep_fireplace: `1 minute ASMR sleep meditation with warm female whispered voiceover and soft crackling fireplace. The voice whispers lovingly: "the fire flickers... your eyelids grow heavy... warmth surrounds you... safe and cozy... your breath deepens... you drift... the flames dance you into dreams... peaceful... warm... asleep...". Close ASMR whisper, fireplace very quiet at 20% volume, voice tender and slow.`,
  
  sleep_whitenoise: `1 minute ASMR sleep meditation with gentle female whispered voiceover and soft white noise. The voice speaks barely above a whisper: "let the noise wash over you... all thoughts fade... there is only rest... your mind quiets... body heavy... drifting into deep sleep... nothing to do... nowhere to be... only sleep...". Pure ASMR whisper, white noise gentle at 25% volume, voice extremely soft and slow.`,

  focus_rain: `1 minute ASMR focus meditation with calm female whispered voiceover and gentle rain sounds. The voice speaks clearly and steadily: "bring your attention to this moment... your mind is sharp and clear... distractions fall away like rain... you are present... focused... capable... each breath centers you... your mind is a still pond... alert and ready...". ASMR style clear whisper, rain soft at 25% volume, voice encouraging and steady.`,
  
  focus_ocean: `1 minute ASMR focus meditation with confident female whispered voiceover and rhythmic ocean waves. The voice whispers firmly: "you are focused like the tide... powerful and consistent... your attention is strong... distractions drift away... you are capable... sharp... present... the rhythm of the waves guides your concentration...". ASMR whisper with clarity, ocean waves steady at 30% volume, voice motivating and clear.`,
  
  focus_forest: `1 minute ASMR focus meditation with calm female whispered voiceover and forest ambience. The voice speaks gently but clearly: "your mind is as clear as the forest air... fresh... alert... you notice everything... your attention is steady... distractions dissolve... you are present... focused... capable of anything...". ASMR whisper, forest birds and breeze at 25% volume, voice encouraging and grounded.`,
  
  focus_fireplace: `1 minute ASMR focus meditation with warm female whispered voiceover and crackling fireplace. The voice whispers confidently: "like a flame, your focus burns bright... steady... unwavering... distractions fade into the background... you are alert... present... your mind is sharp and ready... you can do this...". ASMR close whisper, fireplace quiet at 20% volume, voice warm and encouraging.`,
  
  focus_whitenoise: `1 minute ASMR focus meditation with clear female whispered voiceover and white noise. The voice speaks with clarity: "all noise fades away... there is only your task... your focus... your capability... distractions dissolve... you are sharp... present... completely focused...". ASMR whisper style, white noise at 20% volume, voice clear and motivating.`,

  gratitude_rain: `1 minute ASMR gratitude meditation with warm female whispered voiceover and gentle rain sounds. The voice whispers tenderly: "think of something you're grateful for... feel the warmth spreading through your chest... notice the small blessings... each raindrop a gift... this moment... this breath... you have enough... you are enough... gratitude fills you...". Intimate ASMR whisper, rain soft and nurturing at 30% volume, voice loving and warm.`,
  
  gratitude_ocean: `1 minute ASMR gratitude meditation with loving female whispered voiceover and peaceful ocean waves. The voice whispers softly: "the ocean gives endlessly... as does life to you... notice the abundance around you... the rhythm of the waves mirrors your grateful heart... you are blessed... held... loved... gratitude flows through you like water...". ASMR whisper, ocean gentle at 25% volume, voice tender and appreciative.`,
  
  gratitude_forest: `1 minute ASMR gratitude meditation with warm female whispered voiceover and forest ambience. The voice speaks lovingly: "you are surrounded by life... by beauty... by gifts uncounted... the forest reminds you of abundance... breathe in gratitude... notice what is good... what is here... this moment is a blessing... you are grateful...". ASMR intimate whisper, forest sounds soft at 30% volume, voice nurturing and warm.`,
  
  gratitude_fireplace: `1 minute ASMR gratitude meditation with tender female whispered voiceover and crackling fireplace. The voice whispers with love: "feel the warmth of appreciation... like this fire, gratitude warms you from within... notice the gifts in your life... the people... the moments... you are held by love... blessed beyond measure... grateful...". Close ASMR whisper, fireplace comforting at 25% volume, voice loving and tender.`,
  
  gratitude_whitenoise: `1 minute ASMR gratitude meditation with warm female whispered voiceover and gentle white noise. The voice whispers intimately: "in the quiet, you find gratitude... for this breath... this moment... this life... you are blessed... loved... enough... gratitude fills the space where noise once was... you are grateful...". Pure ASMR whisper, white noise subtle at 20% volume, voice tender and appreciative.`,

  boost_rain: `1 minute ASMR motivational boost with energetic female voiceover and rain sounds. The voice speaks with excitement and power: "you've got this! feel the energy rising in you like a storm... you are unstoppable... capable of anything... this is YOUR moment... the rain fuels your fire... you are READY... powerful... alive... go out there and SHINE!". Energetic ASMR style, rain dynamic at 30% volume, voice empowering and excited.`,

  boost_ocean: `1 minute ASMR motivational boost with powerful female voiceover and ocean waves. The voice speaks with confidence: "you have the power of the ocean within you... vast... unstoppable... ride this wave of energy... you are STRONG... capable... ready to take on anything... feel that surge... that momentum... you are INCREDIBLE... nothing can hold you back!". Empowering ASMR tone, ocean waves powerful at 35% volume, voice motivating and strong.`,

  boost_forest: `1 minute ASMR motivational boost with vibrant female voiceover and forest energy. The voice speaks with enthusiasm: "feel the life force of nature flowing through you... fresh... alive... ENERGIZED... you are growing... evolving... becoming more powerful... this is YOUR time to THRIVE... you are capable of amazing things... feel that ENERGY... you are UNSTOPPABLE!". Energetic ASMR style, forest sounds vibrant at 30% volume, voice exciting and empowering.`,

  boost_fireplace: `1 minute ASMR motivational boost with passionate female voiceover and crackling fire. The voice speaks with intensity: "your fire is BURNING bright... fierce... powerful... nothing can dim your light... you are on FIRE with purpose... with passion... with power... feel that heat... that drive... you are READY to conquer anything... you are BLAZING!". Intense ASMR tone, fireplace dynamic at 30% volume, voice passionate and empowering.`,

  boost_whitenoise: `1 minute ASMR motivational boost with clear powerful female voiceover and energizing white noise. The voice speaks with clarity and power: "cut through the noise... your purpose is CLEAR... your energy is HIGH... you are focused... powerful... UNSTOPPABLE... this is YOUR moment... feel that surge of pure energy... you are READY... you are CAPABLE... you've GOT THIS!". Clear powerful ASMR tone, white noise energizing at 25% volume, voice strong and motivating.`,
};

// Get current week key for cache versioning
function getWeekKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const weekNum = Math.floor((now.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `${year}-W${weekNum}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mood, ambient } = await req.json();
    
    if (!mood || !ambient) {
      throw new Error('Missing mood or ambient parameter');
    }

    const weekKey = getWeekKey();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`Checking cache for: ${mood}_${ambient}_${weekKey}`);

    // Check cache first
    const { data: cached, error: cacheError } = await supabase
      .from('asmr_sessions')
      .select('audio_url, id')
      .eq('mood', mood)
      .eq('ambient', ambient)
      .eq('week_key', weekKey)
      .maybeSingle();

    if (cached && cached.audio_url) {
      console.log('Cache hit! Returning cached audio');
      
      // Fetch audio from storage
      const { data: audioData } = await supabase.storage
        .from('asmr-cache')
        .download(cached.audio_url);

      if (audioData) {
        const arrayBuffer = await audioData.arrayBuffer();
        const base64Audio = base64Encode(arrayBuffer);
        return new Response(
          JSON.stringify({ audioContent: base64Audio, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Cache miss. Generating new ASMR session...');

    // Generate new ASMR
    const promptKey = `${mood}_${ambient}`;
    const prompt = ASMR_PROMPTS[promptKey];

    if (!prompt) {
      throw new Error(`Invalid mood/ambient combination: ${promptKey}`);
    }

    console.log('Calling ElevenLabs Music API...');

    const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/music/compose', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        prompt: prompt,
        duration: 60,
      }),
    });

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('ElevenLabs API error:', elevenLabsResponse.status, errorText);
      throw new Error(`ElevenLabs API error: ${elevenLabsResponse.status}`);
    }

    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    const base64Audio = base64Encode(audioBuffer);
    // Save to storage
    const fileName = `${mood}_${ambient}_${weekKey}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from('asmr-cache')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
    } else {
      // Save to database
      await supabase
        .from('asmr_sessions')
        .insert({
          mood,
          ambient,
          audio_url: fileName,
          week_key: weekKey,
          times_played: 1,
        });
      
      console.log('Successfully cached new ASMR session');
    }

    return new Response(
      JSON.stringify({ audioContent: base64Audio, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-asmr-session:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
