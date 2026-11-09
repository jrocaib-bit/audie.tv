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
      ["adviento-isaias", 24],
      ["navidad-infancia", 12],
      ["cuaresma-40", 40],
      ["semana-santa-pasion", 8],
      ["pascua-hechos", 50],
      ["ordinario-evangelio", 16],
    ]);
    for (const reto of archivo.retos) {
      expect(reto.obra).toMatch(/^gn-\d{2}$/);
      expect(reto.insignia.es.length).toBeGreaterThan(2);
      const portada = [reto.obra, reto.pasos[0]?.obra, ...reto.companeros.map((item) => item.obra)];
      expect(new Set(portada).size).toBe(portada.length);
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
