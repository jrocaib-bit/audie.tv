import { describe, expect, it } from "vitest";
import { parseAjustes, temaEfectivo } from "./ajustes";

describe("ajustes del lector", () => {
  it("lee los ajustes antiguos sin perder nada", () => {
    expect(parseAjustes({ tam: 2, noche: true })).toEqual({ tam: 2, noche: true, tema: null, modo: "paginas" });
  });
  it("valida tema, modo y tamaño", () => {
    expect(parseAjustes({ tam: 9, tema: "azul", modo: "raro" })).toEqual({ tam: 1, noche: null, tema: null, modo: "paginas" });
    expect(parseAjustes({ tam: 3, tema: "sepia", modo: "scroll" })).toMatchObject({ tam: 3, tema: "sepia", modo: "scroll" });
    expect(parseAjustes(null).tam).toBe(1);
  });
  it("el tema elegido manda sobre el antiguo y sobre el de la app", () => {
    expect(temaEfectivo({ tema: "sepia", noche: true }, true)).toBe("sepia");
    expect(temaEfectivo({ tema: null, noche: false }, true)).toBe("dia");
    expect(temaEfectivo({ tema: null, noche: null }, true)).toBe("noche");
    expect(temaEfectivo({ tema: null, noche: null }, false)).toBe("dia");
  });
});
