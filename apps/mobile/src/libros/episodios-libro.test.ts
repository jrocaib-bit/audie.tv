import type { Episode, PendingEpisode } from "@audite/domain";
import { describe, expect, it } from "vitest";
import { audiosDelLibro, idDeLibroBiblico } from "./episodios-libro";

const books = [
  { id: "gn", name: { es: "Génesis", en: "Genesis" } },
  { id: "jn", name: { es: "Juan", en: "John" } },
];
const pend = (id: string, bookId: string, orden: number): PendingEpisode => ({ id, bookId, orden, capitulos: null, rango: null, titulo: { es: id, en: null }, tituloCorto: { es: id, en: null }, etiqueta: { es: id, en: null }, propuesta: false, presentacion: "revision" });
const grab = (id: string, bookId: string) => ({ id, bookId }) as Episode;

describe("idDeLibroBiblico", () => {
  it("por id, por nombre con o sin acentos y en inglés", () => {
    expect(idDeLibroBiblico(books, { libro_id: "jn" })).toBe("jn");
    expect(idDeLibroBiblico(books, { nombre: "genesis" })).toBe("gn");
    expect(idDeLibroBiblico(books, { nombre: "Génesis" })).toBe("gn");
    expect(idDeLibroBiblico(books, { nombre: "John" })).toBe("jn");
    expect(idDeLibroBiblico(books, { nombre: "Rut" })).toBeNull();
    expect(idDeLibroBiblico(books, {})).toBeNull();
  });
});

describe("audiosDelLibro", () => {
  const pendientes = [pend("gn-03", "gn", 3), pend("gn-01", "gn", 1), pend("gn-02", "gn", 2), pend("jn-01", "jn", 1)];
  it("solo salen los episodios del libro, en su orden", () => {
    const filas = audiosDelLibro({ bookId: "gn", pendientes, grabados: [grab("gn-01", "gn"), grab("gn-02", "gn"), grab("gn-03", "gn")], destacados: [] });
    expect(filas.map((f) => f.id)).toEqual(["gn-01", "gn-02", "gn-03"]);
  });
  it("los destacados van primero, en el orden de la estantería", () => {
    const filas = audiosDelLibro({ bookId: "gn", pendientes, grabados: [grab("gn-01", "gn"), grab("gn-02", "gn"), grab("gn-03", "gn")], destacados: [{ episodio_id: "gn-03" }, { episodio_id: "gn-02" }] });
    expect(filas.map((f) => f.id)).toEqual(["gn-03", "gn-02", "gn-01"]);
    expect(filas[0]?.destacado).toBe(true);
    expect(filas[2]?.destacado).toBe(false);
  });
  it("los episodios sin grabar quedan al final de su grupo", () => {
    const filas = audiosDelLibro({ bookId: "gn", pendientes, grabados: [grab("gn-02", "gn")], destacados: [] });
    expect(filas.map((f) => f.id)).toEqual(["gn-02", "gn-01", "gn-03"]);
    expect(filas[0]?.grabado).not.toBeNull();
  });
  it("incluye grabados que no figuran entre los pendientes", () => {
    const filas = audiosDelLibro({ bookId: "jn", pendientes: [], grabados: [grab("jn-09", "jn"), grab("gn-01", "gn")], destacados: [] });
    expect(filas.map((f) => f.id)).toEqual(["jn-09"]);
  });
});
