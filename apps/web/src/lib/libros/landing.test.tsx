import { mkdirSync, mkdtempSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ETIQUETAS_FICHA, PRECIO } from "@audite/domain";
import Pagina, { generateMetadata } from "@/app/[lang]/libros/[slug]/page";
import { generateMetadata as metadatosPaginaCatalogo } from "@/app/[lang]/libros/page";
import sitemap from "@/app/sitemap";
import {
  MAX_REFERENCIAS_VISIBLES,
  TEXTOS_LANDING,
  descripcionSeo,
  etiquetaBoton,
  etiquetaReferencia,
  metadatosCatalogo,
  repartirReferencias,
  titularSeo,
} from "./landing";

const FIXTURES = path.resolve(import.meta.dirname, "fixtures");
const CON_ESTANTERIA = path.join(FIXTURES, "con-estanteria");
const SECRETOS = ["TEXTO_PREMIUM_CAPITULO_PRUEBA_XYZ", "TEXTO_PREMIUM_EPILOGO_PRUEBA_XYZ", "TEXTO_ADELANTO_PRUEBA"];

beforeEach(() => {
  vi.stubEnv("AUDITE_LIBROS_RUTA", CON_ESTANTERIA);
  vi.stubEnv("AUDITE_MOSTRAR_AMAZON", "");
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://sitio.example");
});
afterEach(() => vi.unstubAllEnvs());

const params = (lang: string, slug: string) => Promise.resolve({ lang, slug });
async function html(lang: string, slug: string, searchParams: Record<string, string> = {}): Promise<string> {
  return renderToStaticMarkup(await Pagina({ params: params(lang, slug), searchParams: Promise.resolve(searchParams) }));
}
const meta = (lang: string, slug: string) => generateMetadata({ params: params(lang, slug) });
const og = (m: Awaited<ReturnType<typeof meta>>) => m.openGraph as unknown as Record<string, unknown> & { images: { url: string; width: number; height: number; alt: string }[] };

describe("metadatos de la landing", () => {
  it("título, descripción, canonical, idiomas, Open Graph y Twitter con la cubierta absoluta", async () => {
    const m = await meta("es", "libro-prueba");
    const titulo = (m.title as { absolute: string }).absolute;
    expect(titulo).toBe("Libro de prueba · Génesis con los Padres | Audite");
    expect(titulo.length).toBeLessThanOrEqual(60);
    expect(m.description).toContain(`Prueba ${PRECIO.pruebaDias} días gratis`);
    expect(m.description!.length).toBeLessThanOrEqual(160);
    expect(m.alternates?.canonical).toBe("https://sitio.example/es/libros/libro-prueba");
    expect(m.alternates?.languages).toMatchObject({ es: "https://sitio.example/es/libros/libro-prueba", en: "https://sitio.example/en/libros/libro-prueba" });
    const o = og(m);
    expect(o.type).toBe("book");
    expect(o.url).toBe("https://sitio.example/es/libros/libro-prueba");
    expect(o.locale).toBe("es_ES");
    expect(o.siteName).toBe("Audite");
    expect(o.images[0]).toMatchObject({ url: "https://sitio.example/api/libros/portada/cubierta-01-960.webp", width: 960, height: 1440 });
    expect(o.images[0]!.alt).toContain("Libro de prueba");
    expect(m.twitter).toMatchObject({ card: "summary_large_image", images: [{ url: "https://sitio.example/api/libros/portada/cubierta-01-960.webp" }] });
    expect(m.robots).toEqual({ index: true, follow: true });
  });

  it("en /en el idioma y el locale cambian, y el canonical es el propio", async () => {
    const m = await meta("en", "libro-prueba");
    expect(m.alternates?.canonical).toBe("https://sitio.example/en/libros/libro-prueba");
    expect(og(m).locale).toBe("en_US");
    expect((m.title as { absolute: string }).absolute).toContain("with the Fathers");
    expect(m.description).toMatch(/Free prologue/);
    expect(m.description).toContain(`${PRECIO.pruebaDias} day trial`);
  });

  it("los borradores y los volúmenes sin lectura no se indexan", async () => {
    expect((await meta("es", "en-borrador")).robots).toEqual({ index: false, follow: true });
    expect((await meta("es", "completo-sin-texto")).robots).toEqual({ index: false, follow: true });
  });

  it("sin estantería no hay imagen social inventada", async () => {
    vi.stubEnv("AUDITE_LIBROS_RUTA", FIXTURES);
    const m = await meta("es", "libro-prueba");
    expect(og(m).images).toBeUndefined();
    expect(m.description!.length).toBeLessThanOrEqual(160);
  });

  it("la descripción con un resumen largo queda entre 140 y 160 caracteres", () => {
    const largo = "Una primera frase inventada para la prueba de longitud del texto. Una segunda frase inventada que añade más contexto al resumen. Una tercera frase inventada que ya no cabe en la descripción final.";
    const d = descripcionSeo(largo, "es", "Respaldo");
    expect(d.length).toBeGreaterThanOrEqual(140);
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.endsWith(`Prueba ${PRECIO.pruebaDias} días gratis.`)).toBe(true);
    const sinFrases = descripcionSeo("palabra ".repeat(60), "es", "Respaldo");
    expect(sinFrases.length).toBeLessThanOrEqual(160);
    expect(descripcionSeo("", "es", "Un subtítulo").startsWith("Un subtítulo")).toBe(true);
  });

  it("el título SEO se acorta para no pasar de 60", () => {
    expect(titularSeo("Un título corto", "Rut", "es")).toBe("Un título corto · Rut con los Padres | Audite");
    const largo = titularSeo("Un título bastante largo para una portada", "Deuteronomio", "es");
    expect(largo.length).toBeLessThanOrEqual(60);
    expect(largo.endsWith("| Audite")).toBe(true);
  });

  it("la portada de Libros lleva sus metadatos y la cubierta del volumen 1", async () => {
    const m = await metadatosPaginaCatalogo({ params: Promise.resolve({ lang: "es" }) });
    expect((m.title as { absolute: string }).absolute).toContain("Libros");
    expect(m.alternates?.canonical).toBe("https://sitio.example/es/libros");
    expect(og(m).images[0]!.url).toBe("https://sitio.example/api/libros/portada/cubierta-01-960.webp");
    expect(og(metadatosCatalogo("es", "https://x.example", false)).images).toBeUndefined();
  });
});

