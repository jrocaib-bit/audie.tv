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
    expect(archivo.retos.map((reto) => [reto.id, reto.pasos.length])).toEqual([
      ["adviento-isaias", 26],
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
    const adviento = archivo.retos.find((reto) => reto.id === "adviento-isaias");
    expect(adviento?.pasos.map((paso) => [paso.dia, paso.ancla ?? "", paso.titulo.es, paso.episodio, `${paso.capitulo},${paso.versiculo}-${paso.versiculoFin}`])).toEqual([
      [1, "", "La montaña", "is-01", "2,1-5"],
      [2, "", "Aquí estoy", "is-02", "6,1-8"],
      [3, "", "El Enmanuel", "is-02", "7,10-14"],
      [4, "", "Un niño", "is-03", "9,1-6"],
      [5, "", "El retoño", "is-04", "11,1-9"],
      [6, "", "El cántico", "is-04", "12,1-6"],
      [7, "", "El banquete", "is-07", "25,6-9"],
      [8, "", "Ciudad fuerte", "is-07", "26,1-6"],
      [9, "", "El desierto florece", "is-09", "35,1-10"],
      [10, "", "Preparad el camino", "is-11", "40,1-11"],
      [11, "", "Los que esperan", "is-11", "40,27-31"],
      [12, "", "No temas", "is-11", "41,8-13"],
      [13, "", "El siervo", "is-12", "42,1-7"],
      [14, "", "Yo te redimí", "is-12", "43,1-7"],
      [15, "", "Luz de las naciones", "is-14", "49,1-6"],
      [16, "", "Qué hermosos los pies", "is-15", "52,7-10"],
      [17, "", "El siervo herido", "is-15", "53,1-12"],
      [18, "", "Ensancha la tienda", "is-16", "54,1-10"],
      [19, "", "Venid a las aguas", "is-16", "55,1-11"],
      [20, "", "El ayuno", "is-17", "58,6-12"],
      [21, "", "Levántate", "is-17", "60,1-6"],
      [22, "", "El espíritu", "is-18", "61,1-4"],
      [23, "", "No callaré", "is-18", "62,1-5"],
      [24, "", "Alegraos", "is-19", "66,10-14"],
      [25, "12-23", "Un rey justo", "is-09", "32,1-4"],
      [26, "12-24", "Mira a tu salvador", "is-18", "62,10-12"],
    ]);
    expect(adviento?.pasos[2]?.titulo).toEqual({ es: "El Enmanuel", en: "Emmanuel" });
    expect(adviento?.pasos[24]?.titulo.es).toBe("Un rey justo");
    expect(adviento?.pasos[25]?.titulo.es).toBe("Mira a tu salvador");
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
