import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { coincideLibro, diasDeCalendario, palabras } from "./movimiento";

describe("movimiento", () => {
  it("parte el titular sin perder palabras y filtra libros", () => {
    expect(palabras("La Biblia, de principio a fin.")).toEqual(["La", "Biblia,", "de", "principio", "a", "fin."]);
    expect(coincideLibro("Éxodo", "")).toBe(true);
    expect(coincideLibro("Éxodo", "exo")).toBe(true);
    expect(coincideLibro("Levítico", "exo")).toBe(false);
    expect(diasDeCalendario(26)).toHaveLength(26);
    expect(diasDeCalendario(0)).toEqual([]);
  });

  it("deja la página quieta si el usuario pide menos movimiento", () => {
    const css = readFileSync(path.resolve("apps/web/src/app/movimiento.css"), "utf8");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("prefers-reduced-motion: no-preference");
    expect(css).not.toMatch(/webgl|shader/i);
  });
});
