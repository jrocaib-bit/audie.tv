import { describe, expect, it } from "vitest";
import { agruparLibros, ordenarRetosEstacionales } from "./publico";

describe("catálogo y retos públicos", () => {
  it("agrupa los libros en orden canónico", () => {
    const grupos = agruparLibros([
      { id: "mt", testament: "nt", order: 47 },
      { id: "gn", testament: "ot", order: 1 },
      { id: "ex", testament: "ot", order: 2 },
      { id: "mc", testament: "nt", order: 48 },
    ]);
    expect(grupos.at.map((libro) => libro.id)).toEqual(["gn", "ex"]);
    expect(grupos.nt.map((libro) => libro.id)).toEqual(["mt", "mc"]);
  });

  it("pone primero el reto en curso o el siguiente", () => {
    const retos = [
      { id: "pascua-hechos", tiempo: "pascua" },
      { id: "adviento-isaias", tiempo: "adviento" },
      { id: "navidad-infancia", tiempo: "navidad" },
      { id: "ordinario-evangelio", tiempo: "ordinario" },
      { id: "cuaresma-40", tiempo: "cuaresma" },
    ];
    expect(ordenarRetosEstacionales(retos, "2026-11-11").map((reto) => reto.id)).toEqual([
      "adviento-isaias",
      "navidad-infancia",
      "cuaresma-40",
      "pascua-hechos",
    ]);
    expect(ordenarRetosEstacionales(retos, "2026-12-26")[0]?.id).toBe("navidad-infancia");
  });
});
