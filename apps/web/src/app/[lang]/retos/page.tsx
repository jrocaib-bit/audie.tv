import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAppCatalog } from "@audite/content/app-catalog";
import { RETOS } from "@/lib/retos";
import { etiquetaInicio, inicioDeReto, mesesAUnEpisodioAlDia, ordenarRetosEstacionales } from "@/lib/publico";
import { esIdiomaPublico } from "@/sitio/i18n";

export const metadata: Metadata = { title: "Retos", description: "Escucha la Biblia de principio a fin, y los retos del año." };

const EXPLICA: Record<string, { es: string; en: string }> = {
  "adviento-isaias": { es: "Un pasaje de Isaías cada día, hasta Nochebuena.", en: "A passage from Isaiah each day, until Christmas Eve." },
  "navidad-infancia": { es: "Los relatos del nacimiento, día a día.", en: "The nativity accounts, day by day." },
  "cuaresma-40": { es: "Cuarenta días de escucha hacia la Pascua.", en: "Forty days of listening toward Easter." },
  "semana-santa-pasion": { es: "La Pasión, en los días de esa semana.", en: "The Passion, across that week." },
  "pascua-hechos": { es: "Cincuenta días con el libro de los Hechos.", en: "Fifty days with the book of Acts." },
};

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!esIdiomaPublico(lang)) notFound();
  const ui = lang === "en" ? "en" : "es";
  const hoy = new Date().toISOString().slice(0, 10);
  const estacionales = ordenarRetosEstacionales(RETOS, hoy);
  const episodios = loadAppCatalog().rangos.length;
  const meses = mesesAUnEpisodioAlDia(episodios);
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 text-[#F4ECE2] md:px-8">
      <h1 className="font-display text-5xl leading-none">{ui === "en" ? "Challenges" : "Retos"}</h1>
      <section className="mt-8 rounded-3xl bg-[#1B1815] px-6 py-8">
        <p className="text-sm text-[#C9A96E]">{ui === "en" ? "The main challenge" : "El reto principal"}</p>
        <h2 className="font-display mt-2 text-4xl leading-tight">{ui === "en" ? "Listen to the Bible from beginning to end" : "Escucha la Biblia de principio a fin"}</h2>
        <p className="mt-3 text-[#E7D7C3]">{ui === "en"
          ? `${episodios} episodes · about ${meses} months at one a day. You start at Genesis and the app keeps your place.`
          : `${episodios} episodios · unos ${meses} meses a uno al día. Empiezas en el Génesis y la app guarda el punto.`}</p>
        <Link href={`/${lang}/app`} className="mt-6 inline-flex min-h-12 items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">{ui === "en" ? "Start in the app" : "Empezar en la app"}</Link>
      </section>
      <ol className="mt-10 grid gap-3 sm:grid-cols-3">
        {(ui === "en"
          ? ["Choose a challenge", "Listen each day", "The app stays with you"]
          : ["Eliges un reto", "Escuchas cada día", "La app te acompaña"]
        ).map((paso, indice) => (
          <li key={paso} className="rounded-2xl border border-[#2E2924] px-4 py-4">
            <span className="text-sm text-[#C9A96E]">{indice + 1}</span>
            <p className="font-display mt-1 text-xl leading-tight">{paso}</p>
          </li>
        ))}
      </ol>
      <h2 className="font-display mt-12 text-3xl">{ui === "en" ? "Through the year" : "En el año"}</h2>
      <ul className="mt-4 divide-y divide-[#2E2924] border-y border-[#2E2924]">
        {estacionales.map((reto) => {
          const inicio = inicioDeReto(reto.id);
          const nota = EXPLICA[reto.id]?.[ui] ?? reto.titulo[ui];
          return (
            <li key={reto.id}>
              <Link href={`/${lang}/${reto.tiempo === "adviento" && lang === "en" ? "advent" : reto.tiempo === "navidad" && lang === "en" ? "christmas" : reto.tiempo === "cuaresma" && lang === "en" ? "lent" : reto.tiempo === "pascua" && lang === "en" ? "easter" : reto.tiempo === "semana-santa" && lang === "en" ? "holy-week" : reto.tiempo}`} className="block py-4">
                <span className="font-display text-2xl">{reto.titulo[ui]}</span>
                <span className="mt-1 block text-[#B7AB9C]">{nota}</span>
                <span className="mt-1 block text-sm text-[#C9A96E]">{reto.pasos.length} {ui === "en" ? "days" : "días"}{inicio ? ` · ${etiquetaInicio(inicio, ui)}` : ""}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
