import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const manifiesto = JSON.parse(readFileSync(path.resolve("content/canon/01_canon/manifiesto.json"), "utf8")) as {
  libros: { id: string; episodios: { id: string; capitulos?: string }[] }[];
};

function contiene(libroId: string, episodioId: string, capitulo: number): boolean {
  const episodio = manifiesto.libros.find((libro) => libro.id === libroId)?.episodios.find((item) => item.id === episodioId);
  if (!episodio?.capitulos) return false;
  const [inicio, fin] = episodio.capitulos.split("-").map(Number);
  return capitulo >= (inicio ?? 0) && capitulo <= (fin ?? inicio ?? 0);
}

const archivo = JSON.parse(readFileSync(path.resolve("content/tiempos/retos.json"), "utf8")) as {
  retos: {
    id: string;
    tiempo: string;
    obra: string | null;
    insignia: { es: string };
    companeros: { obra: string | null }[];
    pasos: { dia: number; libroId: string; capitulo: number; versiculo: number; versiculoFin: number; titulo: { es: string; en: string }; minutos: number; obra: string | null; episodio: string | null; ancla?: string }[];
  }[];
};

describe("retos del tiempo", () => {
  it("guarda títulos propios y pasajes con rango, sin texto bíblico", () => {
    const texto = JSON.stringify(archivo);
    expect(texto).not.toMatch(/En el principio creó|Sagrada Biblia|leccionario/i);
    expect(texto).not.toMatch(/Emmanuel/);
    expect(archivo.retos.map((reto) => [reto.id, reto.pasos.length])).toEqual([
      ["adviento-isaias", 28],
      ["navidad-infancia", 17],
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
        expect(paso.episodio).toMatch(/^[a-z0-9]+-\d{2,3}$/);
        expect(contiene(paso.libroId, paso.episodio ?? "", paso.capitulo)).toBe(true);
      });
      expect(reto.pasos.every((paso) => paso.versiculo === 1 && paso.versiculoFin === 1)).toBe(false);
    }
    const navidad = archivo.retos.find((reto) => reto.id === "navidad-infancia");
    expect(navidad?.pasos.map((paso) => [paso.dia, paso.ancla ?? "", paso.titulo.es, paso.episodio, paso.capitulo])).toEqual([
      [1, "", "Zacarías", "lc-01", 1],
      [2, "", "La anunciación", "lc-01", 1],
      [3, "", "La visitación", "lc-01", 1],
      [4, "", "El cántico de María", "lc-01", 1],
      [5, "", "El nombre de Juan", "lc-01", 1],
      [6, "", "El cántico de Zacarías", "lc-01", 1],
      [7, "", "El sueño de José", "mt-01", 1],
      [8, "", "Belén", "lc-02", 2],
      [9, "", "Los pastores", "lc-02", 2],
      [10, "", "La luz que vino al mundo", "jn-01", 1],
      [11, "", "Simeón y Ana", "lc-02", 2],
      [12, "", "El camino de Egipto", "mt-01", 2],
      [13, "01-06", "Una estrella en Oriente", "mt-01", 2],
      [14, "01-07", "Una voz en el desierto", "mt-02", 3],
      [15, "01-08", "En la casa de mi Padre", "lc-02", 2],
      [16, "01-09", "Las tinajas de Caná", "jn-01", 2],
      [17, "01-10", "Los cielos abiertos", "mt-02", 3],
    ]);
  });
});
