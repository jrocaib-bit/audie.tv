import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { aplicarResumenEstilo, idsConCorreccionEstilo } from "./resumen-estilo";
import { obrasPortadaLibros } from "./obras";

describe("capa de estilo de resúmenes", () => {
  it("corrige gn-10 y deja el resto igual si no hay entrada", () => {
    const original = "Muere Abrahán. Rebeca da a luz a Esaú y Jacob, y Esaú vende su primogenitura por un plato de lentejas; Isaac se establece en Guerar, disputa por los pozos y recibe la promesa del Señor en Berseba.";
    const corregido = aplicarResumenEstilo("gn-10", { es: original, en: "" });
    expect(corregido.es).not.toMatch(/;/);
    expect(corregido.es).toContain("Isaac se establece en Guerar");
    expect(idsConCorreccionEstilo()).toContain("gn-10");
    const intacto = aplicarResumenEstilo("episodio-sin-capa", { es: "Un texto limpio.", en: "A clean text." });
    expect(intacto).toEqual({ es: "Un texto limpio.", en: "A clean text." });
  });

  it("no modifica el manifiesto de 01_canon", () => {
    const raw = readFileSync(path.resolve(import.meta.dirname, "../../../content/canon/01_canon/manifiesto.json"), "utf8");
    expect(raw).toContain("lentejas; Isaac");
  });
});

describe("creditos.json: clave libros", () => {
  it("lee la portada del volumen 1 sin rechazar la clave nueva", () => {
    const obras = obrasPortadaLibros();
    expect(obras.length).toBeGreaterThanOrEqual(1);
    expect(obras[0]?.id).toBe("lib-01_o1");
    expect(obras[0]?.volumen).toBe(1);
  });
});
