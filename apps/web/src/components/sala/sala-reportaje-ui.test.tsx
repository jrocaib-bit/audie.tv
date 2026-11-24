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
    it(`gn-02 ${lang}: cita, mapa SVG y línea de tiempo antes del corte; nada posterior`, () => {
      const html = renderToStaticMarkup(SalaPagina({ lang, id: "gn-02", mock: "gratis" }));
      const c = contextoSala("gn-02", lang)!;
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
      expect(html).not.toContain(resolverRecorrido("gn-02", lang)!.cierre.titulo);
      expect(html).not.toMatch(/https?:\/\/[^"]*(tile|maps|google|cesium)/i);
      expect(html).not.toContain("<iframe");
    });
  }
  it("otra obra lleva su propio contexto en el adelanto, sin pasos, comparativa ni radios", () => {
    const otro = idsSala().find((id) => !["gn-01", "gn-07", "is-18"].includes(id))!;
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

describe("obras abiertas sin sesión", () => {
  it("gn-01 llega completo (comparativa y pasos) y con el espacio del visor en el relato", () => {
    const html = renderToStaticMarkup(SalaPagina({ lang: "es", id: "gn-01", mock: "sin" }));
    expect(html).toContain('data-vista="abierta"');
    expect(html).toContain("data-comparativa");
    expect(html).toContain(resolverRecorrido("gn-01", "es")!.pasos[0]!.titulo);
    expect(html).toContain("max-md:mb-[62svh]");
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
  it("móvil: mapa, línea y comparativa a pantalla completa por encima del visor, y la columna no crea contexto z-10", () => {
    const { comparativa } = reportajePremium("gn-01", "es");
    const completo = renderToStaticMarkup(<RelatoScroll lang="es" id="gn-01" src="/x.webp" alt="Obra" titulo="T" datos={{ ...datos, comparativa: comparativa! }} contexto={contexto} />);
    for (const a of ["data-mapa", "data-linea-tiempo", "data-comparativa"]) {
      const etiqueta = completo.match(new RegExp(`<section [^>]*${a}[^>]*>`))![0];
      expect(etiqueta).toContain("data-pantalla");
      expect(etiqueta).toContain("max-md:z-[25]");
      expect(etiqueta).toContain("max-md:bg-[#0C0B09]");
      expect(etiqueta).toContain("max-md:min-h-[calc(100svh-var(--cab,76px))]");
    }
    expect(completo).toMatch(/class="sticky top-\[var\(--cab\)\] z-20/);
    expect(completo).not.toMatch(/class="relative z-10 -mt-5/);
    expect(completo).not.toContain("max-w-[17rem]");
    expect(completo).toContain("grid-cols-1 items-start gap-5 md:grid-cols-2");
    // El mapa de la apertura no pinta pantalla completa en el adelanto (el visor no es sticky).
    const adelanto = renderToStaticMarkup(SalaPagina({ lang: "es", id: "gn-02", mock: "gratis" }));
    expect(adelanto).toContain("data-mapa");
    expect(adelanto).not.toContain("data-pantalla");
    expect(adelanto).not.toContain("max-md:mb-[62svh]");
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
    expect(reducido).toContain("data-linea-tiempo");
    expect(reducido).not.toContain("opacity:0");
    expect(reducido).toContain('data-zoom="1"');
    expect(reducido).not.toMatch(/data-pantalla[^>]*style=/);
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
