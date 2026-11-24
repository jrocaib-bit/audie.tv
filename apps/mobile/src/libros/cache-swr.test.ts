import { beforeEach, describe, expect, it, vi } from "vitest";
import { POLITICAS, VERSION_CACHE, cargarSwr, claveCache, escribirCache, leerCache, vaciarMemoriaCache, type AlmacenClaves } from "./cache-swr";

function almacen(): AlmacenClaves & { datos: Map<string, string> } {
  const datos = new Map<string, string>();
  return { datos, getItem: async (k) => datos.get(k) ?? null, setItem: async (k, v) => void datos.set(k, v) };
}
const validar = (x: unknown) => (Array.isArray(x) && x.length > 0 ? (x as number[]) : null);
const politica = { fresco: 1000, maximo: 10_000 };

beforeEach(() => vaciarMemoriaCache());

describe("claves y sobre", () => {
  it("la clave lleva versión y el id del libro", () => {
    expect(claveCache("libro", "gen-x")).toBe(`audite.libros.cache.v${VERSION_CACHE}.libro.gen-x`);
    expect(claveCache("estanteria")).toBe(`audite.libros.cache.v${VERSION_CACHE}.estanteria`);
  });
  it("lee lo escrito y marca fresco o caducado", async () => {
    const a = almacen();
    await escribirCache(a, "k", [1, 2], () => 1000);
    expect((await leerCache(a, "k", politica, validar, () => 1500))?.fresco).toBe(true);
    expect((await leerCache(a, "k", politica, validar, () => 3000))?.fresco).toBe(false);
  });
  it("descarta lo demasiado viejo, lo de otra versión y lo que no valida", async () => {
    const a = almacen();
    await escribirCache(a, "k", [1], () => 0);
    expect(await leerCache(a, "k", politica, validar, () => 20_000)).toBeNull();
    a.datos.set("v", JSON.stringify({ v: 1, t: 0, d: [1] }));
    expect(await leerCache(a, "v", politica, validar, () => 1)).toBeNull();
    await escribirCache(a, "m", { raro: true }, () => 0);
    expect(await leerCache(a, "m", politica, validar, () => 1)).toBeNull();
    a.datos.set("roto", "{no");
    expect(await leerCache(a, "roto", politica, validar)).toBeNull();
  });
  it("las políticas son razonables", () => {
    for (const p of Object.values(POLITICAS)) expect(p.fresco).toBeLessThan(p.maximo);
  });
});

describe("cargarSwr", () => {
  it("primera visita: pide a la red y guarda", async () => {
    const a = almacen();
    const traer = vi.fn(async () => [7]);
    const r = await cargarSwr({ almacen: a, clave: "k", politica, validar, traer, ahora: () => 5 });
    expect(r).toEqual({ dato: [7], origen: "red" });
    expect(a.datos.has("k")).toBe(true);
  });
  it("segunda visita con dato fresco: no pide a la red", async () => {
    const a = almacen();
    await escribirCache(a, "k", [1], () => 100);
    const traer = vi.fn(async () => [2]);
    const r = await cargarSwr({ almacen: a, clave: "k", politica, validar, traer, ahora: () => 500 });
    expect(r.dato).toEqual([1]);
    expect(traer).not.toHaveBeenCalled();
  });
  it("dato caducado: lo entrega al instante y lo refresca", async () => {
    const a = almacen();
    await escribirCache(a, "k", [1], () => 0);
    const vistos: number[][] = [];
    const r = await cargarSwr({ almacen: a, clave: "k", politica, validar, traer: async () => [2], alDato: (l) => vistos.push(l.dato), ahora: () => 5000 });
    expect(vistos).toEqual([[1]]);
    expect(r).toEqual({ dato: [2], origen: "red" });
  });
  it("si la red falla conserva el último dato bueno", async () => {
    const a = almacen();
    await escribirCache(a, "k", [1], () => 0);
    const r = await cargarSwr({ almacen: a, clave: "k", politica, validar, traer: async () => { throw new Error("sin red"); }, ahora: () => 5000 });
    expect(r).toEqual({ dato: [1], origen: "cache-vieja" });
  });
  it("sin caché y sin red devuelve nada", async () => {
    const r = await cargarSwr({ almacen: almacen(), clave: "k", politica, validar, traer: async () => null });
    expect(r).toEqual({ dato: null, origen: "nada" });
  });
  it("una respuesta que no valida no pisa la caché", async () => {
    const a = almacen();
    await escribirCache(a, "k", [1], () => 0);
    const r = await cargarSwr({ almacen: a, clave: "k", politica, validar, traer: async () => [] as number[], ahora: () => 5000 });
    expect(r.dato).toEqual([1]);
  });
  it("la memoria de la sesión responde sin tocar el disco", async () => {
    const a = almacen();
    await cargarSwr({ almacen: a, clave: "k", politica, validar, traer: async () => [3], ahora: () => 10 });
    a.datos.clear();
    const traer = vi.fn(async () => [9]);
    const r = await cargarSwr({ almacen: a, clave: "k", politica, validar, traer, ahora: () => 20 });
    expect(r).toEqual({ dato: [3], origen: "memoria" });
    expect(traer).not.toHaveBeenCalled();
  });
});
