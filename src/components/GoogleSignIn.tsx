"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GoogleSignIn() {
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setBusy(false);
      alert(`Nie udało się zalogować: ${error.message}`);
    }
  }

  return (
    <button
      onClick={signIn}
      disabled={busy}
      className="rounded-full bg-white px-10 py-5 text-2xl font-bold text-slate-800 shadow-xl active:scale-95 disabled:opacity-60"
    >
      {busy ? "Łączenie…" : "Zaloguj się przez Google"}
    </button>
  );
}
