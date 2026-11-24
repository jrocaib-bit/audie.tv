import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MENSAJES_LIBROS } from "@audite/domain";
import { TarjetaLibro } from "@/components/libros/cubierta";
import { Estanteria } from "@/components/libros/estanteria";
import { mockDeParametro } from "@/lib/libros/acceso";
import { ID_LIBRO, cargarCatalogo, fichaPublica } from "@/lib/libros/carga";
import { cargarEstanteria } from "@/lib/libros/estanteria";
import { esIdiomaPublico } from "@/sitio/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Libros",
  description: "Comentarios a los libros de la Escritura, leídos con los Padres de la Iglesia. Se leen dentro de Audite, con adelanto gratis.",
};

type Busqueda = Record<string, string | string[] | undefined>;

export default async function Page({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams?: Promise<Busqueda> }) {
  const { lang } = await params;
  if (!esIdiomaPublico(lang)) notFound();
  const busqueda = (await searchParams) ?? {};
  const pedido = Array.isArray(busqueda.libro) ? busqueda.libro[0] : busqueda.libro;
  const estanteria = await cargarEstanteria();
  const libros = (await cargarCatalogo()).map(fichaPublica);
  const listos = libros.filter((libro) => libro.disponibilidad !== "borrador");
  const enPreparacion = libros.filter((libro) => libro.disponibilidad === "borrador");
  return (
    <main data-libros-catalogo="" className="mx-auto w-full max-w-6xl px-5 py-5 text-[#F4ECE2] md:px-8 md:py-8">
      <p className="text-xs tracking-[0.16em] text-[#C9A96E] uppercase">Libros</p>
      <h1 className="font-display mt-1.5 text-3xl leading-[1.02] md:mt-2 md:max-w-none md:text-[48px]">La Escritura, leída con los Padres</h1>
      <p className="mt-2 max-w-xl text-[15px] leading-snug text-[#E7D7C3] md:mt-3 md:max-w-4xl md:text-lg md:leading-normal">Comentarios a los libros de la Escritura, un volumen por libro. Se leen aquí, en Audite, con el prólogo gratis y el resto incluido en la suscripción.</p>
      {estanteria ? (
        <Estanteria lang={lang} volumenes={estanteria} mock={mockDeParametro(busqueda.mock)} libroInicial={pedido && ID_LIBRO.test(pedido) ? pedido : null} />
      ) : null}
      {!estanteria && libros.length === 0 ? (
        <p className="mt-12 text-[#B7AB9C]">El catálogo de libros se está preparando.</p>
      ) : null}
      {!estanteria && listos.length > 0 ? (
        <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
          {listos.map((ficha) => <TarjetaLibro key={ficha.id} lang={lang} ficha={ficha} />)}
        </ul>
      ) : null}
      {!estanteria && enPreparacion.length > 0 ? (
        <section className="mt-16" aria-labelledby="en-preparacion">
          <h2 id="en-preparacion" className="font-display text-3xl">{MENSAJES_LIBROS.enPreparacion}</h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
            {enPreparacion.map((ficha) => <TarjetaLibro key={ficha.id} lang={lang} ficha={ficha} />)}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
