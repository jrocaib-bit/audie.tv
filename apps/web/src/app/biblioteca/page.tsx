import type { Metadata } from "next";
import { LibraryClient } from "@/components/library-client";

export const metadata: Metadata = { title: "Biblioteca" };

export default function Page() {
  return (
    <main id="contenido" className="mx-auto w-full max-w-3xl px-5 py-8 md:py-12">
      <p className="kicker">Biblioteca</p>
      <h1 className="mt-3 font-serif text-5xl">Lo que se puede oír, y lo que aún no.</h1>
      <LibraryClient />
    </main>
  );
}
