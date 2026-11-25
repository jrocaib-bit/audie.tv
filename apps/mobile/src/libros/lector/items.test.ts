import type { EntradaIndice } from "@audite/domain";
import { describe, expect, it } from "vitest";
import { construirItems, primerBloqueDePagina, ubicarAncla } from "./items";

const entrada = (id: string, orden: number, adelanto: boolean): EntradaIndice => ({ id, tipo: id === "prologo" ? "prologo" : "capitulo", orden, numero: orden || null, titulo: id, es_adelanto: adelanto });
const bloques = (n: number) => ({ bloques: Array.from({ length: n }, (_, i) => ({ id: `b${i}`, tipo: "parrafo" as const })) });
// título 1 línea y cada bloque 4 líneas.
const medidas = (n: number) => [1, ...Array.from({ length: n }, () => 4)];
const base = { tamano: 18, altoPagina: 400, bloqueados: new Set<string>() };

describe("construirItems", () => {
  const indice = [entrada("prologo", 0, true), entrada("capitulo-01", 1, false), entrada("capitulo-02", 2, false)];
  it("sin suscripción termina con la página de corte tras el adelanto", () => {
    const plan = construirItems({ ...base, indice, premium: false, capitulos: { prologo: bloques(10) }, medidas: { prologo: medidas(10) } });
    expect(plan.items.at(-1)?.tipo).toBe("corte");
    expect(plan.items.filter((i) => i.tipo === "corte")).toHaveLength(1);
    expect(plan.items.some((i) => i.capId === "capitulo-02")).toBe(false);
    expect(plan.total).toBe(plan.items.filter((i) => i.tipo === "texto").length);
  });
  it("las páginas se numeran seguidas y el capítulo siguiente abre donde acaba el anterior", () => {
    const plan = construirItems({ ...base, indice, premium: true, capitulos: { prologo: bloques(10), "capitulo-01": bloques(10), "capitulo-02": bloques(10) }, medidas: { prologo: medidas(10), "capitulo-01": medidas(10), "capitulo-02": medidas(10) } });
    const numeros = plan.items.map((i) => i.numero);
    expect(numeros).toEqual([...numeros].sort((a, b) => a - b));
    expect(plan.inicios.prologo).toBe(1);
    const paginasPrologo = plan.items.filter((i) => i.capId === "prologo").length;
    expect(plan.inicios["capitulo-01"]).toBe(paginasPrologo + 1);
    expect(plan.total).toBe(plan.items.length);
  });
  it("un capítulo sin cargar deja una página de espera y no da número de página a los siguientes", () => {
    const plan = construirItems({ ...base, indice, premium: true, capitulos: { prologo: bloques(10), "capitulo-02": bloques(10) }, medidas: { prologo: medidas(10), "capitulo-02": medidas(10) } });
    expect(plan.items.find((i) => i.capId === "capitulo-01")?.tipo).toBe("cargando");
    expect(plan.inicios["capitulo-01"]).toBeDefined();
    expect(plan.inicios["capitulo-02"]).toBeUndefined();
  });
  it("un capítulo bloqueado por el servidor cierra con el corte", () => {
    const plan = construirItems({ ...base, indice, premium: true, bloqueados: new Set(["capitulo-01"]), capitulos: { prologo: bloques(3) }, medidas: { prologo: medidas(3) } });
    expect(plan.items.map((i) => i.tipo).at(-1)).toBe("corte");
    expect(plan.items.some((i) => i.capId === "capitulo-02")).toBe(false);
  });
  it("una medida que no encaja con el capítulo se ignora hasta volver a medir", () => {
    const plan = construirItems({ ...base, indice: [entrada("prologo", 0, true)], premium: true, capitulos: { prologo: bloques(10) }, medidas: { prologo: medidas(4) } });
    expect(plan.items.map((i) => i.tipo)).toEqual(["cargando"]);
  });
  it("letra más grande da más páginas", () => {
    const uno = construirItems({ ...base, indice: [entrada("prologo", 0, true)], premium: true, capitulos: { prologo: bloques(30) }, medidas: { prologo: medidas(30) } });
    const dos = construirItems({ ...base, tamano: 23, indice: [entrada("prologo", 0, true)], premium: true, capitulos: { prologo: bloques(30) }, medidas: { prologo: [1, ...Array.from({ length: 30 }, () => 6)] } });
    expect(dos.total).toBeGreaterThan(uno.total);
  });
});

describe("ancla", () => {
  const indice = [entrada("prologo", 0, true)];
  const plan = construirItems({ ...base, indice, premium: true, capitulos: { prologo: bloques(20) }, medidas: { prologo: medidas(20) } });
  it("encuentra la página de un bloque y la primera del capítulo", () => {
    const i = ubicarAncla(plan.items, "prologo", 15);
    expect(i).toBeGreaterThan(0);
    expect(plan.items[i]?.tipo === "texto" && plan.items[i].fragmentos.some((f) => f.bloque === 16)).toBe(true);
    expect(ubicarAncla(plan.items, "prologo", null)).toBe(0);
    expect(ubicarAncla(plan.items, "otro", null)).toBe(-1);
    expect(ubicarAncla(plan.items, null, null)).toBe(-1);
  });
  it("el primer bloque de una página es el que se guarda como progreso", () => {
    expect(primerBloqueDePagina(plan.items[0])).toBe(0);
    const i = ubicarAncla(plan.items, "prologo", 15);
    expect(primerBloqueDePagina(plan.items[i])).toBeLessThanOrEqual(15);
    expect(primerBloqueDePagina(undefined)).toBeNull();
  });
});
