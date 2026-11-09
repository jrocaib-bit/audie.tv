import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const archivo = JSON.parse(readFileSync(path.resolve("content/tiempos/retos.json"), "utf8")) as {
  retos: {
    id: string;
    tiempo: string;
    obra: string | null;
    insignia: { es: string };
    companeros: { obra: string | null }[];
    pasos: { dia: number; libroId: string; capitulo: number; versiculo: number; versiculoFin: number; titulo: { es: string; en: string }; minutos: number; obra: string | null }[];
  }[];
};

describe("retos del tiempo", () => {
  it("guarda títulos propios y pasajes con rango, sin texto bíblico", () => {
    const texto = JSON.stringify(archivo);
    expect(texto).not.toMatch(/En el principio creó|Sagrada Biblia|leccionario/i);
    expect(archivo.retos.map((reto) => [reto.id, reto.pasos.length])).toEqual([
      ["adviento-isaias", 28],
      ["navidad-infancia", 12],
      ["cuaresma-40", 40],
      ["semana-santa-pasion", 8],
      ["pascua-hechos", 50],
      ["ordinario-evangelio", 16],
      ["ordinario-salmos", 16],
      ["ordinario-sabiduria", 10],
      ["ordinario-pablo", 12],
      ["maria", 9],
      ["pentecostes", 7],
    ]);
    for (const reto of archivo.retos) {
      expect(reto.obra === null || /^gn-\d{2}$/.test(reto.obra ?? "")).toBe(true);
      expect(reto.insignia.es.length).toBeGreaterThan(2);
      reto.pasos.forEach((paso, indice) => {
        expect(paso.dia).toBe(indice + 1);
        expect(paso.titulo.es.length).toBeGreaterThan(2);
        expect(paso.versiculoFin).toBeGreaterThanOrEqual(paso.versiculo);
        expect(paso.minutos).toBeGreaterThan(0);
        expect(paso.obra).toMatch(/^gn-\d{2}$/);
      });
      expect(reto.pasos.every((paso) => paso.versiculo === 1 && paso.versiculoFin === 1)).toBe(false);
    }
  });
});
