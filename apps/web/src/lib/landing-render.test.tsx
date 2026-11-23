import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => "/es",
  useSearchParams: () => new URLSearchParams(),
}));
import { SitioHome, SitioMembresia } from "@/components/sitio";
import { SitioPie } from "@/components/sitio";
import { etiquetaIdioma, idiomaConAudio } from "@/components/selector-idioma";
import { Placa } from "@/components/placa";
import { obraDeEpisodio } from "@audite/content/obras";

const PROHIBIDO = /CEE|Conferencia Episcopal|Sagrada Biblia/;

describe("landing según la simulación", () => {
  it("el hero separa muestra, reto y prueba, y no promete 'sin registro'", () => {
    const html = renderToStaticMarkup(SitioHome({ lang: "es" }));
    expect(html).toContain("Escuchar un episodio");
    expect(html).toContain("Escucha el reto gratis sin tarjeta");
    expect(html).toContain('href="/es/retos/adviento-isaias"');
    expect(html).toContain("Prueba 7 días");
    expect(html).toContain("El reto de Adviento pide una cuenta gratuita.");
    expect(html).toContain("Sin cuenta ni tarjeta.");
    expect(html).toContain("se escucha en el navegador");
    expect(html).toContain("de 2 a 4 minutos");
    expect(html).toContain("Una cuenta personal basta para poner el audio en un aula.");
    expect(html).not.toMatch(/sin registro/i);
    expect(html).not.toMatch(PROHIBIDO);
  });

  it("la membresía muestra el precio actual, el futuro y no nombra la CEE", async () => {
    const html = renderToStaticMarkup(SitioMembresia({ lang: "es" }));
    expect(html).toContain("1,99 €/mes");
    expect(html).toContain("8,00 €/año");
    expect(html).toContain("A partir del 6 de enero de 2027");
    expect(html).toContain("12,99 € al año");
    expect(html).not.toMatch(PROHIBIDO);
    const pie = renderToStaticMarkup(await SitioPie({ lang: "es" }));
    expect(pie).not.toMatch(PROHIBIDO);
  });

  it("con el interruptor encendido sale una sola línea de atribución", () => {
    vi.stubEnv("NEXT_PUBLIC_MENCION_CEE", "true");
    const html = renderToStaticMarkup(SitioHome({ lang: "es" }));
    vi.unstubAllEnvs();
    expect(html.match(/Conferencia Episcopal/g)).toHaveLength(1);
  });

  it("la placa no repite el bloque en inglés en páginas en español", () => {
    const obra = obraDeEpisodio("gn-05")!;
    const es = renderToStaticMarkup(Placa({ obra, lang: "es" }));
    expect(es).toContain(obra.titulo.es);
    expect(es).not.toContain("italic");
    if (obra.titulo.en !== obra.titulo.es) expect(es).not.toContain(obra.titulo.en);
    const en = renderToStaticMarkup(Placa({ obra, lang: "en" }));
    if (obra.titulo.en !== obra.titulo.es) expect(en).not.toContain(obra.titulo.es);
  });

  it("el selector marca como Próximamente los idiomas sin audio", () => {
    expect(idiomaConAudio("es")).toBe(true);
    expect(etiquetaIdioma("es", "es")).toBe("ES");
    expect(etiquetaIdioma("it", "es")).toBe("IT · Próximamente");
    expect(etiquetaIdioma("en", "es")).toBe("EN · Próximamente");
    expect(etiquetaIdioma("zh", "en")).toBe("中文 · Coming soon");
  });
});
