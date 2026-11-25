import { describe, expect, it } from "vitest";
import { COLORES_SUBRAYADO, colorNormalizado, fondoSubrayado, listaDeMarcas, unirRangos } from "./subrayado";

describe("colores de subrayado", () => {
  it("son cuatro y el antiguo «oro» se pinta como amarillo", () => {
    expect(COLORES_SUBRAYADO).toEqual(["amarillo", "verde", "azul", "rosa"]);
    expect(colorNormalizado("oro")).toBe("amarillo");
    expect(colorNormalizado("rosa")).toBe("rosa");
    expect(colorNormalizado(undefined)).toBe("amarillo");
  });
  it("cada color tiene tono de día y de noche", () => {
    for (const c of COLORES_SUBRAYADO) expect(fondoSubrayado(c, true)).not.toBe(fondoSubrayado(c, false));
  });
  it("une dos frases en un rango", () => {
    expect(unirRangos({ inicio: 20, fin: 40 }, { inicio: 5, fin: 18 })).toEqual({ inicio: 5, fin: 40 });
  });
});

describe("listaDeMarcas", () => {
  it("ordena por fecha, recorta y resuelve el texto del subrayado", () => {
    const lista = listaDeMarcas(
      {
        marcadores: [{ id: "m", capitulo_id: "c1", bloque_id: null, created_at: "2026-11-01T00:00:00Z" }],
        subrayados: [{ id: "s", capitulo_id: "c1", bloque_id: "b1", inicio: 0, fin: 5, color: "verde", created_at: "2026-11-03T00:00:00Z" }],
        notas: [{ id: "n", capitulo_id: "c1", bloque_id: "b1", subrayado_id: "s", texto: "Una nota", created_at: "2026-11-02T00:00:00Z" }],
      },
      () => "Hola mundo",
    );
    expect(lista.map((m) => m.tipo)).toEqual(["subrayado", "nota", "marcador"]);
    expect(lista[0]?.texto).toBe("Hola");
    expect(lista[2]?.texto).toBe("Capítulo marcado");
  });
});
