import { describe, expect, it } from "vitest";
import indice from "../../../content/canon/catalogo-indice.json";
import type { Rango } from "./caminos";
import { construirCola, infoPaso, nombreContexto, parseContexto, planVentana, posicionEn, siguientes, textoContexto, vecino, type FuentesCola, type NombresCola } from "./cola";
import { decidirReproduccion } from "./acceso";
import { episodiosDeReto } from "./acceso";

const rangos = indice.rangos as Rango[];
const f: FuentesCola = { rangos, pasosReto: episodiosDeReto };
const nombres: NombresCola = { libro: (id) => (id === "gn" ? "Génesis" : undefined), reto: () => undefined };
const todos = () => true;

describe("cola según el contexto", () => {
  it("camino: la Biblia entera son los 516 en orden; un camino corto, sus libros", () => {
    const biblia = construirCola({ tipo: "camino", id: "biblia" }, f);
    expect(biblia).toHaveLength(516);
    expect(biblia[0]).toBe("gn-01");
    expect(construirCola({ tipo: "camino", id: "evangelios" }, f)[0]).toMatch(/^mt-/);
  });
  it("libro: los episodios de ese libro", () => {
    const gn = construirCola({ tipo: "libro", id: "gn" }, f);
    expect(gn).toHaveLength(22);
    expect(gn.every((id) => id.startsWith("gn-"))).toBe(true);
  });
  it("reto: los pasos en orden con las repeticiones", () => {
    const adv = construirCola({ tipo: "reto", id: "adviento-isaias" }, f);
    expect(adv).toHaveLength(26);
    expect(adv.slice(0, 4)).toEqual(["is-01", "is-02", "is-02", "is-03"]);
  });
  it("ids explícitos mandan", () => {
    expect(construirCola({ tipo: "libro", id: "gn", ids: ["gn-05", "gn-06"] }, f)).toEqual(["gn-05", "gn-06"]);
  });
  it("parseContexto descarta basura", () => {
    expect(parseContexto({ tipo: "reto", id: "adviento-isaias", pos: 3 })).toEqual({ tipo: "reto", id: "adviento-isaias", pos: 3 });
    expect(parseContexto({ tipo: "otro", id: "x" })).toEqual({ tipo: "camino", id: "biblia" });
    expect(parseContexto({ tipo: "libro", id: "../x" })).toEqual({ tipo: "camino", id: "biblia" });
    expect(parseContexto(null)).toEqual({ tipo: "camino", id: "biblia" });
    expect(parseContexto({ tipo: "libro", id: "gn", pos: -2, ids: ["gn-01", 4, "../a"] })).toEqual({ tipo: "libro", id: "gn", ids: ["gn-01"] });
  });
});

describe("navegación", () => {
  const adv = construirCola({ tipo: "reto", id: "adviento-isaias" }, f);
  it("no repite el mismo episodio dos veces seguidas", () => {
    expect(vecino(adv, 1, 1, todos)).toEqual({ pos: 3, id: "is-03" });
    expect(vecino(adv, 2, -1, todos)).toEqual({ pos: 0, id: "is-01" });
  });
  it("salta los episodios sin audio y devuelve null al final", () => {
    const cola = ["a", "b", "c", "d"];
    expect(vecino(cola, 0, 1, (id) => id !== "b")).toEqual({ pos: 2, id: "c" });
    expect(vecino(cola, 0, 1, (id) => id === "a")).toBeNull();
    expect(vecino(cola, 0, -1, todos)).toBeNull();
    expect(vecino(cola, 3, 1, todos)).toBeNull();
  });
  it("posicionEn usa la pista cuando hay repetidos", () => {
    expect(posicionEn(adv, "is-02", 2)).toBe(2);
    expect(posicionEn(adv, "is-02", 0)).toBe(1);
    expect(posicionEn(adv, "is-02", 5)).toBe(1);
    expect(posicionEn(adv, "zz", 0)).toBe(-1);
  });
  it("ventana nativa: anterior, actual y dos siguientes con audio", () => {
    const cola = ["a", "b", "c", "d", "e"];
    const w = planVentana(cola, 2, (id) => id !== "d");
    expect(w.anterior?.id).toBe("b");
    expect(w.actual).toEqual({ pos: 2, id: "c" });
    expect(w.siguientes.map((s) => s.id)).toEqual(["e"]);
    expect(siguientes(cola, 0, todos, 2).map((s) => s.id)).toEqual(["b", "c"]);
  });
  it("el siguiente bloqueado por la puerta no entra en la ventana de quien no tiene cuenta", () => {
    const permitido = (id: string) => decidirReproduccion({ id, grabado: true, haySesion: false }) === "play";
    expect(siguientes(["gn-01", "gn-02"], 0, permitido, 2)).toEqual([]);
    const conCuenta = (id: string) => decidirReproduccion({ id, grabado: true, haySesion: true }) === "play";
    expect(siguientes(["is-01", "is-02", "is-03"], 0, conCuenta, 2).map((s) => s.id)).toEqual(["is-02", "is-03"]);
  });
});

describe("textos del contexto", () => {
  const cola = construirCola({ tipo: "camino", id: "biblia" }, f);
  it("paso, total y faltan", () => {
    const info = infoPaso(cola, 290, (id) => id === "gn-01");
    expect(info).toMatchObject({ paso: 291, total: 516, faltan: 225, hechos: 1 });
    expect(textoContexto({ tipo: "camino", id: "biblia" }, info, "es", nombres, { faltan: true })).toBe("Biblia entera · paso 291 de 516 · faltan 225");
    expect(textoContexto({ tipo: "camino", id: "biblia" }, info, "en", nombres, { faltan: true })).toBe("Whole Bible · step 291 of 516 · 225 to go");
  });
  it("reto: «día» en pantalla y «paso» en la pantalla de bloqueo", () => {
    const info = infoPaso(adv(), 2, () => false);
    expect(textoContexto({ tipo: "reto", id: "adviento-isaias" }, info, "es", nombres, { faltan: true })).toBe("Reto de Adviento · día 3 de 26 · faltan 23");
    expect(textoContexto({ tipo: "reto", id: "adviento-isaias" }, info, "es", nombres, { palabra: "paso" })).toBe("Reto de Adviento · paso 3 de 26");
    expect(textoContexto({ tipo: "reto", id: "adviento-isaias" }, info, "en", nombres, { faltan: true })).toBe("Advent challenge · day 3 of 26 · 23 to go");
  });
  it("libro y nombres", () => {
    const info = infoPaso(construirCola({ tipo: "libro", id: "gn" }, f), 3, () => false);
    expect(textoContexto({ tipo: "libro", id: "gn" }, info, "es", nombres, { faltan: true })).toBe("Génesis · episodio 4 de 22 · faltan 18");
    expect(nombreContexto({ tipo: "camino", id: "salmos" }, "es", nombres)).toBe("Salmos");
    expect(infoPaso([], 0, () => false)).toMatchObject({ total: 0, fraccion: 0, paso: 1 });
  });
});

function adv() {
  return construirCola({ tipo: "reto", id: "adviento-isaias" }, f);
}
