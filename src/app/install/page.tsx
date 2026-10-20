import Link from "next/link";

export default function InstallPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 p-8 text-lg text-slate-700">
      <h1 className="text-4xl font-extrabold">Czytasyn na ekranie iPada</h1>
      <ol className="list-decimal space-y-3 pl-6">
        <li>Otwórz tę stronę w <b>Safari</b> na iPadzie.</li>
        <li>
          Dotknij przycisku <b>Udostępnij</b> (kwadrat ze strzałką w górę).
        </li>
        <li>
          Wybierz <b>Do ekranu początkowego</b> i potwierdź <b>Dodaj</b>.
        </li>
        <li>Uruchom Czytasyn z ikony — otworzy się na pełnym ekranie, bez paska Safari.</li>
      </ol>
      <p className="text-slate-500">
        Wskazówka: w Ustawieniach iPada włącz <b>Dostęp nadzorowany</b> (Guided Access), żeby dziecko nie
        wychodziło z aplikacji.
      </p>
      <Link href="/" className="underline">
        Wróć
      </Link>
    </main>
  );
}
