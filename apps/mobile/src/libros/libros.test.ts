import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { cortarLibro, recomendarLibros, type LibroParaRecomendar, type LibroTexto } from "@audite/domain";
import { mockDeDesarrollo, rutaDeRecomendacion } from "./config";
import { partirEnFrases } from "./frases";

const bloque = (id: string, texto: string) => ({ id, tipo: "parrafo" as const, texto, html: texto, referencias: [] });
const libro: LibroTexto = {
  id: "x", titulo: "X", subtitulo: "x", idioma: "es", libro_biblico: "Génesis", libro_id: "gn", adelanto_hasta_capitulo_id: "prologo",
  capitulos: [
    { id: "prologo", tipo: "prologo", orden: 0, numero: null, titulo: "Entrada", es_adelanto: true, bloques: [bloque("p1", "ABIERTO")] },
    { id: "capitulo-01", tipo: "capitulo", orden: 1, numero: 1, titulo: "Primero", es_adelanto: false, bloques: [bloque("c1", "SOLO_PREMIUM_APP")] },
  ],
};

describe("corte en la app", () => {
  it("sin premium la app solo recibe el prólogo, con índice de títulos", () => {
    const corte = cortarLibro(libro, false);
    expect(corte.capitulos.map((c) => c.id)).toEqual(["prologo"]);
    expect(corte.indice.map((e) => e.titulo)).toEqual(["Entrada", "Primero"]);
    expect(JSON.stringify(corte)).not.toContain("SOLO_PREMIUM_APP");
    expect(cortarLibro(libro, true).capitulos).toHaveLength(2);
  });
});

describe("recomendaciones en la app", () => {
  const c = (id: string, volumen: number, libro_id: string, disponibilidad: LibroParaRecomendar["disponibilidad"], cruces: string[] = []): LibroParaRecomendar => ({
    id, titulo: id, subtitulo: "", volumen, libro_id, disponibilidad, episodios_del_libro_comentado: [], episodios_cruzados: cruces.map((episodio_id) => ({ episodio_id })),
  });
  it("prioriza el volumen propio, limita a 3 y no ofrece borradores", () => {
    const catalogo = [c("jn", 3, "jn", "lectura", ["gn-01"]), c("gn", 1, "gn", "lectura"), c("rut", 16, "rut", "borrador", ["gn-01"]), c("is", 4, "is", "lectura", ["gn-01"]), c("sal", 5, "sal", "lectura", ["gn-01"])];
    const r = recomendarLibros("gn-01", catalogo);
    expect(r.map((x) => x.id)).toEqual(["gn", "jn", "is"]);
    expect(r.some((x) => x.id === "rut")).toBe(false);
  });
  it("la ruta abre el capítulo que cita el episodio, o el adelanto", () => {
    expect(rutaDeRecomendacion({ id: "gen", capitulo_id: "capitulo-03" })).toBe("/libros/gen/leer?c=capitulo-03");
    expect(rutaDeRecomendacion({ id: "gen", capitulo_id: "prologo" })).toBe("/libros/gen/leer");
    expect(rutaDeRecomendacion({ id: "gen" })).toBe("/libros/gen/leer");
  });
});

describe("mock de desarrollo", () => {
  it("solo funciona en desarrollo", () => {
    expect(mockDeDesarrollo("premium", true)).toBe("premium");
    expect(mockDeDesarrollo("premium", false)).toBeNull();
    expect(mockDeDesarrollo("otro", true)).toBeNull();
  });
});

describe("frases", () => {
  it("conserva todos los caracteres y da el desplazamiento de cada una", () => {
    const t = "Una frase. Otra, con coma. ¿Y esta?";
    const partes = partirEnFrases(t);
    expect(partes.map((p) => p.texto).join("")).toBe(t);
    expect(partes.every((p) => t.slice(p.inicio, p.inicio + p.texto.length) === p.texto)).toBe(true);
    expect(partes).toHaveLength(3);
  });
});

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    if (nombre === "node_modules" || nombre.startsWith(".")) return [];
    const ruta = path.join(dir, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

describe("Apple 3.1.3 y política de pagos de Play", () => {
  const raiz = path.resolve(import.meta.dirname, "../..");
  const codigo = archivos(raiz).filter((f) => /\.(tsx?|jsx?|json|js)$/.test(f) && !/\.test\.ts$/.test(f) && !f.endsWith("package-lock.json"));
  it("no hay Kindle ni amazon_kindle en el código de la app", () => {
    expect(codigo.length).toBeGreaterThan(10);
    for (const archivo of codigo) {
      const texto = readFileSync(archivo, "utf8");
      expect(texto, archivo).not.toMatch(/kindle/i);
      expect(texto, archivo).not.toContain("amazon_kindle");
    }
  });
  it("el código compartido que usa la app tampoco expone un campo de Kindle", () => {
    const dominio = path.resolve(raiz, "../../packages/domain/src");
    for (const nombre of ["libros.ts", "libros-cliente.ts"]) expect(readFileSync(path.join(dominio, nombre), "utf8")).not.toContain("amazon_kindle");
  });
  it("no hay libros en el bundle: ni JSON de manuscritos ni el texto de prueba", () => {
    expect(archivos(raiz).filter((f) => /^libros?.*\.json$/.test(path.basename(f)))).toEqual([]);
  });
});
