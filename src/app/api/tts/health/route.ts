import { NextResponse } from "next/server";

// Reports whether the ElevenLabs key works and how much of the quota is left.
// Exposes no secrets. Used by the parent area and for deployment checks.
export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: false, reason: "ELEVENLABS_API_KEY not set" });
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
      headers: { "xi-api-key": apiKey },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ ok: false, reason: `elevenlabs ${res.status}` });
    const sub = (await res.json()) as { tier?: string; character_count?: number; character_limit?: number };
    return NextResponse.json({
      ok: true,
      tier: sub.tier,
      used: sub.character_count,
      limit: sub.character_limit,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, reason: String(e) });
  }
}
