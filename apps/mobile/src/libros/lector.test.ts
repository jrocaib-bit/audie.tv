import { contraste } from "@audite/domain";
import { describe, expect, it } from "vitest";
import { TEMAS_LECTOR, acentoLector, tintaSobreAcento } from "./lector-temas";
import { altoCabecera, altoUtilPagina, bloquesMedibles, espacioSobre, llevaSangria, metricas } from "./lector-estilo";
import { paginar } from "./paginacion";

const COLORES_LIBROS = ["#805F36", "#8A4A2F", "#2F4A63", "#4A6B52", "#556339", "#5A4538", "#2E2924", "#C9A96E", "#F4ECE2", "#000000"];

describe("temas del lector", () => {
  it("el texto de cada tema cumple 4,5:1", () => {
    for (const t of Object.values(TEMAS_LECTOR)) {
      expect(contraste(t.ink, t.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contraste(t.tenue, t.bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("el acento de cada libro cumple 4,5:1 en Día, Sepia y Noche", () => {
    for (const color of COLORES_LIBROS) {
      for (const tema of Object.values(TEMAS_LECTOR)) {
        const acento = acentoLector(color, tema);
        expect(contraste(acento, tema.bg)).toBeGreaterThanOrEqual(4.5);
        expect(contraste(tintaSobreAcento(acento), acento)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
  it("un color que ya cumple queda exacto y uno inválido usa un acento por defecto", () => {
    expect(acentoLector("#2F4A63", TEMAS_LECTOR.dia)).toBe("#2f4a63");
    expect(contraste(acentoLector("rojo", TEMAS_LECTOR.dia), TEMAS_LECTOR.dia.bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("métricas de página", () => {
  it("la sangría solo va en un párrafo tras otro párrafo", () => {
    expect(llevaSangria({ tipo: "parrafo" }, { tipo: "parrafo" })).toBe(true);
    expect(llevaSangria({ tipo: "parrafo" }, undefined)).toBe(false);
    expect(llevaSangria({ tipo: "parrafo" }, { tipo: "subtitulo" })).toBe(false);
    expect(llevaSangria({ tipo: "pasaje" }, { tipo: "parrafo" })).toBe(false);
  });
  it("la cabecera crece con las líneas del título y con el tamaño", () => {
    expect(altoCabecera(3, 18)).toBeGreaterThan(altoCabecera(1, 18));
    expect(altoCabecera(2, 23)).toBeGreaterThan(altoCabecera(2, 16));
    expect(metricas(18).lh).toBe(28);
  });
  it("los subtítulos llevan aire arriba y los párrafos seguidos no", () => {
    expect(espacioSobre({ tipo: "subtitulo" }, { tipo: "parrafo" }, 18)).toBeGreaterThan(0);
    expect(espacioSobre({ tipo: "parrafo" }, { tipo: "parrafo" }, 18)).toBe(0);
  });
  it("arma bloques medibles con cabecera y se pagina", () => {
    const capitulo = { bloques: [{ id: "a", tipo: "parrafo" as const, texto: "", html: "", referencias: [] }, { id: "b", tipo: "subtitulo" as const, texto: "", html: "", referencias: [] }, { id: "c", tipo: "parrafo" as const, texto: "", html: "", referencias: [] }] };
    const medibles = bloquesMedibles(capitulo, [2, 30, 1, 12], 18);
    expect(medibles.map((m) => m.id)).toEqual(["cabecera", "a", "b", "c"]);
    expect(medibles[2]?.conSiguiente).toBe(true);
    const paginas = paginar(medibles, altoUtilPagina(844, 47, 34));
    expect(paginas.length).toBeGreaterThan(2);
    expect(paginas[0]?.fragmentos[0]?.bloque).toBe(0);
  });
  it("el alto útil descuenta las zonas de título y número de página", () => {
    expect(altoUtilPagina(844, 47, 34)).toBe(844 - 103 - 90);
    expect(altoUtilPagina(100, 0, 0)).toBe(200);
  });
});
