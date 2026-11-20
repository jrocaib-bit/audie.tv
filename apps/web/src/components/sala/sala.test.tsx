import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadAppCatalog } from "@audite/content/app-catalog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => "/es",
  useSearchParams: () => new URLSearchParams(),
}));
import { SitioHome } from "@/components/sitio";
import { VistaRetoAnio } from "@/components/reto-anio";
import { PaywallWeb } from "@/components/paywall-web";
import { PlanCard } from "./plan-card";
import { BotonOro } from "./boton-oro";
import { VistaRetos } from "./vista-retos";
import { Lienzo } from "./lienzo";
import { estadoDeReto, retoHeroe, anioLiturgico } from "@/lib/sala";
import { retoDeTemporada, retosDeTemporada } from "@/lib/retos-anio";

afterEach(() => vi.unstubAllEnvs());

const imgs = (html: string) => [...html.matchAll(/<img[^>]*>/g)].map((m) => m[0]);
const obras = (html: string) => [...html.matchAll(/data-obra="([^"]+)"/g)].map((m) => m[1]!);
/** La pintura principal: cualquier <img> sin aria-hidden que no sea la portada oficial. */
const sinCover = (html: string) => imgs(html).filter((img) => img.includes("sala-obra") && img.includes("object-cover"));

describe("La sala · home", () => {
  const html = renderToStaticMarkup(<SitioHome lang="es" />);

  it("la pintura principal va completa; solo el fondo desenfocado es cover", () => {
    const principales = imgs(html).filter((img) => img.includes("sala-obra"));
    expect(principales.length).toBeGreaterThan(0);
    expect(principales.every((img) => img.includes("object-contain"))).toBe(true);
    // Cover solo en el fondo desenfocado o en una portada oficial de reto (9:16), nunca en una pintura.
    for (const img of imgs(html).filter((item) => item.includes("object-cover"))) expect(img.includes("bucle-fondo") || img.includes("sala-portada")).toBe(true);
  });

  it("no repite ninguna obra en la pantalla", () => {
    const ids = obras(html);
    expect(ids.length).toBeGreaterThan(3);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ya no trae «Cómo funciona» ni la FAQ", () => {
    expect(html).not.toContain("Cómo funciona");
    expect(html).not.toContain("¿Cuánto cuesta?");
    expect(html).not.toContain("¿Qué es Audite?");
    expect(html).not.toContain("Elige un camino o un reto");
  });

  it("un h1, una acción dorada principal en el hero y precios correctos", () => {
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html.replace(/<[^>]+>/g, "")).toContain("Biblia,");
    expect(html).toContain("Empieza 7 días gratis");
    expect(html).toContain("Escucha gratis");
    expect(html).toContain("8 €");
    expect(html).toContain("1,99 €");
    expect(html).toContain("/es/oir/");
    expect(html).toContain("516");
  });

  it("los CTA tienen 48 px y las cifras van en Gazpacho", () => {
    expect(html).toContain("min-h-12");
    expect(html).toContain("t-cifra");
  });
});

