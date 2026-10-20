// Both values come from Supabase → Connect → Framework (Next.js) tab.
// They are public by design (the publishable key only allows what RLS permits).
export const env = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  key:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "",
};

if (!env.url || !env.key) {
  console.warn(
    "[czytasyn] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set (Vercel → Settings → Environment Variables).",
  );
}
