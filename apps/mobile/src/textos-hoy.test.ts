import { describe, expect, it } from "vitest";
import { llenar, th } from "./textos-hoy";

describe("textos de Hoy y Caminos", () => {
  it("tienen las mismas claves en español e inglés y ninguna vacía", () => {
    const es = th("es");
    const en = th("en");
    expect(Object.keys(en)).toEqual(Object.keys(es));
    for (const valor of [...Object.values(es), ...Object.values(en)]) expect(valor.trim().length).toBeGreaterThan(0);
  });
  it("el español no usa punto y coma ni rayas", () => {
    for (const valor of Object.values(th("es"))) expect(valor).not.toMatch(/[;—–]/);
  });
  it("tiene la etiqueta Próximamente y ya no la nota del reto", () => {
    expect(th("es").proximamente).toBe("Próximamente");
    expect(th("en").proximamente).toBe("Coming soon");
    expect(Object.keys(th("es"))).not.toContain("retoNota");
  });
  it("rellena los huecos", () => {
    expect(llenar(th("es").dia, { n: 5, total: 516 })).toBe("Día 5 de 516");
    expect(llenar(th("en").cambio, { nombre: "Genesis" })).toContain("Genesis");
  });
});
