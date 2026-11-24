import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const ruta = vi.hoisted(() => ({ actual: "/es" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => ruta.actual,
  useSearchParams: () => new URLSearchParams(),
}));
import { SitioHeader, SitioPie } from "@/components/sitio";
import { rutaActiva } from "@/components/enlace-nav";
import { copiaSitio } from "@/sitio/i18n";

const cabecera = (lang: string, actual: string) => {
  ruta.actual = actual;
  return renderToStaticMarkup(<SitioHeader lang={lang} copy={copiaSitio(lang)!} />);
};
/** Las etiquetas `<a>` con ese href, sin depender del orden de los atributos. */
const enlaces = (html: string, href: string) => (html.match(/<a [^>]*>/g) ?? []).filter((a) => a.includes(`href="${href}"`));
const enlace = (html: string, href: string) => enlaces(html, href).at(-1) ?? "";

describe("cabecera pública", () => {
  it("lleva Libros en español e inglés, con estado activo bajo /libros", () => {
    const es = cabecera("es", "/es/libros/libro-x");
    expect(enlace(es, "/es/libros")).toContain('aria-current="page"');
    expect(es).toMatch(/>Libros<\/a>/);
    const en = cabecera("en", "/en/libros");
    expect(enlace(en, "/en/libros")).toContain('aria-current="page"');
    expect(en).toMatch(/>Books<\/a>/);
  });

  it("solo marca la sección en la que está", () => {
    const h = cabecera("es", "/es/libros/libro-x");
    expect(h.match(/aria-current="page"/g)).toHaveLength(1);
    expect(enlace(h, "/es/catalogo")).not.toContain("aria-current");
    expect(enlace(cabecera("es", "/es"), "/es")).toContain("aria-current");
    expect(enlace(cabecera("es", "/es"), "/es/libros")).not.toContain("aria-current");
    expect(enlace(cabecera("es", "/es/librosx"), "/es/libros")).not.toContain("aria-current");
  });

  it("rutaActiva cubre la propia ruta, las hijas y la barra final", () => {
    expect(rutaActiva("/es/libros", "/es/libros")).toBe(true);
    expect(rutaActiva("/es/libros/", "/es/libros")).toBe(true);
    expect(rutaActiva("/es/libros/a/leer", "/es/libros")).toBe(true);
    expect(rutaActiva("/es/libros/a", "/es", true)).toBe(false);
    expect(rutaActiva(null, "/es")).toBe(false);
  });

  it("contrato contra el desbordamiento a 390 px: la fila se pliega, no desborda y los objetivos miden 44 px", () => {
    const h = cabecera("es", "/es");
    const nav = h.match(/<nav [^>]*data-nav-publica[^>]*>/)?.[0] ?? "";
    expect(nav).toContain("flex-wrap");
    expect(nav).toContain("max-w-full");
    expect(nav).toContain("min-w-0");
    expect(nav).not.toMatch(/whitespace-nowrap|overflow-x-visible/);
    const interior = h.match(/<div class="cabecera-interior[^"]*"/)?.[0] ?? "";
    expect(interior).toContain("flex-wrap");
    // Inicio solo desde md: el logo ya lleva a la portada y la fila cabe a 390 px.
    expect(enlace(h, "/es")).toContain("hidden");
    for (const href of ["/es/catalogo", "/es/retos", "/es/libros", "/es/entrar"]) expect(enlace(h, href), href).toContain("min-h-11");
    // El selector no se ensancha con la opción más larga.
    const selector = readFileSync(path.resolve(import.meta.dirname, "selector-idioma.tsx"), "utf8");
    expect(selector).toMatch(/min-h-11 w-\[4\.5rem\] max-w-full/);
  });

  it("el pie también lleva Libros", async () => {
    expect(renderToStaticMarkup(await SitioPie({ lang: "es", novedades: false }))).toMatch(/href="\/es\/libros"[^>]*>Libros<\/a>/);
    expect(renderToStaticMarkup(await SitioPie({ lang: "en", novedades: false }))).toMatch(/href="\/en\/libros"[^>]*>Books<\/a>/);
  });
});
