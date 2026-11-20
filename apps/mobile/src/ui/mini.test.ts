import { describe, expect, it } from "vitest";
import { debeMostrarMini } from "./mini";

describe("debeMostrarMini", () => {
  it.each(["/reto/adviento-isaias", "/camino", "/retos", "/sala", "/biblioteca", "/ajustes", "/creditos", "/", "/suscripcion"])("se ve en %s con un episodio cargado", (path) => {
    expect(debeMostrarMini({ path, cargado: true })).toBe(true);
  });
  it.each(["/ahora", "/bienvenida", "/cola", "/entrar", "/cuenta"])("no se ve en %s", (path) => {
    expect(debeMostrarMini({ path, cargado: true })).toBe(false);
  });
  it("no se ve sin nada cargado", () => {
    expect(debeMostrarMini({ path: "/camino", cargado: false })).toBe(false);
  });
});