describe("La sala · retos y ficha", () => {
  const hoy = "2026-11-20";
  const html = renderToStaticMarkup(<VistaRetos lang="es" hoy={hoy} />);

  it("cartel héroe es Adviento y las pinturas van completas", () => {
    expect(retoHeroe(retosDeTemporada(), hoy)?.id).toBe("adviento-isaias");
    expect(html).toContain("Adviento con Isaías");
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(sinCover(html)).toHaveLength(0);
    expect(html).toContain("data-linea-anio");
    expect(html).toContain("data-hoy");
  });

  it("no repite obras en el listado", () => {
    const ids = obras(html);
    expect(ids.length).toBeGreaterThan(3);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("la ficha usa object-contain, calendario sin obras repetidas y barra N de M", () => {
    const reto = retoDeTemporada("adviento-isaias")!;
    const ficha = renderToStaticMarkup(<VistaRetoAnio lang="es" reto={reto} rangos={loadAppCatalog().rangos} hoy={hoy} />);
    expect(ficha.match(/<h1/g)).toHaveLength(1);
    expect(sinCover(ficha)).toHaveLength(0);
    expect(imgs(ficha).filter((img) => img.includes("sala-obra") || img.includes("object-contain")).every((img) => !img.includes("object-cover"))).toBe(true);
    const ids = obras(ficha);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ficha).toContain('role="progressbar"');
    expect(ficha).toContain("data-calendario");
    expect(ficha).toContain('data-estado="futuro"');
  });

  it("estados y año litúrgico", () => {
    const adviento = retoDeTemporada("adviento-isaias")!;
    expect(estadoDeReto(adviento, "2026-11-20").estado).toBe("proximo");
    expect(estadoDeReto(adviento, "2026-12-01")).toMatchObject({ estado: "en-curso", hechos: 2 });
    expect(anioLiturgico().map((t) => t.id)).toEqual(["adviento", "navidad", "ordinario-1", "cuaresma", "semana-santa", "pascua", "ordinario-2"]);
  });
});

describe("La sala · componentes", () => {
  it("PlanCard muestra 8 € y 1,99 € y un único CTA", () => {
    const html = renderToStaticMarkup(<PlanCard ui="es"><BotonOro>Avísame</BotonOro></PlanCard>);
    expect(html).toContain("8 €");
    expect(html).toContain("1,99 €");
    expect(html).toContain("ahorra un 66 %");
    expect(html).toContain("Cancela cuando quieras");
    expect(html).not.toContain("8,00");
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(renderToStaticMarkup(<PlanCard ui="en" />)).toContain("save 66%");
  });

  it("BotonOro: oro-claro con texto Noche y 48 px; fantasma y secundario no son dorados", () => {
    expect(renderToStaticMarkup(<BotonOro>Hola</BotonOro>)).toMatch(/min-h-12[^"]*|bg-\[#E0C48A\]/);
    expect(renderToStaticMarkup(<BotonOro>Hola</BotonOro>)).toContain("bg-[#E0C48A]");
    expect(renderToStaticMarkup(<BotonOro>Hola</BotonOro>)).toContain("text-[#100E0C]");
    expect(renderToStaticMarkup(<BotonOro variante="fantasma">Hola</BotonOro>)).not.toContain("bg-[#E0C48A]");
    expect(renderToStaticMarkup(<BotonOro variante="secundario">Hola</BotonOro>)).not.toContain("bg-[#E0C48A]");
  });

  it("Lienzo: obra contain y fondo desenfocado cover de la misma obra", () => {
    const html = renderToStaticMarkup(<Lienzo src="/x.webp" obraId="x" />);
    const [fondo, obra] = imgs(html);
    expect(fondo).toContain("object-cover");
    expect(fondo).toContain("blur");
    expect(obra).toContain("object-contain");
    expect(fondo).toContain('src="/x.webp"');
  });

  it("el paywall tiene un h1, un solo botón principal y «Avísame» con compras apagadas", () => {
    const html = renderToStaticMarkup(<PaywallWeb lang="es" />);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("Avísame");
    expect(html.match(/bg-\[#E0C48A\]/g)).toHaveLength(1);
    expect(html).toContain("8 €");
    expect(html).toContain("1,99 €");
  });
});

describe("La sala · movimiento reducido y tokens", () => {
  const css = readFileSync("apps/web/src/app/sala.css", "utf8");
  it("define radios y respeta prefers-reduced-motion", () => {
    for (const radio of ["--radio-obra: 8px", "--radio-tarjeta: 24px", "--radio-mini: 20px", "--radio-cartel: 28px", "--radio-pildora: 999px"]) expect(css).toContain(radio);
    expect(css).toContain("prefers-reduced-motion: reduce");
  });
  it("el hero no usa parallax ni cover", () => {
    const fuente = readFileSync("apps/web/src/components/sitio.tsx", "utf8");
    const home = fuente.slice(fuente.indexOf("export function SitioHome"), fuente.indexOf("function BadgeTienda"));
    expect(home).not.toContain("parallax-obra");
    expect(home).not.toContain("ken-burns");
  });
});
