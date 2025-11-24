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
    return payload.sub || null;
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
}

async function checkIfAdmin(userId: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  
  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
  
  return !!data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = getUserIdFromAuth(req);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isAdmin = await checkIfAdmin(userId);
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { example } = await req.json();
    
    if (!example) {
      return new Response(
        JSON.stringify({ error: 'Example data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[admin-generate-example] Generating audio for:', example.example_key);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let audioContent: string;
    let functionName: string;
    let requestBody: any;

    console.log(`[admin-generate-example] Type: ${example.session_type}`);

    // Determine which generation function to call based on session type
    if (example.session_type === 'preset') {
      // Generate preset ASMR (mood + ambient)
      functionName = 'generate-asmr-session';
      requestBody = {
        mood: example.mood,
        ambient: example.ambient,
        saveSession: false,
      };
      console.log(`[admin-generate-example] Preset: ${example.mood} + ${example.ambient}`);

    } else if (example.session_type === 'creator') {
      // Step 1: Reinterpret the vibe description with AI (same as user flow)
      console.log('[admin-generate-example] Step 1: Interpreting vibe with AI...');
      
      const { data: interpretData, error: interpretError } = await supabase.functions.invoke(
        'interpret-vibe-prompt',
        {
          body: {
            description: example.vibe_description,
          },
        }
      );

      if (interpretError) {
        console.error('[admin-generate-example] Interpretation failed:', interpretError);
        throw new Error(`AI interpretation failed: ${interpretError.message}`);
      }

      console.log('[admin-generate-example] Step 2: Generating with interpreted prompt...');
      console.log(`[admin-generate-example] Interpreted title: "${interpretData.title}"`);
      
      // Step 2: Use the interpreted prompt for generation
      functionName = 'generate-custom-asmr';
      requestBody = {
        prompt: interpretData.prompt,  // Use AI-interpreted prompt
        title: interpretData.title || example.title,
        saveSession: false,
      };

    } else if (example.session_type === 'binaural') {
      // Generate binaural experience
      functionName = 'generate-binaural-experience';
      requestBody = {
        experience: example.binaural_experience,
        saveSession: false,
      };
      console.log(`[admin-generate-example] Binaural: ${example.binaural_experience}`);

    } else if (example.session_type === 'voice') {
      // Generate voice journey
      functionName = 'generate-voice-journey';
      requestBody = {
        category: example.voice_journey,
        voiceGender: example.voice_gender || 'female',
        ambientType: example.ambient || null,
        saveSession: false,
      };
      console.log(`[admin-generate-example] Voice: ${example.voice_journey} (${example.voice_gender})`);

    } else {
      return new Response(
        JSON.stringify({ error: `Session type ${example.session_type} not supported for generation` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[admin-generate-example] Calling: ${functionName}`);

    // Call the generation function (service role auth is automatic via the supabase client)
    const { data: generationData, error: generationError } = await supabase.functions.invoke(
      functionName,
      {
        body: requestBody,
      }
    );

    if (generationError) {
      console.error('[admin-generate-example] Generation error:', generationError);
      throw generationError;
    }

    audioContent = generationData.audioContent;

    if (!audioContent) {
      throw new Error('No audio content returned from generation function');
    }

    // Upload to asmr-examples bucket
    const fileName = `${example.example_key}_${Date.now()}.mp3`;
    const audioBuffer = Uint8Array.from(atob(audioContent), c => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from('asmr-examples')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('[admin-generate-example] Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('asmr-examples')
      .getPublicUrl(fileName);

    // Update example_sessions with the new audio URL
    const { error: updateError } = await supabase
      .from('example_sessions')
      .update({ audio_url: publicUrl })
      .eq('id', example.id);

    if (updateError) {
      console.error('[admin-generate-example] Update error:', updateError);
      throw updateError;
    }

    console.log('[admin-generate-example] Successfully generated and uploaded audio');

    return new Response(
      JSON.stringify({ 
        success: true, 
        audioUrl: publicUrl,
        message: 'Audio generated and example updated successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[admin-generate-example] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
