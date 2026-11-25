import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { indiceDe } from "@audite/domain";
import { cargarCatalogo, cargarFicha, cargarTexto, hayTexto, indiceDeEstructura, rutasDeTexto } from "./carga";
import { leerJsonLibros, listarTextos, vaciarCacheAlmacen } from "./almacen";

const FIXTURES = path.resolve(import.meta.dirname, "fixtures");

afterEach(() => {
  vi.unstubAllEnvs();
  vaciarCacheAlmacen();
});

describe("catálogo barato", () => {
  it("lista los textos existentes sin leerlos", async () => {
    vi.stubEnv("AUDITE_LIBROS_RUTA", FIXTURES);
    const lista = await listarTextos();
    expect(lista).not.toBeNull();
    expect(hayTexto("libro-prueba", lista!)).toBe(true);
    expect(hayTexto("completo-sin-texto", lista!)).toBe(false);
  });

  it("rutas de texto del volumen 1 incluyen el archivo de prueba", () => {
    expect(rutasDeTexto("gen-antes-de-que-hubiera-manana")).toContain("prueba/antes-de-que-hubiera-manana.json");
  });

  it("disponibilidad del catálogo igual a la que da la ficha exacta", async () => {
    vi.stubEnv("AUDITE_LIBROS_RUTA", FIXTURES);
    for (const f of await cargarCatalogo()) {
      const exacta = await cargarFicha(f.id);
      expect(exacta?.disponibilidad).toBe(f.disponibilidad);
      expect(exacta?.indice.map((e) => e.id)).toEqual(f.indice.map((e) => e.id));
    }
  });

  it("el índice por estructura coincide con el del texto en los datos de prueba", async () => {
    vi.stubEnv("AUDITE_LIBROS_RUTA", FIXTURES);
    const dato = (await leerJsonLibros("libros.json")) as { libros: { id: string; estructura_capitulos?: never[] }[] };
    const bruto = dato.libros.find((l) => l.id === "libro-prueba")!;
    const texto = (await cargarTexto("libro-prueba"))!;
    const porEstructura = indiceDeEstructura(bruto.estructura_capitulos, texto.adelanto_hasta_capitulo_id ?? "prologo");
    expect(porEstructura.map((e) => [e.id, e.tipo, e.es_adelanto])).toEqual(indiceDe(texto).map((e) => [e.id, e.tipo, e.es_adelanto]));
  });
});
