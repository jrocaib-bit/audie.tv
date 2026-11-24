import { describe, expect, it } from "vitest";
import { debeMostrarMini } from "./mini";

describe("debeMostrarMini", () => {
  it.each(["/reto/adviento-isaias", "/camino", "/retos", "/sala", "/biblioteca", "/libros", "/ajustes", "/creditos", "/", "/suscripcion"])("se ve en %s con un episodio cargado", (path) => {
    expect(debeMostrarMini({ path, cargado: true })).toBe(true);
  });
  it.each(["/ahora", "/bienvenida", "/cola", "/entrar", "/cuenta"])("no se ve en %s", (path) => {
    expect(debeMostrarMini({ path, cargado: true })).toBe(false);
  });
  it("no se ve sin nada cargado", () => {
    expect(debeMostrarMini({ path: "/camino", cargado: false })).toBe(false);
  });
  it("se oculta en el lector de libros", () => {
    expect(debeMostrarMini({ path: "/libros/gen-antes/leer", cargado: true })).toBe(false);
    expect(debeMostrarMini({ path: "/libros/gen-antes", cargado: true })).toBe(true);
  });
});
