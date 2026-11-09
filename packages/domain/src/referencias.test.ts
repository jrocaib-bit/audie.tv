import { describe, expect, it } from "vitest";
import { entrarReferencia, referenciasDe, volverReferencia, type ReferenciaCruzada } from "./referencias";
import { segundoDeCita } from "./time";
import dataset from "../../../content/referencias/openbible.json";

const lista = dataset.refs as ReferenciaCruzada[];

describe("referencias al margen", () => {
  it("lista pasajes relacionados y no trae notas de estudio", () => {
    const deGn = referenciasDe(lista, { libroId: "gn", capitulo: 1, versiculo: 1 });
    expect(deGn.length).toBeGreaterThan(0);
    expect(deGn[0]?.hacia).toEqual({ libroId: "gn", capitulo: 1, versiculo: 2 });
    expect(lista.every((item) => !("nota" in item) && !("comentario" in item))).toBe(true);
    expect(dataset.licencia).toBe("CC BY 4.0");
  });

  it("salta a la referencia y vuelve al punto anterior", () => {
    const ida = entrarReferencia([], { episodeId: "gn-01", segundo: 4, cita: "1:1" });
    const vuelta = volverReferencia(ida);
    expect(vuelta.marco?.segundo).toBe(4);
    expect(vuelta.pila).toEqual([]);
    expect(volverReferencia([]).marco).toBeNull();
  });

  it("sitúa un versículo del episodio en el audio", () => {
    const segundo = segundoDeCita("Génesis 1:1–2:25", "1:2", 56);
    expect(segundo).not.toBeNull();
    expect(segundo ?? 0).toBeGreaterThan(0);
    expect(segundoDeCita("Génesis 1:1–2:25", "50:1", 56)).toBeNull();
  });
});
