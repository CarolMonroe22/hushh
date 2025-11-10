import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AMBIENT_PROMPTS: Record<string, string> = {
  rain: "Gentle rain falling steadily on leaves, calming rainfall ambience, natural water sounds, peaceful rain meditation background, 60 seconds loop",
  ocean: "Soft ocean waves lapping on shore, peaceful beach ambience, gentle water movement, calming sea sounds, 60 seconds loop",
  forest: "Peaceful forest atmosphere, gentle rustling leaves, distant birds, natural woodland ambience, serene nature sounds, 60 seconds loop",
  fireplace: "Crackling fireplace, gentle fire sounds, warm cozy ambience, soft wood burning, peaceful hearth, 60 seconds loop",
  whitenoise: "Smooth white noise, consistent ambient sound, peaceful background noise for sleep and focus, 60 seconds loop",
  city: "Soft city ambience, distant gentle traffic, muted urban background, peaceful city night sounds, 60 seconds loop"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ambientType } = await req.json();
    console.log("Requested ambient type:", ambientType);

    if (!ambientType || !AMBIENT_PROMPTS[ambientType]) {
      return new Response(
        JSON.stringify({ error: "Invalid ambient type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const fileName = `${ambientType}.mp3`;

    // Check if ambient already exists in cache
    const { data: existingFile } = await supabase.storage
      .from("asmr-cache")
      .list("", { search: fileName });

    if (existingFile && existingFile.length > 0) {
      console.log("Ambient found in cache:", fileName);
      const { data: { publicUrl } } = supabase.storage
        .from("asmr-cache")
        .getPublicUrl(fileName);

      return new Response(
        JSON.stringify({ url: publicUrl, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate new ambient with Music API
    console.log("Generating new ambient with Music API...");
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    const musicResponse = await fetch("https://api.elevenlabs.io/v1/music/compose", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: AMBIENT_PROMPTS[ambientType],
        duration: 60,
      }),
    });

    if (!musicResponse.ok) {
      const errorText = await musicResponse.text();
      console.error("ElevenLabs Music API error:", errorText);
      throw new Error(`Music API error: ${musicResponse.status}`);
    }

    // Get audio data
    const audioBlob = await musicResponse.blob();
    const arrayBuffer = await audioBlob.arrayBuffer();

    // Upload to Supabase Storage
    console.log("Uploading to cache...");
    const { error: uploadError } = await supabase.storage
      .from("asmr-cache")
      .upload(fileName, arrayBuffer, {
        contentType: "audio/mpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("asmr-cache")
      .getPublicUrl(fileName);

    console.log("Ambient generated and cached:", fileName);

    return new Response(
      JSON.stringify({ url: publicUrl, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-ambient-sound:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
