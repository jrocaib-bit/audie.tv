import { describe, expect, it } from "vitest";
import { debeMostrarMini } from "./mini";

const ok = { cargado: true, empezado: true, repetido: false };

describe("debeMostrarMini", () => {
  it.each(["/reto/adviento-isaias", "/camino", "/biblioteca", "/creditos", "/", "/suscripcion", "/cuenta"])("se ve en %s", (path) => {
    expect(debeMostrarMini({ path, ...ok })).toBe(true);
  });
  it.each(["/ahora", "/bienvenida", "/cola"])("no se ve en %s", (path) => {
    expect(debeMostrarMini({ path, ...ok })).toBe(false);
  });
  it("no se ve sin nada cargado ni empezado", () => {
    expect(debeMostrarMini({ path: "/camino", ...ok, cargado: false })).toBe(false);
    expect(debeMostrarMini({ path: "/camino", ...ok, empezado: false })).toBe(false);
  });
  it("no se repite en Hoy", () => {
    expect(debeMostrarMini({ path: "/", ...ok, repetido: true })).toBe(false);
  });
});
