import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { aplicarResumenEstilo, idsConCorreccionEstilo } from "@audite/content/resumen-estilo";
import { resumenPublico } from "./resumenes";

describe("resúmenes de episodio", () => {
  it("reutiliza el resumen del canon y genera uno neutro si falta", () => {
    const real = resumenPublico("gn-01", "En el principio", "Génesis 1–2", "es");
    expect(real.generado).toBe(false);
    expect(real.texto.length).toBeGreaterThan(10);
    const hueco = resumenPublico("no-existe", "Un título", "Libro 1", "es");
    expect(hueco).toEqual({ texto: "Un título. Pasaje Libro 1.", generado: true });
  });

  it("aplica la capa de estilo: gn-10 queda sin punto y coma", () => {
    const gn10 = resumenPublico("gn-10", "Un plato de lentejas", "Génesis 25–26", "es");
    expect(gn10.generado).toBe(false);
    expect(gn10.texto).not.toMatch(/;/);
    expect(gn10.texto).toContain("Isaac se establece en Guerar");
    expect(gn10.texto).toContain("plato de lentejas");
  });

  it("deja el manifiesto intacto y solo cubre los textos corregidos", () => {
    const manifiestoPath = path.resolve(import.meta.dirname, "../../../../content/canon/01_canon/manifiesto.json");
    const bruto = readFileSync(manifiestoPath, "utf8");
    expect(bruto).toContain("lentejas; Isaac");
    expect(idsConCorreccionEstilo().length).toBeGreaterThan(0);
    const original = { es: "Uno; dos.", en: "" };
    expect(aplicarResumenEstilo("gn-10", original).es).not.toBe(original.es);
  });
});
