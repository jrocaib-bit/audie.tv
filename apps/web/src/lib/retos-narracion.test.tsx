import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { loadAppCatalog } from "@audite/content/app-catalog";
import { VistaRetoAnio } from "@/components/reto-anio";
import { retoDeTemporada, retosDeTemporada } from "./retos-anio";
import { narracionDeDia, retosNarrados } from "./retos-narracion";

afterEach(() => {
  delete process.env.NEXT_PUBLIC_RETO_PROFECIAS_PORTADA;
  delete process.env.NEXT_PUBLIC_RETO_PROFECIAS_MINIATURAS_BASE;
});

const NEGACION_INICIAL = /(^|[.!?]\s+)(No|Nadie|Nunca|Nada|Ni|Not|Never|Nobody|Nothing|Neither)\b/;
const ABREVIATURA = /\b(Gn|Ex|Dt|Sal|Is|Jr|Os|Am|Jon|Za|Mt|Mc|Lc|Jn|Hch)\.? \d+[,:]\d+/;

describe("Retos narrados", () => {
  it("Profecías de la Pasión narra sus 8 días, en español e inglés", () => {
    const narrados = retosNarrados();
    expect(narrados).toEqual([{ reto: "profecias-pasion", dias: 8 }]);
    const reto = retoDeTemporada("profecias-pasion");
    expect(reto?.dias).toHaveLength(8);
    for (const dia of reto?.dias ?? []) {
      expect(dia.narracion, dia.pieza).toBeDefined();
      for (const idioma of ["es", "en"] as const) {
        const parrafos = dia.narracion?.[idioma] ?? [];
        expect(parrafos.length, `${dia.pieza} ${idioma}`).toBeGreaterThanOrEqual(2);
        expect(parrafos.length, `${dia.pieza} ${idioma}`).toBeLessThanOrEqual(4);
        const total = parrafos.reduce((suma, p) => suma + p.length, 0);
        expect(total, `${dia.pieza} ${idioma}`).toBeGreaterThanOrEqual(700);
        expect(total, `${dia.pieza} ${idioma}`).toBeLessThanOrEqual(2000);
        for (const parrafo of parrafos) {
          expect(parrafo.length).toBeGreaterThanOrEqual(200);
          expect(parrafo.length).toBeLessThanOrEqual(650);
        }
      }
      expect(dia.narracion?.es.length).toBe(dia.narracion?.en.length);
    }
  });

  it("cumple las reglas de estilo de Audite", () => {
    for (const clave of ["pp-01", "pp-02", "pp-03", "pp-04", "pp-05", "pp-06", "pp-07", "pp-08"]) {
      const dia = narracionDeDia("profecias-pasion", clave);
      for (const idioma of ["es", "en"] as const) {
        for (const parrafo of dia?.[idioma] ?? []) {
          const donde = `${clave} ${idioma}`;
          expect(parrafo, donde).not.toMatch(/[;—–]/);
          expect(parrafo, donde).not.toMatch(NEGACION_INICIAL);
          expect(parrafo, donde).not.toMatch(/\bno\b[^.]{0,80}\bsino\b|\bnot\b[^.]{0,80}\bbut\b|\bno es\b[^.]{0,60}\bes\b|\bit is not\b[^.]{0,60}\bit is\b/i);
          expect(parrafo, donde).not.toMatch(ABREVIATURA);
          expect(parrafo, donde).not.toMatch(/Conferencia Episcopal|Sagrada Biblia|Episcopal Conference|dominio p[uú]blico|public domain/i);
          expect(parrafo, donde).not.toMatch(/[<>\n]/);
        }
      }
    }
  });

  it("pinta el relato arriba y deja las lecturas plegadas al final de cada día", () => {
    process.env.NEXT_PUBLIC_RETO_PROFECIAS_MINIATURAS_BASE = "https://cdn.example/pp";
    const reto = retoDeTemporada("profecias-pasion");
    if (!reto) throw new Error("falta el reto");
    const rangos = loadAppCatalog().rangos;
    for (const lang of ["es", "en"] as const) {
      const html = renderToStaticMarkup(<VistaRetoAnio lang={lang} reto={reto} rangos={rangos} />);
      const dias = html.split("<article data-narrado").slice(1);
      expect(dias).toHaveLength(8);
      for (const dia of dias) {
        const miniatura = dia.indexOf("_es_miniatura_v1.webp");
        const boton = dia.indexOf("data-escuchar");
        const relato = dia.indexOf("data-relato");
        const lecturas = dia.indexOf("<details data-lecturas");
        expect(miniatura).toBeGreaterThan(-1);
        expect(boton).toBeGreaterThan(miniatura);
        expect(relato).toBeGreaterThan(boton);
        expect(lecturas).toBeGreaterThan(relato);
        const antesDelRelato = dia.slice(0, relato);
        expect(antesDelRelato).not.toContain("→");
        expect(antesDelRelato).not.toContain("/catalogo/");
        expect(dia.slice(lecturas)).toContain("→");
        expect(dia.slice(lecturas)).not.toContain(" open");
        expect(dia).toContain("disabled");
      }
      expect(html).toContain(lang === "es" ? "Lecturas del día" : "Readings of the day");
      expect(html).toContain(lang === "es" ? "Episodios completos" : "Full episodes");
      const primero = narracionDeDia("profecias-pasion", "pp-01")?.[lang][0] ?? "";
      expect(primero.length).toBeGreaterThan(100);
      expect(html).toContain(primero.slice(0, 40).replace(/&/g, "&amp;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;"));
    }
  });

  it("deja la cuadrícula de los demás retos como estaba", () => {
    const otros = retosDeTemporada().filter((reto) => reto.id !== "profecias-pasion");
    expect(otros.length).toBeGreaterThan(0);
    for (const reto of otros) {
      expect(reto.dias.some((dia) => dia.narracion)).toBe(false);
      const html = renderToStaticMarkup(<VistaRetoAnio lang="es" reto={reto} rangos={[]} />);
      expect(html).not.toContain("data-narrado");
    }
  });
});
