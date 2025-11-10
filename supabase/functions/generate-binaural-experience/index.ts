import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Prompts optimizados para cada experiencia binaural
const BINAURAL_PROMPTS: Record<string, string> = {
  barbershop: `1 minute immersive 3D binaural barbershop ASMR experience with intimate spatial audio. A barber whispers close to your left ear: "just relax... I'll take care of you..." then moves smoothly behind your head with scissors snipping precisely left to right: *snip snip snip*. The voice circles around: "looking good... just a bit more here..." as scissors move from your right ear to behind. Clippers buzz starting at the back of your neck, traveling up and around your right side, then left—creating tingles as the vibration moves spatially. A spray bottle mists to your left *psst psst*, then right *psst*, then above. The barber's voice whispers intimately near your right ear: "almost done... you're doing great..." All sounds positioned precisely in 3D space—scissors at varying distances, clippers moving dynamically, whispers circling—fully immersive barbershop in binaural audio.`,

  spa: `1 minute 3D binaural spa & massage ASMR with female whispered voiceover and spatial massage sounds. The masseuse whispers softly near your left ear: "let all your tension go..." then moves to your right: "breathe deeply..." Gentle hands apply warm oil—you hear the liquid pouring to your left *drip drip*, then smoothing strokes moving across space left to right, creating tingles. Soft fabric rustles behind you, candles flicker nearby, and singing bowls ring distantly to the right then left. The voice circles: "you're safe here... completely relaxed..." Massage strokes move spatially—near, far, left, right—creating a 3D cocoon of comfort. Oil sounds, fabric rustles, whispers, and gentle touches all positioned in binaural space for deep relaxation.`,

  "ear-cleaning": `1 minute 3D binaural ear cleaning ASMR with ultra-close proximity and intimate spatial audio. A gentle voice whispers directly into your left ear: "I'm going to clean your ear now... very gently..." You hear a soft cotton swab approaching from the left, then delicate circular motions inside your left ear—*rustle rustle rustle*—creating intense tingles. The voice moves to your right ear: "now this side..." and the cotton swab travels across your head, approaching your right ear from the right side. Delicate cleaning sounds move precisely in each ear—close, intimate, careful. Occasional blowing sounds clear away debris *whooosh* from left then right. The voice whispers behind your head: "all clean... you did so well..." All sounds are ultra-close proximity, hyper-realistic 3D positioning for maximum ASMR effect.`,

  bedtime: `1 minute 3D binaural bedtime personal attention ASMR with nurturing female whispers. A caring voice whispers softly near your left ear: "time to rest now... you're safe..." Blankets rustle as they're pulled up around you, the sound moving from your feet upward in space. The voice moves to your right ear: "I'm right here with you..." A hand gently strokes your hair—soft brushing sounds traveling from the top of your head downward, left to right. The voice circles behind: "close your eyes... let everything go..." A music box tinkles softly in the distance to the left, then fades. Gentle breathing sounds nearby provide comfort. Final whisper near your left ear: "goodnight... sweet dreams..." All sounds create a nurturing 3D cocoon—blankets, whispers, gentle touches—spatially positioned for peaceful sleep.`,

  "art-studio": `1 minute 3D binaural art studio ASMR with creative ambient sounds and whispered guidance. An artist whispers near your right ear: "watch as I create..." Pencil scratches on paper to the left *scratch scratch*, moving across the canvas left to right. Paint palette sounds nearby—brush dipping into water *swish*, then tapping against the edge *tap tap tap*. The voice moves behind you: "art flows through stillness..." Charcoal drags across rough paper to the right *drag scratch*, creating tingles. Pages flip nearby *whoosh*, tubes of paint squeeze *squirt*, and brushes swirl in jars of water. The voice circles to your left: "you are creativity itself..." All sounds positioned precisely in 3D space—sketching, painting, mixing—an immersive creative studio environment in binaural audio.`,

  yoga: `1 minute 3D binaural yoga session ASMR with guided breathing and spatial movement sounds. A calm instructor whispers near your left ear: "breathe in... through your nose..." You hear a deep inhale traveling from left to right around your head. The voice moves behind: "and breathe out... releasing all tension..." An exhale whooshes from right to left. Gentle movement sounds—a yoga mat unrolling to your left *unfurl*, then bare feet padding softly across the space left to right. The voice circles to your right: "feel your body in space... grounded and light..." Soft fabric rustles as the instructor moves—now behind, now to the left, creating a 3D presence. Singing bowls ring gently in the distance *ding*, then closer. Final whisper near your left ear: "you are centered... you are peace..." All sounds create an immersive 3D yoga sanctuary—breathing, movement, voice—spatially positioned for deep mindfulness.`,
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

    const prompt = BINAURAL_PROMPTS[experience];
    console.log(`Generating binaural experience: ${experience}`);

    const response = await fetch('https://api.elevenlabs.io/v1/music/compose', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        music_length_ms: 60000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', error);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
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
