import { describe, expect, it } from "vitest";
import { resumenPublico } from "./resumenes";

describe("resúmenes de episodio", () => {
  it("reutiliza el resumen del canon y genera uno neutro si falta", () => {
    const real = resumenPublico("gn-01", "En el principio", "Génesis 1–2", "es");
    expect(real.generado).toBe(false);
    expect(real.texto.length).toBeGreaterThan(10);
    const hueco = resumenPublico("no-existe", "Un título", "Libro 1", "es");
    expect(hueco).toEqual({ texto: "Un título. Pasaje Libro 1.", generado: true });
  });
});
