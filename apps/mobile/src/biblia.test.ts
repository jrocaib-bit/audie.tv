import { describe, expect, it } from "vitest";
import { librosDelIndice, messages, type CapituloIndice } from "@audite/domain";
import { detalleDeCapitulo, filtrarIndice, indiceBiblia } from "./biblia";

const libro = (id: string) => librosDelIndice(indiceBiblia).find((item) => item.id === id)!;
const capitulo = (id: string, n: number) => libro(id).capitulos.find((item) => item.n === n)!;

describe("índice de la Biblia en la app", () => {
  it("la búsqueda de Génesis deja un solo libro y su sección", () => {
    const resultado = filtrarIndice(indiceBiblia, "genesis", "todos");
    expect(resultado.map((testamento) => testamento.id)).toEqual(["at"]);
    expect(resultado[0]!.secciones.map((seccion) => seccion.libros.map((item) => item.id))).toEqual([["gn"]]);
    expect(filtrarIndice(indiceBiblia, "", "nt").flatMap((testamento) => testamento.secciones.flatMap((seccion) => seccion.libros))).toHaveLength(27);
    expect(filtrarIndice(indiceBiblia, "", "todos").flatMap((testamento) => testamento.secciones.flatMap((seccion) => seccion.libros))).toHaveLength(73);
    expect(filtrarIndice(indiceBiblia, "zzz", "todos")).toEqual([]);
  });

  it("Génesis 1 lleva a gn-01 y dice si se puede oír ya", () => {
    const detalle = detalleDeCapitulo(libro("gn"), capitulo("gn", 1), "es", new Set(["gn-01"]));
    expect(detalle.nombre).toBe("Génesis 1");
    expect(detalle.destinos).toEqual([{ id: "gn-01", titulo: "En el principio: la creación y el hombre", tramo: "Génesis 1 a 2", inicio: null, disponible: true }]);
    expect(detalleDeCapitulo(libro("gn"), capitulo("gn", 24), "en", new Set()).destinos[0]).toMatchObject({ id: "gn-09", disponible: false, inicio: null });
  });

  it("el salmo 10 lleva a sal-001 con la nota de la unión", () => {
    const detalle = detalleDeCapitulo(libro("sal"), capitulo("sal", 10), "es", new Set());
    expect(detalle.nombre).toBe("Salmo 10");
    expect(detalle.nota).toMatch(/une el salmo 9 y el 10/);
    expect(detalle.destinos.map((destino) => destino.id)).toEqual(["sal-001"]);
    expect(detalle.destinos[0]!.tramo).toBe("Salmos 1 a 9");
  });

  it("con un segundo en el índice muestra el minuto. Sin él, nada", () => {
    const conSegundo: CapituloIndice = { n: 2, episodios: [{ id: "gn-01", segundo: 251 }] };
    expect(detalleDeCapitulo(libro("gn"), conSegundo, "es", new Set()).destinos[0]!.inicio).toBe("4:11");
    const varios: CapituloIndice = { n: 2, episodios: [{ id: "gn-01" }, { id: "gn-02" }] };
    expect(detalleDeCapitulo(libro("gn"), varios, "es", new Set()).destinos.map((destino) => destino.id)).toEqual(["gn-01", "gn-02"]);
  });

  it("los textos de la pantalla no traen punto y coma ni rayas", () => {
    for (const idioma of [messages.es, messages.en]) {
      const propios = Object.entries(idioma).filter(([clave]) => clave.startsWith("bible"));
      expect(propios.length).toBeGreaterThan(10);
      for (const [clave, texto] of propios) expect(texto, clave).not.toMatch(/[;—–]|\bCEE\b/);
    }
    expect(messages.es.bibleLink).toBe("Ver la Biblia en orden");
    expect(messages.en.bibleLink).toBe("See the Bible in order");
    expect(messages.es.bibleTrial).toBe("Empieza 7 días gratis");
  });
});
