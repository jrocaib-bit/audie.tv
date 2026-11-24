import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { destinosDeCapitulo, librosDelIndice, type Manifiesto } from "@audite/domain";
import { generarIndiceCapitulos, indiceCapitulos, libroDelIndice } from "./indice-capitulos";

const raiz = path.resolve(import.meta.dirname, "../../..");
const manifiesto = JSON.parse(readFileSync(path.join(raiz, "content/canon/01_canon/manifiesto.json"), "utf8")) as Manifiesto;
const commiteado = readFileSync(path.join(raiz, "content/canon/indice-capitulos.json"), "utf8");

function destinos(libro: string, capitulo: number): string[] {
  return destinosDeCapitulo(libroDelIndice(libro)!.capitulos.find((item) => item.n === capitulo)!).map((enlace) => enlace.id);
}

describe("content/canon/indice-capitulos.json", () => {
  it("coincide byte a byte con lo que genera el script desde el manifiesto del repo", () => {
    expect(generarIndiceCapitulos(manifiesto)).toBe(commiteado);
    expect(generarIndiceCapitulos(manifiesto)).toBe(generarIndiceCapitulos(structuredClone(manifiesto)));
  });

  it("73 libros, 1328 capítulos y 516 episodios", () => {
    const indice = indiceCapitulos();
    const libros = librosDelIndice(indice);
    expect(libros).toHaveLength(73);
    expect(libros.reduce((total, libro) => total + libro.capitulos.length, 0)).toBe(1328);
    expect(libros.reduce((total, libro) => total + libro.episodios.length, 0)).toBe(516);
    expect(indice.resumen).toEqual({ libros: 73, episodios: 516, capitulos: 1328, con_episodio: 1327, sin_rango_explicito: 1, varios_episodios: 0, con_segundo: 0 });
    expect(libros.map((libro) => libro.id)).toEqual(manifiesto.libros.map((libro) => libro.id));
    for (const libro of manifiesto.libros) expect(libroDelIndice(libro.id)?.capitulos_total, libro.id).toBe(libro.capitulos_total);
  });

  it("lleva cada capítulo a su episodio", () => {
    expect(destinos("gn", 1)).toEqual(["gn-01"]);
    expect(destinos("gn", 2)).toEqual(["gn-01"]);
    expect(destinos("gn", 24)).toEqual(["gn-09"]);
    expect(destinos("sal", 119)).toEqual(["sal-021"]);
    expect(destinos("ap", 22)).toHaveLength(1);
  });

  it("el salmo 10 se muestra, va unido al 9 y se escucha en sal-001", () => {
    const indice = indiceCapitulos();
    expect(indice.sin_rango).toHaveLength(1);
    expect(indice.sin_rango[0]).toMatchObject({ libro: "sal", capitulo: 10, episodio_unido: "sal-001", unido_con: 9 });
    expect(indice.sin_rango[0]?.nota?.es).toMatch(/salmo 9 y el 10/);
    const diez = libroDelIndice("sal")!.capitulos.find((capitulo) => capitulo.n === 10)!;
    expect(diez.unido).toMatchObject({ con: 9, episodio: "sal-001" });
    expect(destinos("sal", 10)).toEqual(["sal-001"]);
    expect(libroDelIndice("sal")!.capitulos).toHaveLength(150);
  });

  it("hoy no hay marcas de tiempo, así que ningún capítulo trae segundo", () => {
    expect(manifiesto.libros.some((libro) => libro.episodios.some((episodio) => episodio.tiempos))).toBe(false);
    expect(commiteado).not.toContain('"segundo"');
  });

  it("solo lleva metadatos y nada que parezca texto bíblico", () => {
    const permitidas = new Set([
      "version", "fuente", "manifiesto_version", "manifiesto_actualizado", "resumen", "libros", "episodios", "capitulos", "con_episodio",
      "sin_rango_explicito", "varios_episodios", "con_segundo", "sin_rango", "libro", "capitulo", "episodio_unido", "unido_con", "nota",
      "es", "en", "testamentos", "id", "titulo", "secciones", "orden", "testamento", "deuterocanonico", "capitulos_total", "desde", "hasta",
      "titulo_corto", "n", "unido", "con", "episodio", "segundo",
    ]);
    const claves = new Set<string>();
    const cadenas: string[] = [];
    const recorrer = (valor: unknown) => {
      if (typeof valor === "string") cadenas.push(valor);
      else if (Array.isArray(valor)) valor.forEach(recorrer);
      else if (valor && typeof valor === "object") {
        for (const [clave, hijo] of Object.entries(valor)) {
          claves.add(clave);
          recorrer(hijo);
        }
      }
    };
    recorrer(JSON.parse(commiteado));
    expect([...claves].filter((clave) => !permitidas.has(clave))).toEqual([]);
    expect(Math.max(...cadenas.map((cadena) => cadena.length))).toBeLessThan(120);
    expect(cadenas.filter((cadena) => /\d+[,:]\d+/.test(cadena) && !/^\d{4}-\d{2}-\d{2}T/.test(cadena))).toEqual([]);
    expect(commiteado).not.toMatch(/CEE|Conferencia Episcopal|pendientes|resumen":\s*\{"es"|master|texto/i);
  });
});
