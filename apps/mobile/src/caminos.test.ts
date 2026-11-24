import { describe, expect, it } from "vitest";
import indice from "../../../content/canon/catalogo-indice.json";
import { CAMINOS, audioDeCamino, ordenarPorAudio, descripcionCamino, duracionEnDias, caminoPorId, caminosDisponibles, idsDeCamino, portadaDeCamino, progresoCamino, type Rango } from "./caminos";

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
  it("la duración son los días de un episodio al día", () => {
    expect(duracionEnDias(516, "es")).toBe("516 días");
    expect(duracionEnDias(1, "es")).toBe("1 día");
    expect(duracionEnDias(22, "en")).toBe("22 days");
    expect(duracionEnDias(idsDeCamino(caminoPorId("genesis", rangos), rangos).length, "es")).toBe("22 días");
  });
  it("cada camino tiene una descripción propia en ambos idiomas y sin referencias de obra", () => {
    for (const lang of ["es", "en"] as const) {
      const textos = CAMINOS.map((def) => descripcionCamino(def, lang));
      expect(new Set(textos).size).toBe(CAMINOS.length);
      for (const texto of textos) expect(texto).not.toMatch(/[;—–]/);
    }
    expect(descripcionCamino(caminoPorId("evangelios", rangos), "es")).toContain("Mateo, Marcos, Lucas y Juan");
  });
  it("distingue el catálogo del audio disponible", () => {
    const grabados = indice.episodes.map((e) => e.id);
    const por = (id: string) => audioDeCamino(idsDeCamino(caminoPorId(id, rangos), rangos), grabados);
    expect(por("genesis")).toMatchObject({ total: 22, conAudio: 22, estado: "todo" });
    expect(por("salmos")).toMatchObject({ total: 24, conAudio: 0, estado: "nada" });
    expect(por("evangelios").estado).toBe("parte");
    expect(por("biblia")).toMatchObject({ total: 516, conAudio: 79, estado: "parte" });
  });
  it("los caminos sin audio van al final y conservan su orden", () => {
    const grabados = indice.episodes.map((e) => e.id);
    const vistas = caminosDisponibles(rangos).map((def) => ({ id: def.id, audio: audioDeCamino(idsDeCamino(def, rangos), grabados) }));
    expect(ordenarPorAudio(vistas).map((v) => v.id)).toEqual(["biblia", "genesis", "evangelios", "salmos", "hechos", "apocalipsis"]);
    const mezclado = [vistas[3]!, vistas[0]!, vistas[4]!, vistas[1]!];
    expect(ordenarPorAudio(mezclado).map((v) => v.id)).toEqual(["biblia", "genesis", "salmos", "hechos"]);
  });
  it("un camino sin ningún episodio con audio no es elegible", () => {
    const grabados = indice.episodes.map((e) => e.id);
    const sinAudio = CAMINOS.filter((def) => audioDeCamino(idsDeCamino(def, rangos), grabados).estado === "nada").map((def) => def.id);
    expect(sinAudio).toEqual(["salmos", "hechos", "apocalipsis"]);
  });
});
