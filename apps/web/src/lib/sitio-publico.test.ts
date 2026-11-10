import { describe, expect, it } from "vitest";
import { debeNoindex, entradasSitemap, origenSitio, robotsPara } from "./sitio-publico";

describe("sitio público", () => {
  it("usa audite.tv y nunca el bucle local", () => {
    expect(origenSitio(undefined)).toBe("https://audite.tv");
    expect(origenSitio("http://127.0.0.1:43123")).toBe("https://audite.tv");
    expect(origenSitio("https://audite.tv/")).toBe("https://audite.tv");
  });

  it("oculta el índice solo en vistas de Vercel", () => {
    expect(debeNoindex("audite.tv")).toBe(false);
    expect(debeNoindex("www.audite.tv", "preview")).toBe(false);
    expect(debeNoindex("audite-abc.vercel.app")).toBe(true);
    expect(debeNoindex("preview.ejemplo.test", "preview")).toBe(true);
    expect(robotsPara("audite.vercel.app")).toContain("Disallow: /");
    expect(robotsPara("audite.tv")).toContain("Sitemap: https://audite.tv/sitemap.xml");
  });

  it("el mapa no lista el catálogo entero", () => {
    const urls = entradasSitemap("https://audite.tv");
    expect(urls.some((url) => url.endsWith("/es/membresia"))).toBe(true);
    expect(urls.some((url) => url.includes("/catalogo/"))).toBe(false);
    expect(urls.join("\n")).not.toContain("127.0.0.1");
  });
});
