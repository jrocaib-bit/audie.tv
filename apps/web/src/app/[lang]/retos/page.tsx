import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAppCatalog } from "@audite/content/app-catalog";
import { etiquetaInicio, mesesAUnEpisodioAlDia } from "@/lib/publico";
import { episodioDeCita, inicioDeTemporada, retosDeTemporada } from "@/lib/retos-anio";
import { esIdiomaPublico } from "@/sitio/i18n";

export const metadata: Metadata = { title: "Retos", description: "Escucha la Biblia de principio a fin, y los retos del año." };

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!esIdiomaPublico(lang)) notFound();
  const ui = lang === "en" ? "en" : "es";
  const catalogo = loadAppCatalog();
  const episodios = catalogo.rangos.length;
  const libros = catalogo.books.length;
  const meses = mesesAUnEpisodioAlDia(episodios);
  const temporada = retosDeTemporada();
  const adviento = temporada[0];
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 text-[#F4ECE2] md:px-8">
      <h1 className="font-display text-5xl leading-none">{ui === "en" ? "Challenges" : "Retos"}</h1>
      <section className="mt-8 rounded-3xl bg-[#1B1815] px-6 py-8">
        <p className="text-sm text-[#C9A96E]">{ui === "en" ? "The main challenge" : "El reto principal"}</p>
        <h2 className="font-display mt-2 text-4xl leading-tight">{ui === "en" ? "Listen to the Bible from beginning to end" : "Escucha la Biblia de principio a fin"}</h2>
        <p className="mt-3 text-[#E7D7C3]">{ui === "en"
          ? `${episodios} episodes · about ${meses} months at one a day. You start at Genesis and the app keeps your place.`
          : `${episodios} episodios · unos ${meses} meses a uno al día. Empiezas en el Génesis y la app guarda el punto.`}</p>
        <svg className="camino mt-6" viewBox="0 0 600 72" role="img" aria-label={`${episodios} · ${libros}`}>
          <path className="camino-base" pathLength={1} d="M12 36 C 120 8, 200 64, 300 36 S 480 8, 588 36" />
          <path className="camino-trazo" pathLength={1} d="M12 36 C 120 8, 200 64, 300 36 S 480 8, 588 36" />
        </svg>
        <p className="mt-2 text-sm text-[#C9A96E]">{episodios} {ui === "en" ? "episodes" : "episodios"} · {libros} {ui === "en" ? "books" : "libros"}</p>
        <Link href={`/${lang}/app`} className="boton mt-6 inline-flex min-h-12 items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">{ui === "en" ? "Start in the app" : "Empezar en la app"}</Link>
      </section>
      {adviento ? (
        <section className="mt-10">
          <h2 className="font-display text-3xl">{adviento.titulo[ui]}</h2>
          <ol className="mt-4 grid grid-cols-7 gap-2">
            {adviento.dias.map((dia, indice) => {
              const episodio = episodioDeCita(dia.cita, catalogo.rangos);
              return (
                <li key={`${adviento.id}-${indice}`}>
                  <Link href={episodio ? `/${lang}/catalogo/${episodio}` : `/${lang}/retos/${adviento.id}`} className="calendario-dia" style={{ ["--i" as string]: indice }}>{indice + 1}</Link>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}
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
        {temporada.map((reto) => {
          const inicio = inicioDeTemporada(reto.id);
          return (
            <li key={reto.id}>
              <Link href={`/${lang}/retos/${reto.id}`} className="block py-4">
                <span className="font-display text-2xl">{reto.titulo[ui]}</span>
                <span className="mt-1 block text-[#B7AB9C]">{reto.explica[ui]}</span>
                <span className="mt-1 block text-sm text-[#C9A96E]">{reto.dias.length} {ui === "en" ? "days" : "días"}{inicio ? ` · ${etiquetaInicio(inicio, ui)}` : ""}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <section className="mt-12">
        <h2 className="font-display text-3xl">{ui === "en" ? "Feasts and the sanctoral" : "Fiestas y santoral"}</h2>
        <p className="mt-3 text-[#8A8175]">{ui === "en" ? "Coming soon" : "Próximamente"}</p>
      </section>
    </main>
  );
}
