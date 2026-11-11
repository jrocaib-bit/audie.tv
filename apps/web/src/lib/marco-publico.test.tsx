import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => "/es",
  useSearchParams: () => new URLSearchParams(),
}));
import { MarcoSitio, SitioPie } from "@/components/sitio";
import { metadata as metadataCuenta } from "@/app/cuenta/layout";
import { entradasSitemap } from "@/lib/sitio-publico";

function tieneMarco(html: string, ruta: string) {
  expect(html, ruta).toContain("<header");
  expect(html, ruta).toContain("<footer");
  expect(html, ruta).toContain("La voz y la música están generadas con IA.");
  expect(html, ruta).toContain(`data-ruta="${ruta}"`);
}

describe("marco de las páginas públicas", () => {
  it("cada página pública renderiza cabecera y pie", async () => {
    const urls = entradasSitemap("https://audite.tv");
    expect(urls.some((url) => url.endsWith("/cuenta"))).toBe(false);
    const layout = readFileSync(path.resolve("apps/web/src/app/[lang]/layout.tsx"), "utf8");
    const reto = readFileSync(path.resolve("apps/web/src/app/reto/[id]/page.tsx"), "utf8");
    expect(layout).toContain("<MarcoSitio");
    expect(reto).toContain("<MarcoSitio");
    for (const url of urls) {
      const ruta = new URL(url).pathname;
      expect(ruta.startsWith("/es") || ruta.startsWith("/reto/"), ruta).toBe(true);
      const html = renderToStaticMarkup(await MarcoSitio({
        lang: "es",
        sobreObra: ruta === "/es",
        children: <main data-ruta={ruta} />,
      }));
      tieneMarco(html, ruta);
    }
  });

  it("el pie de la app no ofrece recibir novedades", async () => {
    const app = renderToStaticMarkup(await SitioPie({ lang: "es", novedades: false }));
    const inicio = renderToStaticMarkup(await SitioPie({ lang: "es", novedades: true }));
    expect(app).not.toContain("Recibir novedades");
    expect(inicio).toContain("Recibir novedades");
    expect(inicio).toContain(">Entrar<");
    expect(inicio).not.toContain("Entrar con Apple o Google");
  });

  it("la cuenta no se indexa", () => {
    expect(metadataCuenta.robots).toEqual({ index: false, follow: false });
  });
});
