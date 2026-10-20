import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/app");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-gradient-to-b from-amber-200 to-orange-100 p-8 text-center">
      <p className="text-8xl">📖</p>
      <h1 className="text-6xl font-extrabold text-amber-900">Czytasyn</h1>
      <p className="max-w-md text-xl text-amber-900/70">
        Nauka czytania dla dzieci — po polsku i po angielsku. Rodzic loguje się raz, dziecko wybiera
        swoją postać i gra.
      </p>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/app" });
        }}
      >
        <button className="rounded-full bg-white px-10 py-5 text-2xl font-bold text-slate-800 shadow-xl active:scale-95">
          Zaloguj się przez Google
        </button>
      </form>
      <p className="text-sm text-amber-900/50">
        Konto rodzica. Dzieci nie mają własnych kont ani adresów e-mail.
      </p>
      <Link href="/install" className="text-amber-900/60 underline">
        Jak dodać do ekranu iPada?
      </Link>
    </main>
  );
}
