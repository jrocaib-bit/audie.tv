import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const archivo = JSON.parse(readFileSync(path.resolve("content/tiempos/retos.json"), "utf8")) as {
  retos: { id: string; tiempo: string; titulo: { es: string }; pasos: { dia: number; libroId: string; capitulo: number; versiculo: number; cita: string; obra: string | null }[] }[];
};

describe("retos del tiempo", () => {
  it("solo guarda referencias y un hueco de obra, sin texto bíblico", () => {
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
      reto.pasos.forEach((paso, indice) => {
        expect(paso.dia).toBe(indice + 1);
        expect(paso.cita).toBe(`${paso.cita.split(" ")[0]} ${paso.capitulo},${paso.versiculo}`);
        expect(paso.libroId).toMatch(/^[a-z]+$/);
        expect(paso.obra).toMatch(/^gn-\d{2}$/);
        expect(Object.keys(paso).sort()).toEqual(["capitulo", "cita", "dia", "libroId", "obra", "versiculo"]);
      });
    }
  });
});
