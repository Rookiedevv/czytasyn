import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Text → speech with a one-time cost: each phrase is generated once with
// ElevenLabs and stored in the public "czytasyn-audio" bucket. Later requests
// are a redirect to the stored file. Signed-in parents only (the key is theirs).

const BUCKET = "czytasyn-audio";
const MODEL = "eleven_multilingual_v2";
// Default premade multilingual voice; override with ELEVENLABS_VOICE_ID.
const DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const text = (url.searchParams.get("text") ?? "").trim().slice(0, 300);
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const voice = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE;
  const key = createHash("sha1").update(`${MODEL}|${voice}|${text}`).digest("hex");
  const path = `tts/${key}.mp3`;
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // Cached already?
  const { data: existing } = await supabase.storage.from(BUCKET).list("tts", { search: `${key}.mp3`, limit: 1 });
  if (existing?.some((f) => f.name === `${key}.mp3`)) {
    return NextResponse.redirect(pub.publicUrl, { status: 307 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ELEVENLABS_API_KEY not set" }, { status: 503 });

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      language_code: "pl",
      voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.2, speed: 0.9 },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return NextResponse.json({ error: `elevenlabs ${res.status}`, detail: detail.slice(0, 300) }, { status: 502 });
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: "audio/mpeg", upsert: true });
  if (error) {
    // Storage failed: still serve the audio this once.
    return new NextResponse(bytes, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  }
  return NextResponse.redirect(pub.publicUrl, { status: 307 });
}
