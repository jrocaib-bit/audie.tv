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
  it("rellena los huecos", () => {
    expect(llenar(th("es").dia, { n: 5, total: 516 })).toBe("Día 5 de 516");
    expect(llenar(th("en").cambio, { nombre: "Genesis" })).toContain("Genesis");
  });
});
