import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SalaPagina } from "@/app/[lang]/sala/sala-pagina";
import { idsSala, recorridoSala, resolverRecorrido } from "@/lib/sala-recorridos";
import { contextoSala, reportajePremium } from "@/lib/sala-reportaje";
import { RelatoScroll } from "./sala-cuenta";

vi.mock("next/image", () => ({ default: () => null }));

const cierreGn01 = recorridoSala("gn-01")!.cierre.titulo.es;

describe("adelanto con contexto (sin sesión y gratuito)", () => {
  for (const lang of ["es", "en"] as const) {
    it(`gn-01 ${lang}: cita, mapa SVG y línea de tiempo antes del corte; nada posterior`, () => {
      const html = renderToStaticMarkup(SalaPagina({ lang, id: "gn-01", mock: "gratis" }));
      const c = contextoSala("gn-01", lang)!;
      expect(html).toContain("data-cita");
      expect(html).toContain("data-mapa");
      expect(html).toContain("data-linea-tiempo");
      expect(html).toContain("<svg");
      expect(html).toContain(c.cita!.replace("'", "&#x27;"));
      expect(html.indexOf("data-apertura")).toBeLessThan(html.indexOf("data-cita"));
      expect(html.indexOf("data-linea-tiempo")).toBeLessThan(html.indexOf("data-corte"));
      expect(html).not.toContain("data-comparativa");
      expect(html).not.toContain("data-creditos");
      expect(html).not.toContain("data-fragmento");
      expect(html).not.toMatch(/Durero|Dürer|Escuchar el episodio|Listen to the episode/);
      expect(html).not.toContain(resolverRecorrido("gn-01", lang)!.cierre.titulo);
      expect(html).not.toMatch(/https?:\/\/[^"]*(tile|maps|google|cesium)/i);
      expect(html).not.toContain("<iframe");
    });
  }
  it("otra obra lleva su propio contexto en el adelanto, sin pasos, comparativa ni radios", () => {
    const otro = idsSala().find((id) => id !== "gn-01")!;
    const html = renderToStaticMarkup(SalaPagina({ lang: "es", id: otro }));
    const c = contextoSala(otro, "es")!;
    expect(html).toContain("data-apertura");
    expect(html).toContain("data-corte");
    for (const a of ["data-contexto", "data-cita", "data-mapa", "data-linea-tiempo"]) expect(html).toContain(a);
    expect(html).toContain(c.mapa![0]!.id);
    expect(html).not.toContain("data-comparativa");
    expect(html).not.toContain(resolverRecorrido(otro, "es")!.pasos[0]!.texto);
    expect(html).not.toContain(resolverRecorrido(otro, "es")!.cierre.titulo);
    expect(html).not.toContain("Durero");
  });
});

describe("relato premium con máscara y contexto", () => {
  const r = recorridoSala("gn-01")!;
  const datos = {
    apertura: { titulo: r.apertura.titulo.es, texto: r.apertura.texto.es },
    pasos: r.pasos.map((p) => ({ x: p.x, y: p.y, zoom: p.zoom, titulo: p.titulo.es, texto: p.texto.es })),
    cierre: { titulo: cierreGn01, texto: r.cierre.texto.es },
  };
  const contexto = contextoSala("gn-01", "es");
  const html = renderToStaticMarkup(<RelatoScroll lang="es" id="gn-01" src="/x.webp" alt="Obra" titulo="T" datos={datos} contexto={contexto} />);
  const reducido = renderToStaticMarkup(<RelatoScroll lang="es" id="gn-01" src="/x.webp" alt="Obra" titulo="T" datos={datos} contexto={contexto} reducido />);

  it("una capa de máscara por paso, ninguna activa en la apertura, y una sola imagen de la obra", () => {
    expect(html).toContain('data-mascara="ninguna"');
    expect((html.match(/data-capa-mascara=/g) ?? []).length).toBe(datos.pasos.length);
    expect(html).toContain("radial-gradient");
    expect((html.match(/<img/g) ?? []).length).toBe(1);
    expect(html).toContain("data-cita");
    expect(html).toContain("data-mapa");
    expect(html).toContain("data-linea-tiempo");
  });
  it("la máscara solo anima opacity", () => {
    const capa = html.match(/data-capa-mascara="1"[^>]*style="([^"]*)"/)![1]!;
    expect(capa).toContain("transition:opacity 750ms");
    expect(capa).not.toMatch(/transform|width|height|left|top/);
  });
  it("movimiento reducido: sin capas de máscara y con el contexto legible", () => {
    expect(reducido).not.toContain("data-capa-mascara");
    expect(reducido).toContain('data-mascara="ninguna"');
    expect(reducido).toContain("data-mapa");
    expect(reducido).not.toContain("opacity:0");
  });
  it("comparativa tras el paso 5: pies, créditos aparte, lazy, fragmento y cierre hacia el episodio", () => {
    const { comparativa, radios } = reportajePremium("gn-01", "es");
    const completo = renderToStaticMarkup(<RelatoScroll lang="es" id="gn-01" src="/x.webp" alt="Obra" titulo="T" datos={{ ...datos, pasos: datos.pasos.map((p, i) => ({ ...p, radio: radios[i] })), comparativa: comparativa! }} contexto={contexto} />);
    expect(completo).toContain("data-comparativa");
    for (const i of comparativa!.imagenes) {
      expect(completo).toContain(i.src);
      expect(completo).toContain(i.pie);
    }
    expect(completo).toMatch(/<p data-creditos[^>]*>Grabados cedidos en CC0 por la National Gallery of Art/);
    expect(completo.indexOf('data-paso="5"')).toBeLessThan(completo.indexOf("data-comparativa"));
    expect(completo.indexOf("data-comparativa")).toBeLessThan(completo.indexOf("data-cierre"));
    expect(completo).toContain("data-fragmento");
    expect(completo).toContain("Oír un fragmento");
    expect(completo).toContain('data-cta="escuchar"');
    expect(completo).toContain('href="/es/oir/gn-01"');
    // La obra solo aparece una vez como imagen del visor; las otras dos son las de la comparativa, lazy.
    expect((completo.match(/<img/g) ?? []).length).toBe(3);
    expect((completo.match(/loading="lazy"/g) ?? []).length).toBe(2);
    expect(html).not.toContain("data-comparativa");
  });
  it("sin contexto no se pinta bloque de contexto", () => {
    const sin = renderToStaticMarkup(<RelatoScroll lang="es" id="x" src="/x.webp" alt="Obra" titulo="T" datos={datos} />);
    expect(sin).not.toContain("data-contexto");
  });
});
