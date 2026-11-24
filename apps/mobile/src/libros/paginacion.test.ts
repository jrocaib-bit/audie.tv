import { describe, expect, it } from "vitest";
import { claveMedida, estimarLineas, paginar, paginaDeBloque, planDeLibro, rotuloPagina, type BloqueMedido } from "./paginacion";

const p = (id: string, lineas: number, extra: Partial<BloqueMedido> = {}): BloqueMedido => ({ id, lineas, altoLinea: 10, antes: 10, ...extra });
const lineasDe = (paginas: ReturnType<typeof paginar>) => paginas.map((pg) => pg.fragmentos.map((f) => `${f.bloque}:${f.desde}-${f.hasta}`).join(" "));

describe("paginar", () => {
  it("reparte bloques enteros mientras caben", () => {
    // Página de 100 px: bloque 0 ocupa 40, bloque 1 suma 10+30.
    expect(lineasDe(paginar([p("a", 4), p("b", 3), p("c", 5)], 100))).toEqual(["0:0-4 1:0-3", "2:0-5"]);
  });
  it("parte un bloque largo por líneas y no deja líneas sueltas", () => {
    const paginas = paginar([p("a", 25)], 100);
    expect(lineasDe(paginas)).toEqual(["0:0-10", "0:10-20", "0:20-25"]);
    const huerfana = paginar([p("a", 11)], 100);
    expect(lineasDe(huerfana)).toEqual(["0:0-9", "0:9-11"]);
  });
  it("no deja una sola línea al final de la página", () => {
    // Quedan 15 px tras el primer bloque: cabría una línea y el bloque pasa entero a la página siguiente.
    expect(lineasDe(paginar([p("a", 8), p("b", 6)], 100))).toEqual(["0:0-8", "1:0-6"]);
  });
  it("el subtítulo no queda solo al final de una página", () => {
    const paginas = paginar([p("a", 8), p("sub", 1, { conSiguiente: true, antes: 20 }), p("b", 6)], 100);
    expect(lineasDe(paginas)).toEqual(["0:0-8", "1:0-1 2:0-6"]);
  });
  it("una cabecera indivisible pasa entera a la página siguiente", () => {
    const paginas = paginar([p("a", 6), p("cab", 1, { altoLinea: 60, indivisible: true })], 100);
    expect(lineasDe(paginas)).toEqual(["0:0-6", "1:0-1"]);
  });
  it("ningún bloque pierde líneas", () => {
    const bloques = [p("a", 13), p("b", 1), p("c", 31), p("d", 4)];
    const paginas = paginar(bloques, 130);
    const total = paginas.flatMap((pg) => pg.fragmentos).reduce((n, f) => n + (f.hasta - f.desde), 0);
    expect(total).toBe(49);
    for (const pg of paginas) {
      const alto = pg.fragmentos.reduce((n, f, i) => n + (i === 0 ? 0 : bloques[f.bloque]!.antes) + (f.hasta - f.desde) * 10, 0);
      expect(alto).toBeLessThanOrEqual(130);
    }
  });
  it("tamaño de letra mayor da más páginas", () => {
    const chico = paginar([p("a", 40)], 100).length;
    const grande = paginar([p("a", 60)], 100).length;
    expect(grande).toBeGreaterThan(chico);
  });
  it("sin bloques no hay páginas", () => {
    expect(paginar([], 100)).toEqual([]);
  });
});

describe("estimarLineas", () => {
  it("cuenta líneas por palabras y respeta los saltos", () => {
    expect(estimarLineas("uno dos", 400, 16)).toBe(1);
    expect(estimarLineas("a\nb", 400, 16)).toBe(2);
    const largo = Array.from({ length: 60 }, () => "palabra").join(" ");
    expect(estimarLineas(largo, 320, 16)).toBeGreaterThan(8);
  });
  it("más ancho, menos líneas", () => {
    const t = Array.from({ length: 80 }, () => "serena").join(" ");
    expect(estimarLineas(t, 600, 18)).toBeLessThan(estimarLineas(t, 300, 18));
  });
});

describe("plan del libro", () => {
  it("numera las páginas de capítulo en capítulo", () => {
    expect(planDeLibro([{ id: "prologo", paginas: 3 }, { id: "capitulo-01", paginas: 10 }])).toEqual({ inicios: { prologo: 1, "capitulo-01": 4 }, total: 13 });
  });
  it("encuentra la página de un bloque", () => {
    const paginas = paginar([p("a", 8), p("b", 6)], 100);
    expect(paginaDeBloque(paginas, 1)).toBe(1);
    expect(paginaDeBloque(paginas, 7)).toBe(-1);
  });
  it("la clave de medida cambia con el tamaño y el ancho", () => {
    expect(claveMedida("gn", "prologo", 1, 330.4)).not.toBe(claveMedida("gn", "prologo", 2, 330.4));
    expect(claveMedida("gn", "prologo", 1, 330.4)).not.toBe(claveMedida("gn", "prologo", 1, 360));
  });
  it("el rótulo va en español", () => {
    expect(rotuloPagina(8, 573)).toBe("Página 8 de 573");
  });
});
