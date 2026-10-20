import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google sends the parent back here after signing in; we turn the code into a session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/app`);
  }
  return NextResponse.redirect(`${origin}/?error=auth`);
}
