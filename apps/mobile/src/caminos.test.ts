import { describe, expect, it } from "vitest";
import indice from "../../../content/canon/catalogo-indice.json";
import { CAMINOS, caminoPorId, caminosDisponibles, idsDeCamino, portadaDeCamino, progresoCamino, type Rango } from "./caminos";

const rangos = indice.rangos as Rango[];

describe("caminos", () => {
  it("la Biblia entera son todos los episodios", () => {
    expect(idsDeCamino(CAMINOS[0]!, rangos)).toHaveLength(rangos.length);
    expect(rangos.length).toBe(516);
  });
  it("todos los caminos existen en el catálogo y llevan una obra distinta", () => {
    const lista = caminosDisponibles(rangos);
    expect(lista).toHaveLength(CAMINOS.length);
    const portadas = lista.map(portadaDeCamino);
    expect(portadas.every(Boolean)).toBe(true);
    expect(new Set(portadas).size).toBe(portadas.length);
  });
  it("calcula el avance y el siguiente episodio", () => {
    const ids = idsDeCamino(caminoPorId("genesis", rangos), rangos);
    const p = progresoCamino(ids, { episodes: { "gn-01": { completed: true }, "gn-02": { completed: true }, "gn-03": { completed: false } } });
    expect(p).toMatchObject({ total: ids.length, hechos: 2, siguiente: "gn-03" });
    expect(p.fraccion).toBeCloseTo(2 / ids.length);
    expect(progresoCamino([], { episodes: {} })).toEqual({ total: 0, hechos: 0, fraccion: 0, siguiente: null });
  });
  it("un camino desconocido cae en la Biblia", () => {
    expect(caminoPorId("nada", rangos).id).toBe("biblia");
  });
});
