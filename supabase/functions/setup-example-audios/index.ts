import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[setup-example-audios] Starting setup process...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create supabase client with service role (bypass JWT auth)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`
        }
      }
    });

    // Check if setup already completed
    console.log('[setup-example-audios] Checking if setup already completed...');
    const { data: flag, error: flagError } = await supabase
      .from('system_flags')
      .select('is_completed')
      .eq('flag_key', 'examples_audio_setup')
      .single();

    if (flagError) {
      console.error('[setup-example-audios] Error checking flag:', flagError);
      throw new Error(`Failed to check setup flag: ${flagError.message}`);
    }

    if (flag?.is_completed) {
      console.log('[setup-example-audios] Setup already completed, skipping...');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Example audios already set up',
          skipped: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 1. Generate spa audio (binaural experience)
    console.log('[setup-example-audios] Generating spa audio...');
    const spaResponse = await fetch(`${supabaseUrl}/functions/v1/generate-binaural-experience`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ experience: 'spa' })
    });

    if (!spaResponse.ok) {
      const errorText = await spaResponse.text();
      throw new Error(`Failed to generate spa audio (${spaResponse.status}): ${errorText}`);
    }

    const spaData = await spaResponse.json();
    if (!spaData?.audioContent) {
      throw new Error('No audio content received from spa generation');
    }

    // 2. Generate sleep audio (custom ASMR)
    console.log('[setup-example-audios] Generating sleep audio...');
    const sleepResponse = await fetch(`${supabaseUrl}/functions/v1/generate-custom-asmr`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt: 'Create a gentle and soothing sleep helper audio with calming whispers, soft rain sounds, and peaceful ocean waves to help me drift into a deep restful sleep',
        title: 'Sleep Helper'
      })
    });

    if (!sleepResponse.ok) {
      const errorText = await sleepResponse.text();
      throw new Error(`Failed to generate sleep audio (${sleepResponse.status}): ${errorText}`);
    }

    const sleepData = await sleepResponse.json();
    if (!sleepData?.audioContent) {
      throw new Error('No audio content received from sleep generation');
    }

    // 3. Convert base64 to binary and upload to storage
    console.log('[setup-example-audios] Uploading spa audio to storage...');
    
    // Decode spa audio
    const spaBinary = Uint8Array.from(atob(spaData.audioContent), c => c.charCodeAt(0));
    const spaBlob = new Blob([spaBinary], { type: 'audio/mpeg' });
    
    // Upload spa to new public bucket
    const { data: spaUpload, error: spaUploadError } = await supabase.storage
      .from('asmr-examples')
      .upload('spa.mp3', spaBlob, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (spaUploadError) {
      throw new Error(`Failed to upload spa audio: ${spaUploadError.message}`);
    }

    // Get public URL for spa
    const { data: spaUrlData } = supabase.storage
      .from('asmr-examples')
      .getPublicUrl('spa.mp3');
    const spaUrl = spaUrlData.publicUrl;

    console.log('[setup-example-audios] Uploading sleep audio to storage...');
    
    // Decode sleep audio
    const sleepBinary = Uint8Array.from(atob(sleepData.audioContent), c => c.charCodeAt(0));
    const sleepBlob = new Blob([sleepBinary], { type: 'audio/mpeg' });
    
    // Upload sleep to new public bucket
    const { data: sleepUpload, error: sleepUploadError } = await supabase.storage
      .from('asmr-examples')
      .upload('sleep.mp3', sleepBlob, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (sleepUploadError) {
      throw new Error(`Failed to upload sleep audio: ${sleepUploadError.message}`);
    }

    // Get public URL for sleep
    const { data: sleepUrlData } = supabase.storage
      .from('asmr-examples')
      .getPublicUrl('sleep.mp3');
    const sleepUrl = sleepUrlData.publicUrl;

    // 4. Update example_sessions table with URLs
    console.log('[setup-example-audios] Updating database with audio URLs...');
    
    const { error: spaUpdateError } = await supabase
      .from('example_sessions')
      .update({ audio_url: spaUrl })
      .eq('example_key', 'spa');

    if (spaUpdateError) {
      throw new Error(`Failed to update spa URL: ${spaUpdateError.message}`);
    }

    const { error: sleepUpdateError } = await supabase
      .from('example_sessions')
      .update({ audio_url: sleepUrl })
      .eq('example_key', 'sleep');

    if (sleepUpdateError) {
      throw new Error(`Failed to update sleep URL: ${sleepUpdateError.message}`);
    }

    // 5. Mark setup as completed
    console.log('[setup-example-audios] Marking setup as completed...');
    const { error: flagUpdateError } = await supabase
      .from('system_flags')
      .update({ 
        is_completed: true,
        completed_at: new Date().toISOString(),
        metadata: {
          description: 'Setup example audio files in storage',
          spa_url: spaUrl,
          sleep_url: sleepUrl,
          completed_by: 'setup-example-audios function',
          spa_size: spaBinary.length,
          sleep_size: sleepBinary.length
        }
      })
      .eq('flag_key', 'examples_audio_setup');

    if (flagUpdateError) {
      console.error('[setup-example-audios] Error updating flag:', flagUpdateError);
      // Don't throw here, setup was successful even if flag update fails
    }

    console.log('[setup-example-audios] Setup completed successfully!');

    // 6. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        spa: {
          url: spaUrl,
          size: spaBinary.length,
          path: spaUpload.path
        },
        sleep: {
          url: sleepUrl,
          size: sleepBinary.length,
          path: sleepUpload.path
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[setup-example-audios] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
