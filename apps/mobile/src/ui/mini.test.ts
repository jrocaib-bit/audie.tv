import { describe, expect, it } from "vitest";
import { RUTAS_PESTANAS, debeMostrarMini } from "./mini";

describe("debeMostrarMini", () => {
  it.each(["/reto/adviento-isaias", "/escuchar", "/escuchar/caminos", "/retos", "/sala", "/sala/libros", "/biblia", "/ajustes", "/creditos", "/", "/suscripcion"])("se ve en %s con un episodio cargado", (path) => {
    expect(debeMostrarMini({ path, cargado: true })).toBe(true);
  });
  it.each(["/ahora", "/bienvenida", "/cola", "/entrar", "/cuenta"])("no se ve en %s", (path) => {
    expect(debeMostrarMini({ path, cargado: true })).toBe(false);
  });
  it("no se ve sin nada cargado", () => {
    expect(debeMostrarMini({ path: "/escuchar/caminos", cargado: false })).toBe(false);
  });
  it("se oculta en el lector de libros", () => {
    expect(debeMostrarMini({ path: "/libros/gen-antes/leer", cargado: true })).toBe(false);
    expect(debeMostrarMini({ path: "/libros/gen-antes", cargado: true })).toBe(true);
  });
});

describe("RUTAS_PESTANAS", () => {
  it("son las rutas de las cuatro pestañas, sus segmentos y Ajustes", () => {
    expect(RUTAS_PESTANAS).toEqual(["/", "/escuchar", "/escuchar/caminos", "/retos", "/sala", "/sala/libros", "/ajustes"]);
  });
});
