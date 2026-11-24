import type { MetadataRoute } from "next";
import { cargarCatalogo } from "@/lib/libros/carga";
import { entraEnSitemap } from "@/lib/libros/landing";
import { entradasSitemap, entradasSitemapLibros } from "@/lib/sitio-publico";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let libros: string[] = [];
  try {
    libros = entradasSitemapLibros((await cargarCatalogo()).filter((ficha) => entraEnSitemap(ficha.disponibilidad)).map((ficha) => ficha.id));
  } catch {
    // Sin catálogo de libros, el sitemap sigue con el resto de rutas.
  }
  return [...entradasSitemap(), ...libros].map((url) => ({ url }));
}
