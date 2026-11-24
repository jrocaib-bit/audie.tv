import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Lector } from "@/components/libros/lector";
import { mockDeParametro } from "@/lib/libros/acceso";
import { ID_LIBRO, cargarFicha, cargarTexto } from "@/lib/libros/carga";
import { armarPropsLector } from "@/lib/libros/props-lector";
import { esIdiomaPublico } from "@/sitio/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Leer", robots: { index: false, follow: false } };

type Consulta = { c?: string | string[]; b?: string | string[]; mock?: string | string[] };
const uno = (valor: string | string[] | undefined) => (Array.isArray(valor) ? valor[0] : valor) ?? null;

export default async function Page({ params, searchParams }: { params: Promise<{ lang: string; slug: string }>; searchParams: Promise<Consulta> }) {
  const { lang, slug } = await params;
  if (!esIdiomaPublico(lang) || !ID_LIBRO.test(slug)) notFound();
  const consulta = await searchParams;
  const ficha = await cargarFicha(slug);
  if (!ficha) notFound();
  const texto = ficha.disponibilidad === "lectura" ? await cargarTexto(slug) : null;
  // Sin texto convertido no hay lector: se vuelve a la ficha, que explica el estado.
  if (!texto) redirect(ficha.disponibilidad === "borrador" ? `/${lang}/libros` : `/${lang}/libros/${slug}`);
  const props = armarPropsLector(texto, ficha, { lang, capitulo: uno(consulta.c), bloque: uno(consulta.b), mock: mockDeParametro(consulta.mock) });
  return <Lector {...props} />;
}
