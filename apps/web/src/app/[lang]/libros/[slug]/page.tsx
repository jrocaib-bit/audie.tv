import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MENSAJES_LIBROS, rotuloCapitulo } from "@audite/domain";
import { Cubierta } from "@/components/libros/cubierta";
import { cargarFicha, ID_LIBRO } from "@/lib/libros/carga";
import { esIdiomaPublico } from "@/sitio/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const ficha = ID_LIBRO.test(slug) ? cargarFicha(slug) : null;
  if (!ficha) return { title: "Libros" };
  return { title: ficha.titulo, description: ficha.subtitulo };
}

export default async function Page({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  if (!esIdiomaPublico(lang) || !ID_LIBRO.test(slug)) notFound();
  const ficha = cargarFicha(slug);
  if (!ficha || ficha.disponibilidad === "borrador") notFound();
  const lectura = ficha.disponibilidad === "lectura";
  const capitulos = ficha.indice.filter((entrada) => entrada.tipo === "capitulo").length;
  const episodios = ficha.episodios_del_libro_comentado;
  return (
    <main data-libro-ficha={ficha.id} className="mx-auto w-full max-w-5xl px-5 py-10 text-[#F4ECE2] md:px-8 md:py-16">
      <p className="text-sm"><Link href={`/${lang}/libros`} className="inline-flex min-h-11 items-center text-[#C9A96E]">Libros</Link></p>
      <div className="mt-4 grid gap-10 md:grid-cols-[minmax(0,260px)_1fr] md:gap-14">
        <div className="mx-auto w-full max-w-[220px] md:max-w-none"><Cubierta volumen={ficha.volumen} titulo={ficha.titulo} libroBiblico={ficha.libro_biblico} /></div>
        <div>
          <h1 className="font-display text-5xl leading-[0.98] md:text-6xl">{ficha.titulo}</h1>
          <p className="mt-3 text-xl text-[#E7D7C3]">{ficha.subtitulo}</p>
          <p className="mt-2 text-sm text-[#B7AB9C]">Volumen {ficha.volumen} · {capitulos} capítulos, prólogo y epílogo</p>
          {lectura ? (
            <div className="mt-8 grid max-w-md gap-3">
              <Link href={`/${lang}/libros/${ficha.slug}/leer`} data-accion="leer" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">Leer el adelanto</Link>
              <p className="text-sm text-[#B7AB9C]">El prólogo es gratis. El libro entero está incluido en la suscripción de Audite.</p>
            </div>
          ) : (
            <p data-aviso="preparandose" className="mt-8 max-w-md rounded-2xl border border-[#2E2924] bg-[#1B1815] px-5 py-4 text-[#E7D7C3]">{MENSAJES_LIBROS.preparandose}</p>
          )}
          <div className="mt-6 grid max-w-md gap-3">
            <button type="button" disabled aria-disabled="true" data-accion="audiolibro" className="inline-flex min-h-12 cursor-not-allowed items-center justify-between rounded-full border border-[#2E2924] px-6 text-[#8A8175]">
              <span>Audiolibro</span>
              <span className="text-sm">{MENSAJES_LIBROS.audiolibro}</span>
            </button>
            {ficha.amazon_paperback_url || ficha.amazon_kindle_url ? (
              <div className="flex flex-wrap gap-3" data-amazon="">
                {ficha.amazon_paperback_url ? <a href={ficha.amazon_paperback_url} rel="noopener noreferrer" target="_blank" className="inline-flex min-h-11 items-center rounded-full border border-[#C9A96E]/60 px-5 text-[#C9A96E]">Comprar en papel</a> : null}
                {/* Kindle solo en la web. En la app no hay botón ni enlace (Apple 3.1.3 y política de pagos de Play). */}
                {ficha.amazon_kindle_url ? <a href={ficha.amazon_kindle_url} rel="noopener noreferrer" target="_blank" className="inline-flex min-h-11 items-center rounded-full border border-[#C9A96E]/60 px-5 text-[#C9A96E]">Comprar en Kindle</a> : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <section className="mt-14" aria-labelledby="indice">
        <h2 id="indice" className="font-display text-3xl">Índice</h2>
        <ol className="mt-5 divide-y divide-[#2E2924] border-y border-[#2E2924]">
          {ficha.indice.map((entrada) => (
            <li key={entrada.id} className="flex items-baseline justify-between gap-4 py-3">
              {lectura ? (
                <Link href={`/${lang}/libros/${ficha.slug}/leer?c=${entrada.id}`} className="grid gap-0.5 py-1">
                  <span className="text-xs tracking-[0.14em] text-[#8A8175] uppercase">{rotuloCapitulo(entrada)}</span>
                  <span className="text-lg">{entrada.titulo}</span>
                </Link>
              ) : (
                <span className="grid gap-0.5 py-1">
                  <span className="text-xs tracking-[0.14em] text-[#8A8175] uppercase">{rotuloCapitulo(entrada)}</span>
                  <span className="text-lg">{entrada.titulo}</span>
                </span>
              )}
              {lectura && entrada.es_adelanto ? <span className="shrink-0 text-sm text-[#C9A96E]">Gratis</span> : null}
            </li>
          ))}
        </ol>
      </section>
      {episodios.length > 0 ? (
        <section className="mt-14" aria-labelledby="episodios">
          <h2 id="episodios" className="font-display text-3xl">Episodios de este libro</h2>
          <p className="mt-2 text-[#B7AB9C]">Cada episodio de Audite cubre un tramo del texto que este volumen comenta.</p>
          <ul className="mt-5 grid gap-x-8 sm:grid-cols-2">
            {episodios.map((episodio) => (
              <li key={episodio.episodio_id} className="list-none border-b border-[#2E2924]">
                <Link href={`/${lang}/episodio/${episodio.episodio_id}`} className="grid gap-0.5 py-3">
                  <span className="text-sm text-[#C9A96E]">{episodio.etiqueta}</span>
                  <span>{episodio.titulo}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
