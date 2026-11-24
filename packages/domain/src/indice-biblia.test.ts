import { describe, expect, it } from "vitest";
import {
  SECCIONES_CANONICAS,
  construirIndice,
  destinosDeCapitulo,
  episodioDelLibro,
  hrefDeCapitulo,
  libroCoincide,
  librosDelIndice,
  nombreDeCapitulo,
  rotuloTramo,
  tramoDeCapitulos,
} from "./indice-biblia";
import type { EpisodioManifiesto, LibroManifiesto, Manifiesto } from "./manifiesto";

function episodio(id: string, orden: number, capitulos: string, extra: Partial<EpisodioManifiesto> = {}): EpisodioManifiesto {
  return { id, orden, capitulos, titulo: { es: `Título ${id}`, en: `Title ${id}` }, idiomas: { es: { estado: "pendiente" } }, ...extra };
}

/** Manifiesto sintético con los 73 libros. Cada libro tiene un capítulo y un episodio salvo los que se sobrescriben. */
function fixture(sobre: Record<string, Partial<LibroManifiesto>> = {}): Manifiesto {
  const libros = SECCIONES_CANONICAS.flatMap((seccion) => seccion.libros.map((id) => ({ id, testamento: seccion.testamento === "nt" ? "NT" : "AT" }) as const)).map(
    ({ id, testamento }, indice): LibroManifiesto => ({
      id,
      orden: indice + 1,
      testamento,
      capitulos_total: 1,
      titulo: { es: `Libro ${id}`, en: `Book ${id}` },
      episodios: [episodio(id === "sal" ? "sal-001" : `${id}-01`, 1, "1")],
      ...sobre[id],
    }),
  );
  return { version: 1, actualizado: "2026-01-01T00:00:00+01:00", idiomas: ["es", "en"], libros };
}