describe("render de la landing en servidor", () => {
  it("por defecto sale el estado sin sesión: adelanto, prueba y Entrar", async () => {
    const h = await html("es", "libro-prueba");
    expect(h).toContain('data-vista="sin-sesion"');
    expect(h).toContain(ETIQUETAS_FICHA.adelanto);
    expect(h).toContain("Prueba 7 días gratis");
    expect(h).toContain(">Entrar<");
    expect(h).toContain('href="/es/entrar?next=%2Fes%2Flibros%2Flibro-prueba%2Fleer"');
    expect(h).toContain('href="/es/membresia"');
    expect(h).toContain('data-acciones="resumen"');
    expect(h).toContain('data-acciones="tarjeta"');
    expect(h).toContain('data-acciones="cierre"');
  });

  it("estructura: migas, h1, cubierta en picture con AVIF y WebP, resumen y crédito", async () => {
    const h = await html("es", "libro-prueba");
    expect(h).toContain('aria-label="Ruta de navegación"');
    expect(h.match(/<h1/g)).toHaveLength(1);
    expect(h).toContain("PRIMERO · VOL. 1");
    expect(h).toContain('type="image/avif"');
    expect(h).toContain('type="image/webp"');
    expect(h).toContain("/api/libros/portada/cubierta-01-480.avif 480w, /api/libros/portada/cubierta-01-960.avif 960w");
    expect(h).toMatch(/<img[^>]*width="480"[^>]*height="720"/);
    expect(h.match(/fetchPriority="high"/g)).toHaveLength(1);
    expect(h).toContain("Una sinopsis inventada.");
    expect(h).toContain('data-credito=""');
    expect(h).toContain("Portada: Autor inventado");
    expect(h.indexOf("data-acciones=\"resumen\"")).toBeGreaterThan(h.indexOf("Una sinopsis inventada."));
  });

  it("tarjeta de suscripción con las tres ideas", async () => {
    const h = await html("es", "libro-prueba");
    expect(h).toContain("El prólogo de cada libro es gratis");
    expect(h).toContain("todos los libros completos");
    expect(h).toContain("la prueba dura 7 días");
  });

  it("índice con marcas: el prólogo es adelanto y el resto lleva suscripción", async () => {
    const h = await html("es", "libro-prueba");
    expect(h).toContain('id="indice"');
    const entrada = (id: string) => h.match(new RegExp(`<li[^>]*data-entrada="${id}"[^>]*>.*?</li>`))?.[0] ?? "";
    expect(entrada("prologo")).toContain("Adelanto gratis");
    expect(entrada("prologo")).toContain('href="/es/libros/libro-prueba/leer?c=prologo"');
    expect(entrada("capitulo-01")).toContain("Con suscripción");
    expect(entrada("capitulo-01")).toContain('href="/es/libros/libro-prueba/leer?c=capitulo-01"');
    expect(entrada("epilogo")).toContain("Con suscripción");
  });

  it("referencias: etiqueta sin raya, enlace al catálogo y lista de cruzados", async () => {
    const h = await html("es", "libro-prueba");
    expect(h).toContain('id="referencias"');
    expect(h).toContain('href="/es/catalogo/gn-01"');
    expect(h).toContain("Génesis 1 a 2");
    expect(h).toContain('href="/es/catalogo/jn-01"');
    expect(h).toContain("Juan 1 a 2");
    expect(h).toContain("Otros episodios relacionados");
    expect(h).not.toMatch(/[–—]/);
    expect(h).not.toContain("<details");
  });

  it("no lleva texto de capítulos ni rutas internas, y el JSON-LD es un Book sin ellos", async () => {
    const h = await html("es", "libro-prueba");
    for (const secreto of SECRETOS) expect(h).not.toContain(secreto);
    expect(h).not.toContain("no-debe-salir");
    const crudo = h.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1]!;
    const ld = JSON.parse(crudo.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&"));
    expect(ld).toMatchObject({
      "@type": "Book",
      name: "Libro de prueba",
      inLanguage: "es",
      isAccessibleForFree: false,
      author: { "@type": "Person", name: "E. Brisa" },
      image: "https://sitio.example/api/libros/portada/cubierta-01-960.webp",
      hasPart: { isAccessibleForFree: true, name: "Prólogo de prueba" },
    });
    expect(ld.description.length).toBeLessThanOrEqual(160);
    for (const secreto of SECRETOS) expect(crudo).not.toContain(secreto);
  });

  it("un volumen con catálogo pero sin texto avisa y no ofrece lectura", async () => {
    const h = await html("es", "completo-sin-texto");
    expect(h).toContain('data-aviso="preparandose"');
    expect(h).not.toContain('data-accion="leer"');
    expect(h).not.toContain('data-suscripcion');
  });

  it("un borrador lleva la insignia y el aviso del índice, sin botón de lectura ni lista", async () => {
    const h = await html("es", "en-borrador");
    expect(h).toContain('data-insignia="en-preparacion"');
    expect(h).toContain("En preparación");
    expect(h).toContain("El índice llegará con el volumen.");
    expect(h).not.toContain('data-accion="leer"');
    expect(h).not.toContain('data-accion="prueba"');
    expect(h).not.toContain("data-entrada=");
    expect(h).not.toContain("<ol class=\"mt-5");
  });

  it("sin estantería usa la cubierta tipográfica y no rompe", async () => {
    vi.stubEnv("AUDITE_LIBROS_RUTA", FIXTURES);
    const h = await html("es", "libro-prueba");
    expect(h).toContain("data-cubierta=");
    expect(h).not.toContain("<picture");
  });

  it("slug inválido, desconocido o idioma no público dan 404", async () => {
    await expect(html("es", "../x")).rejects.toThrow();
    await expect(html("es", "no-existe")).rejects.toThrow();
    await expect(html("xx", "libro-prueba")).rejects.toThrow();
  });

  it("el mock solo se reenvía fuera de producción", async () => {
    expect(await html("es", "libro-prueba", { mock: "premium" })).toContain("leer?mock=premium");
    vi.stubEnv("NODE_ENV", "production");
    expect(await html("es", "libro-prueba", { mock: "premium" })).not.toContain("mock=premium");
  });
});

