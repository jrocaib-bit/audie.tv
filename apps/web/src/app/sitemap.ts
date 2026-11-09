import { loadAppCatalog } from "@audite/content/app-catalog";
import type { MetadataRoute } from "next";
import { idiomasPublicos } from "@/sitio/i18n";

function origen(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:43123").replace(/\/$/, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = origen();
  const catalogo = loadAppCatalog();
  const paginas = ["", "/catalogo", "/membresia"];
  const entradas: MetadataRoute.Sitemap = [];
  for (const lang of idiomasPublicos) {
    for (const pagina of paginas) {
      entradas.push({
        url: `${base}/${lang}${pagina}`,
        alternates: {
          languages: Object.fromEntries([
            ...idiomasPublicos.map((idioma) => [idioma, `${base}/${idioma}${pagina}`]),
            ["x-default", `${base}/es${pagina}`],
          ]),
        },
      });
    }
    for (const episodio of catalogo.rangos) {
      const ruta = `/catalogo/${episodio.id}`;
      entradas.push({
        url: `${base}/${lang}${ruta}`,
        alternates: {
          languages: Object.fromEntries([
            ...idiomasPublicos.map((idioma) => [idioma, `${base}/${idioma}${ruta}`]),
            ["x-default", `${base}/es${ruta}`],
          ]),
        },
      });
    }
  }
  return entradas;
}