describe("índice canónico de la Biblia", () => {
  it("lee capítulos sueltos, tramos y, en su defecto, el rango", () => {
    expect(tramoDeCapitulos("1-2")).toEqual({ desde: 1, hasta: 2 });
    expect(tramoDeCapitulos("24")).toEqual({ desde: 24, hasta: 24 });
    expect(tramoDeCapitulos("119")).toEqual({ desde: 119, hasta: 119 });
    expect(tramoDeCapitulos(undefined, "3:1-5:32")).toEqual({ desde: 3, hasta: 5 });
    expect(tramoDeCapitulos("5-3")).toBeNull();
    expect(tramoDeCapitulos("x")).toBeNull();
  });

  it("las secciones cubren 73 libros sin repetir ninguno", () => {
    const ids = SECCIONES_CANONICAS.flatMap((seccion) => seccion.libros);
    expect(ids).toHaveLength(73);
    expect(new Set(ids).size).toBe(73);
    expect(SECCIONES_CANONICAS.map((seccion) => seccion.id)).toEqual(["pentateuco", "historicos", "sapienciales", "profeticos", "evangelios", "hechos", "pablo", "hebreos", "catolicas", "apocalipsis"]);
  });

  it("un capítulo que comparten dos episodios lista los dos", () => {
    const indice = construirIndice(
      fixture({ gn: { capitulos_total: 3, episodios: [episodio("gn-01", 1, "1-2", { rango: "1:1-2:10" }), episodio("gn-02", 2, "2-3", { rango: "2:11-3:24" })] } }),
    );
    const gn = librosDelIndice(indice).find((libro) => libro.id === "gn")!;
    expect(gn.capitulos.map((capitulo) => capitulo.episodios.map((enlace) => enlace.id))).toEqual([["gn-01"], ["gn-01", "gn-02"], ["gn-02"]]);
    expect(indice.resumen.varios_episodios).toBe(1);
  });

  it("un capítulo unido por la edición apunta al episodio del capítulo con el que va", () => {
    const indice = construirIndice(fixture({ sal: { capitulos_total: 11, episodios: [episodio("sal-001", 1, "1-9"), episodio("sal-002", 2, "11")] } }));
    const sal = librosDelIndice(indice).find((libro) => libro.id === "sal")!;
    const diez = sal.capitulos.find((capitulo) => capitulo.n === 10)!;
    expect(diez.episodios).toEqual([]);
    expect(diez.unido?.episodio).toBe("sal-001");
    expect(diez.unido?.con).toBe(9);
    expect(destinosDeCapitulo(diez)).toEqual([{ id: "sal-001" }]);
    expect(indice.sin_rango).toEqual([expect.objectContaining({ libro: "sal", capitulo: 10, episodio_unido: "sal-001", unido_con: 9 })]);
  });

  it("un hueco sin unión queda listado y sin destino", () => {
    const indice = construirIndice(fixture({ gn: { capitulos_total: 2 } }));
    const gn = librosDelIndice(indice).find((libro) => libro.id === "gn")!;
    expect(destinosDeCapitulo(gn.capitulos[1]!)).toEqual([]);
    expect(indice.sin_rango).toEqual([{ libro: "gn", capitulo: 2, episodio_unido: null, unido_con: null, nota: null }]);
  });

  it("sin tiempos no hay segundo. Con tiempos el capítulo recibe su segundo de entrada", () => {
    const sinTiempos = construirIndice(fixture({ gn: { capitulos_total: 2, episodios: [episodio("gn-01", 1, "1-2")] } }));
    expect(JSON.stringify(sinTiempos)).not.toContain('"segundo"');
    const conTiempos = construirIndice(
      fixture({
        gn: {
          capitulos_total: 2,
          episodios: [
            episodio("gn-01", 1, "1-2", {
              tiempos: [
                { capitulo: 1, versiculo: 1, inicio: 0, fin: 9 },
                { capitulo: 2, versiculo: 1, inicio: 251.4, fin: 260 },
              ],
            }),
          ],
        },
      }),
    );
    const gn = librosDelIndice(conTiempos).find((libro) => libro.id === "gn")!;
    expect(gn.capitulos[0]?.episodios).toEqual([{ id: "gn-01", segundo: 0 }]);
    expect(gn.capitulos[1]?.episodios).toEqual([{ id: "gn-01", segundo: 251.4 }]);
    expect(hrefDeCapitulo("es", gn.capitulos[1]!.episodios[0]!)).toBe("/es/oir/gn-01?t=251");
    expect(conTiempos.resumen.con_segundo).toBe(2);
  });

  it("el enlace no lleva ?t= si no hay marca", () => {
    expect(hrefDeCapitulo("es", { id: "gn-01" })).toBe("/es/oir/gn-01");
    expect(hrefDeCapitulo("en", { id: "sal-021" })).toBe("/en/oir/sal-021");
  });

  it("falla si el manifiesto trae un libro sin sección", () => {
    const base = fixture();
    base.libros.push({ id: "xx", orden: 99, testamento: "AT", episodios: [] });
    expect(() => construirIndice(base)).toThrow(/xx/);
  });

  it("rotula tramos sin rayas", () => {
    expect(rotuloTramo("Génesis", 1, 2, "es")).toBe("Génesis 1 a 2");
    expect(rotuloTramo("Genesis", 1, 2, "en")).toBe("Genesis 1 to 2");
    expect(rotuloTramo("Salmos", 119, 119, "es")).toBe("Salmos 119");
  });

  it("busca libros por nombre, sin tildes, en los dos idiomas y por sigla", () => {
    const gn = { id: "gn", titulo: { es: "Génesis", en: "Genesis" } };
    const sam = { id: "1sam", titulo: { es: "1 Samuel", en: "1 Samuel" } };
    expect(libroCoincide(gn, "genesis")).toBe(true);
    expect(libroCoincide(gn, "  GÉN ")).toBe(true);
    expect(libroCoincide(gn, "gn")).toBe(true);
    expect(libroCoincide(gn, "éxodo")).toBe(false);
    expect(libroCoincide(sam, "1 sam")).toBe(true);
    expect(libroCoincide(gn, "")).toBe(true);
  });

  it("nombra el capítulo y el salmo en singular", () => {
    const gn = { id: "gn", titulo: { es: "Génesis", en: "Genesis" } };
    const sal = { id: "sal", titulo: { es: "Salmos", en: "Psalms" } };
    expect(nombreDeCapitulo(gn, 1, "es")).toBe("Génesis 1");
    expect(nombreDeCapitulo(gn, 1, "en")).toBe("Genesis 1");
    expect(nombreDeCapitulo(sal, 10, "es")).toBe("Salmo 10");
    expect(nombreDeCapitulo(sal, 23, "en")).toBe("Psalm 23");
    const libro = librosDelIndice(construirIndice(fixture())).find((item) => item.id === "gn")!;
    expect(episodioDelLibro(libro, "gn-01")?.titulo.es).toBe("Título gn-01");
    expect(episodioDelLibro(libro, "gn-99")).toBeNull();
  });
});