describe("landing en inglés", () => {
  it("interfaz en inglés y contenido del libro marcado en español", async () => {
    const h = await html("en", "libro-prueba");
    expect(h).toContain("Read the preview");
    expect(h).toContain("Try 7 days free");
    expect(h).toContain(">Sign in<");
    expect(h).toContain("Contents");
    expect(h).toContain("References");
    expect(h).toContain("Free preview");
    expect(h).toContain("With subscription");
    expect(h).toContain(TEXTOS_LANDING.en.contenidoEs);
    expect(h).toMatch(/<h1[^>]*lang="es"/);
    expect(h).toMatch(/<p[^>]*lang="es"[^>]*>Una sinopsis inventada/);
    expect(h).toContain('href="/en/libros/libro-prueba/leer"');
    expect(h).not.toContain("Leer el adelanto");
    expect(h).not.toContain("Prueba 7 días gratis");
  });

  it("las etiquetas de botón tienen traducción para todas las reglas de botonesFicha", () => {
    for (const etiqueta of Object.values(ETIQUETAS_FICHA)) expect(etiquetaBoton({ etiqueta }, "en")).not.toBe(etiqueta);
  });
});

describe("referencias largas", () => {
  it("más de 8 dejan los 8 primeros a la vista y el resto en details, todo en el HTML", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "landing-"));
    try {
      mkdirSync(path.join(dir, "prueba"), { recursive: true });
      copyFileSync(path.join(FIXTURES, "prueba", "libro-prueba.json"), path.join(dir, "prueba", "libro-prueba.json"));
      const episodios = Array.from({ length: 11 }, (_, i) => ({ episodio_id: `ep-${i + 1}`, etiqueta: `Libro ${i + 1}–${i + 2}`, titulo: `Episodio ${i + 1}` }));
      writeFileSync(path.join(dir, "libros.json"), JSON.stringify({ libros: [{ id: "libro-prueba", orden: 1, titulo: "Libro de prueba", subtitulo: "S", libro_biblico: "Génesis", libro_id: "gn", estado: "completo", estructura_capitulos: [], episodios_del_libro_comentado: episodios, episodios_cruzados: [] }] }));
      vi.stubEnv("AUDITE_LIBROS_RUTA", dir);
      const h = await html("es", "libro-prueba");
      const [antes, dentro] = h.split("<details");
      expect(antes!.match(/href="\/es\/catalogo\/ep-/g)).toHaveLength(MAX_REFERENCIAS_VISIBLES);
      expect(dentro!.match(/href="\/es\/catalogo\/ep-/g)).toHaveLength(3);
      expect(h).toContain("Ver las 3 referencias restantes");
      expect(h).toContain("Libro 11 a 12");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("repartir y etiquetar", () => {
    expect(repartirReferencias([1, 2, 3], 2)).toEqual({ visibles: [1, 2], resto: [3] });
    expect(etiquetaReferencia({ etiqueta: "Génesis 1–2", titulo: "T" })).toBe("Génesis 1 a 2");
    expect(etiquetaReferencia({ etiqueta: "", titulo: "Un título; otro" })).toBe("Un título, otro");
  });
});

describe("sitemap", () => {
  it("incluye las landings con lectura y deja fuera borradores y volúmenes sin texto", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain("https://sitio.example/es/libros/libro-prueba");
    expect(urls).toContain("https://sitio.example/es/libros");
    expect(urls.some((u) => u.includes("en-borrador") || u.includes("completo-sin-texto"))).toBe(false);
  });
});

describe("estilo de las cadenas fijas", () => {
  it("sin punto y coma, rayas ni construcciones prohibidas, en los dos idiomas", () => {
    const cadenas = (["es", "en"] as const).flatMap((ui) => Object.values(TEXTOS_LANDING[ui]).flatMap((v) => (typeof v === "function" ? [v(1), v(3), v(8)] : [v])));
    for (const etiqueta of Object.values(ETIQUETAS_FICHA)) cadenas.push(etiquetaBoton({ etiqueta }, "en"));
    for (const cadena of cadenas) {
      expect(cadena, cadena).not.toMatch(/[;—–]/);
      expect(cadena, cadena).not.toMatch(/\bno es\b|\bsino\b|\bCEE\b/i);
    }
  });
});
