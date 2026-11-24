import { loadAppCatalog } from "@audite/content/app-catalog";
import { notFound, redirect } from "next/navigation";
import { rutaLibrosSegura } from "@audite/domain";
import { esIdiomaPublico } from "@/sitio/i18n";

/**
 * Los enlaces del JSON de los libros apuntan a /es/episodio/gn-10. La ficha pública real del
 * episodio es /[lang]/catalogo/[id]. El parámetro `desde` solo pasa si es una ruta segura de libros.
 */
export default async function Page({ params, searchParams }: { params: Promise<{ lang: string; id: string }>; searchParams: Promise<{ desde?: string | string[] }> }) {
  const { lang, id } = await params;
  const { desde } = await searchParams;
  if (!esIdiomaPublico(lang) || !loadAppCatalog().rangos.some((item) => item.id === id)) notFound();
  const vuelta = rutaLibrosSegura(Array.isArray(desde) ? desde[0] : desde);
  redirect(`/${lang}/catalogo/${id}${vuelta ? `?desde=${encodeURIComponent(vuelta)}` : ""}`);
}
